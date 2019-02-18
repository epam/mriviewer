module.exports = {
  root: false,
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    'shared-node-browser': true,
    mocha: true,
  },
  rules: {
    "no-unused-expressions": 0,
    "padded-blocks": 0,
  },
};
