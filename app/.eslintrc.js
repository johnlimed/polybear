module.exports = {
  "extends": "airbnb",
  "installedESLint": true,
  "parserOptions": {
    "allowImportExportEverywhere": true
  },
  "plugins": [
    "import",
  ],
  "env": {
    "node": true,
  },
  "rules": {
    "no-undef": [2],
    "no-underscore-dangle": ["error", { "allow": ["_id"] }],
    'import/extensions': ['error', 'always', {
      js: 'always',
      jsx: 'always',
    }],
    "indent": 0,
    "no-tabs": 0,
    "no-console": 0,
    "func-names": 0,
    "import/no-extraneous-dependencies": 0,
    "import/extensions": 0,
    "no-undef": 0,
    "max-len": 0,
    "no-param-reassign": ["error", { "props": false }],
    "radix": 0
  },
};
