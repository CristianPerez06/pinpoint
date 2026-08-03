// Metro needs to be told this is a monorepo. Without both settings it resolves
// only inside apps/mobile and cannot see packages/* — which is the failure this
// shell exists to catch early.
const path = require('node:path')

const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole workspace so edits in packages/* trigger a rebuild.
config.watchFolders = [workspaceRoot]

// Resolve from the app first, then the hoisted root store.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
