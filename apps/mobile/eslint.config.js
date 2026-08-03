const expo = require('eslint-config-expo/flat')

const config = [
  {
    ignores: ['.expo/**', 'node_modules/**', 'expo-env.d.ts'],
  },
  ...expo,
]

module.exports = config
