const os = require('os');

module.exports = {
  root: true,
  extends: 'airbnb-base',
  plugins: [
    'import',
  ],

  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jquery: true,
  },

  globals: {
    requirejs: true,
    DEBUG: true,
  },

  // current deviations from AirBnB setup (TODO: revisit later)
  rules: {
    'no-magic-numbers': ['error', {
      'ignore': [-1, 0, 0.5, 1],
      'ignoreArrayIndexes': true,
      'enforceConst': true,
      'detectObjects': false
    }],
    'prefer-destructuring': ['error', {
      'array': false,
      'object': false
    }, {
      'enforceForRenamedProperties': false
    }],
    'no-restricted-globals': ['error', 'event'],
    'indent': ['error', 2, {'SwitchCase': 1}],
    'no-alert': 'off',
    'no-underscore-dangle': 'off', // TODO: consider ['warn', {allowAfterThis: true}]
    'vars-on-top': 'off',
    'space-before-function-paren': ['warn', 'never'],
    'no-mixed-operators': 'off',
    'key-spacing': 'off', // TODO: consider 'warn'
    'spaced-comment': 'off', // TODO: consider ['warn', 'always', {line: {exceptions: ['/']}, block: {exceptions: ['*']}}]
    'func-names': 'off',
    'function-paren-newline': ['error', 'never'],
    'padded-blocks': 'off',
    'quote-props': 'off',
    'one-var-declaration-per-line': 'off',
    'max-len': ['warn', {code: 120, tabWidth: 2}],
    'object-curly-spacing': ['error', 'always'],
    'no-param-reassign': 'off',
    'one-var': 'off',
    'no-undef': 'off',
    'no-console': 'off',
    'comma-dangle': 'off',
    'no-multi-spaces': 'off', // TODO: consider 'warn'
    'no-prototype-builtins': 'off', // TODO: consider 'error'
    'no-unused-vars': ['error', {"argsIgnorePattern": "^_|Ignored$"}],
    'wrap-iife': ['error', 'any'], // TODO: consider specifying one
    'no-use-before-define': ['error', 'nofunc'],
    'object-property-newline': 'off', // TODO: consider 'warn'
    'no-restricted-syntax': 'off',
    'no-else-return': 'off',
    'no-cond-assign': ['error', 'except-parens'],
    'space-infix-ops': ['warn', {int32Hint: true}],
    'no-nested-ternary': 'off',
    'global-require': 'off',
    'linebreak-style': 'off', // ['warn', 'windows'], // BUG: https://youtrack.jetbrains.com/issue/WEB-25487
    'no-continue': 'off',
    'no-bitwise': 'off',
    'no-plusplus': 'off', // TODO: consider ["error", {"allowForLoopAfterthoughts": true}]
    'no-multi-assign': 'off',

    'class-methods-use-this': 'off',
  },

};
