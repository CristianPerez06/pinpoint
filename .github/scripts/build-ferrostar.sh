#!/usr/bin/env bash
#
# Builds Ferrostar's React Native packages from a tagged release, for the phone
# app (`monorepo-structure`: a native package that is not published is built once
# and installed ready-made).
#
# Stadia has not published these to npm yet (stadiamaps/ferrostar#961). Until
# they do, the two archives this prints are attached to the GitHub release
# `ferrostar-rn-<tag>` on this repository, and `apps/mobile/package.json` names
# them by URL. Nobody installing the workspace runs this; only whoever rebuilds
# the archives does, and only on a Mac, because the iOS half needs Xcode.
#
# It follows the recipe in the `prepublish` script of Ferrostar's own `uniffi`
# package, which is what Stadia will run when they publish.
#
# Usage: .github/scripts/build-ferrostar.sh [output-directory]

set -euo pipefail

TAG=0.57.0
REPO=https://github.com/stadiamaps/ferrostar.git
OUT=${1:-${TMPDIR:-/tmp}/pinpoint-ferrostar/dist}
WORK=${TMPDIR:-/tmp}/pinpoint-ferrostar/src

# --- What it needs, checked before anything is built --------------------------

missing=()
for tool in git rustup cargo cargo-ndk bun node xcodebuild; do
  command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
done

ndk=${ANDROID_NDK_HOME:-}
if [[ -z $ndk && -n ${ANDROID_HOME:-} && -d $ANDROID_HOME/ndk ]]; then
  ndk=$(ls -d "$ANDROID_HOME"/ndk/* 2>/dev/null | sort -V | tail -1)
fi
[[ -n $ndk && -d $ndk ]] || missing+=("the Android NDK (set ANDROID_NDK_HOME, or install one under \$ANDROID_HOME/ndk)")

if ((${#missing[@]})); then
  echo "build-ferrostar: cannot build, missing:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  echo "Rust comes from https://rustup.rs, then 'cargo install cargo-ndk'; bun from https://bun.sh." >&2
  exit 1
fi
export ANDROID_NDK_HOME=$ndk

# --- Source, at the pinned tag ------------------------------------------------

rm -rf "$WORK"
mkdir -p "$WORK" "$OUT"
git clone --depth 1 --branch "$TAG" "$REPO" "$WORK"

# The platforms in Ferrostar's `ubrn.config.yaml`. Its `rust-toolchain.toml`
# names them too, but sits in `common/`, which the build is not run from, so
# rustup never reads it and the first Android crate fails with "can't find
# crate for `core`".
rustup target add \
  aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios \
  aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

cd "$WORK/react-native"
bun install --frozen-lockfile

# --- The bindings: Rust core for every platform, then their JavaScript --------

(
  cd uniffi
  # Ferrostar's check that the libraries match the bindings finds the end of
  # the bindings' declarations by one exact spacing, `}\n\nnamespace`, and the
  # generator at this tag writes `}\n\n\nnamespace`. It then fails with "could
  # not locate the generated UniFFI declarations" after a build that worked.
  # Accept any number of blank lines; the check itself is kept.
  node --input-type=module -e "
    import { readFileSync, writeFileSync } from 'node:fs'
    const file = 'scripts/verify-native-artifacts.mjs'
    const before = readFileSync(file, 'utf8')
    const after = before.replace(
      /const externEnd = generatedCpp\.indexOf\([\s\S]*?externStart\s*\);/,
      'const externAt = generatedCpp.slice(externStart).search(/\\\\n}\\\\n(?:\\\\n)+namespace uniffi::ferrostar/);\nconst externEnd = externAt < 0 ? -1 : externStart + externAt;',
    )
    if (after === before) throw new Error('verify-native-artifacts.mjs has changed; review the patch above')
    writeFileSync(file, after)
  "
  bun run ubrn:clean
  bun run clean
  bun run ubrn:android --release
  bun run ubrn:ios --release
  bun run verify:native
  bun run build
  bun run codegen
)

# --- Core: plain TypeScript over the bindings ---------------------------------

(cd core && bun run build)

# Core lists the bindings as a dependency by name, and they are on no registry.
# pnpm 11 will not take a dependency's own dependency from a URL
# (`blockExoticSubdeps`), and lifting that for the whole workspace is the wrong
# price, so core asks for them as a peer instead and the app supplies them.
# Core's code is untouched; only its manifest is changed.
(
  cd core
  node --input-type=module -e "
    import { readFileSync, writeFileSync } from 'node:fs'
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    const name = '@stadiamaps/ferrostar-uniffi-react-native'
    if (!pkg.dependencies?.[name]) throw new Error('core no longer depends on ' + name + '; review this step')
    pkg.peerDependencies = { ...pkg.peerDependencies, [name]: pkg.dependencies[name] }
    delete pkg.dependencies[name]
    if (Object.keys(pkg.dependencies).length === 0) delete pkg.dependencies
    // Its types point at its TypeScript source, so an app's typecheck compiles
    // that source under the app's own settings and fails inside Ferrostar. The
    // declarations its build writes are what a consumer should read.
    pkg.types = './lib/index.d.ts'
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
  "
)

# --- Pack ---------------------------------------------------------------------

for pkg in uniffi core; do
  (cd "$pkg" && npm pack --pack-destination "$OUT" >/dev/null)
done

echo
echo "Built Ferrostar $TAG into $OUT:"
for file in "$OUT"/*.tgz; do
  echo "  $file"
  echo "    sha512-$(openssl dgst -sha512 -binary "$file" | openssl base64 -A)"
done
