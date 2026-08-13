---
name: pinpoint-create-pr
description: Create a GitHub pull request for the current branch, with title and body auto-drafted from the commits ahead of main, following the repo's PR template.
user_invocable: true
allowed-tools: Bash
---

# Create PR

Open a GitHub pull request for the current branch. The PR title and body are drafted from the commits unique to the branch and structured to match `.github/PULL_REQUEST_TEMPLATE.md` (Summary / New features / Chores).

## Preconditions

Stop and explain instead of guessing if any of these fails:

- `gh` CLI is installed and authenticated.
- Current branch is not `main` (PRs always come from a feature branch).
- There is at least one commit on the branch ahead of `main`.
- There isn't already an open PR for the current branch.

## Steps

1. **Verify `gh` is installed and authenticated** (must run first — everything else assumes `gh` works):

   ```bash
   gh --version >/dev/null 2>&1 && gh auth status >/dev/null 2>&1
   ```

   If either check fails, STOP immediately and print this message verbatim (with all three platform instructions, since the user's OS isn't always known):

   > The `gh` CLI is not installed and/or not authenticated, so we cannot continue. Install and authenticate first:
   >
   > - **macOS**: `brew install gh && gh auth login`
   > - **Windows**: `winget install --id GitHub.cli` (or `choco install gh`), then `gh auth login`
   > - **Linux**: follow [https://github.com/cli/cli#installation](https://github.com/cli/cli#installation) for your distro, then `gh auth login`
   >
   > After authenticating, verify with `gh auth status` and re-run `/pinpoint-create-pr`.

   Do not attempt to install `gh` yourself — let the user do it (auth is browser-interactive and varies per platform).

2. **Verify branch + branch state** (run in parallel):
   - `git branch --show-current`
   - `git status -sb`
   - `git log main..HEAD --pretty=format:'%H %s'`
   - `git diff main..HEAD --stat`
   - `gh pr list --head $(git branch --show-current) --json number,url 2>/dev/null`

   If `git branch --show-current` returns `main`, stop and explain.

   If `gh pr list` returns an existing PR, surface its URL and stop. Don't create a duplicate.

   If `git log main..HEAD` is empty, stop and tell the user the branch has no commits ahead of main.

3. **Handle uncommitted changes**: if `git status -sb` shows uncommitted files (modified, staged, or untracked that aren't gitignored):
   - List them.
   - Ask the user whether to commit them first (offer to invoke the `suggest-branch-and-commit` skill), stash them, or proceed without them.
   - Do not silently include uncommitted work in the PR.

4. **Ensure the branch is pushed**: if `git status -sb` shows the branch isn't tracking a remote, or shows commits ahead of origin, run `git push -u origin <current-branch>`.

5. **Synthesize the title**:
   - If exactly one commit on the branch: use its subject line verbatim (it should already follow conventional commit format).
   - If multiple commits: construct a single conventional-commit-style title that captures the dominant theme. Lean on the most substantive commit. Keep under 70 chars. Lowercase after the colon.
   - Strip trailing periods.

6. **Synthesize the body by filling in `.github/PULL_REQUEST_TEMPLATE.md`**. Read the template
   from disk rather than working from memory — it is the source of truth and it changes.
   Keep its headings, in its order, and fill each one:

   - **🎯 What does this PR do?** — 1–2 sentences on the change and its intent. Read the
     diff, not just the commit subjects. Describe the change, not "this PR".
   - **🔗 Ticket** — fill in only if the branch, commits or the user mention an issue.
     Otherwise delete the whole section; an empty "Ticket:" line looks like an oversight
     and the ticket→Done workflow reads this section.
   - **🧩 Type of change** — tick exactly one, from the dominant commit type.
   - **📐 OpenSpec** — if the diff touches `openspec/`, name the change and tick what is
     genuinely true. **Verify each box rather than ticking it optimistically**: check the
     change is archived, that no `## ADDED/MODIFIED` sections remain, and that no `Purpose`
     still says `TBD`. Delete the section if no specs are touched.
   - **📸 Screenshots / videos** — you cannot take these. Leave the headings and say plainly
     that they are for the author to attach, or delete the section if the diff is not UI.
   - **🧪 How to test it** — real steps someone else can follow: what to run, where to look,
     what should happen. Not "run the app".
   - **✅ Pre-merge checklist** — tick only what you actually ran and saw pass, and say so in
     the notes if you ran the suite. Leave unticked anything you could not verify. A ticked
     box that nobody checked is worse than an empty one.
   - **💬 Notes for the reviewer** — trade-offs, anything skipped, anything you were unsure
     of. Delete if there is genuinely nothing.

   Sections the template marks optional should be **deleted when they do not apply**, not
   left as empty headings.

7. **Show the user the draft and confirm**:
   - Print the proposed title.
   - Print the proposed body.
   - Ask: "Create this PR?" — accept y/n or "edit" (in which case ask what to change and regenerate).

8. **On confirmation, create the PR**:

   ```bash
   gh pr create --title "<title>" --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```

   Use a HEREDOC for the body to preserve formatting and avoid quote-escaping problems.

9. **Report the PR URL** back to the user as the final output.

## Conventions

- The repo's PR template (`.github/PULL_REQUEST_TEMPLATE.md`) is the source of truth for body structure. Read it from disk each time; if it changes, follow it.
- Conventional commit type → "🧩 Type of change" mapping:
  - `feat` → 🧩 New feature
  - `fix` → 🐞 Bug fix
  - `refactor`, `perf`, `style` → ⚙️ Improvement / refactor
  - `docs` → 📄 Documentation
  - `ci`, `chore`, `build`, `test` → 🔧 Config / CI
  - a change that only proposes or archives an OpenSpec change → 🗂️ OpenSpec
- Pick the one that matches the dominant commit, not every box that could arguably apply.
- Empty sections are omitted from the body. Don't leave "New features\n\n- " stubs.
- If the branch is messy (many WIP commits, unclear messages), suggest the user squash + rewrite via `git rebase -i main` before creating the PR. A clean branch makes the body draft itself.

## Edge cases

- **`gh` not installed / not authenticated**: handled by Step 1 with the cross-platform install message.
- **No commits ahead of main**: stop. Tell the user the branch has nothing to PR.
- **Existing PR for this branch**: surface its URL instead of creating a duplicate.
- **Repo has CI with required checks**: mention to the user that the PR will run CI on creation; they should wait for green before merging.
- **Merge convention**: this repo uses **Squash and merge** — one commit on `main` per pull request, linear history, no merge commits — see AGENTS.md "Merging to `main`". The squash subject is the PR title in conventional-commit form and the body is left empty, so the PR title is what lands in `main`: it is worth getting right rather than treating as a label. If GitHub branch protection enforces something else, surface the conflict rather than guessing.
