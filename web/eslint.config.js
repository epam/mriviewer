import js from '@eslint/js';
import { fixupPluginRules } from '@eslint/compat';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import react from '@eslint-react/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.vitest, shallow: 'readonly' },
    },
    // Keep Prettier 2's formatting while adapting its plugin to ESLint 10's rule API.
    plugins: { '@eslint-react': react, prettier: fixupPluginRules(prettier), '@typescript-eslint': tsPlugin },
    settings: { 'react-x': { version: '18.3.1' } },
    // Preserve existing suppressions in legacy rendering and loader code.
    linterOptions: { reportUnusedDisableDirectives: false },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      // Keep the existing React 18/class-component policy with the replacement plugin.
      'no-case-declarations': 'off',
      'linebreak-style': 'off',
      'no-unused-vars': 'off',
      'no-alert': 'off',
      'no-underscore-dangle': 'off',
      'vars-on-top': 'off',
      'space-before-function-paren': ['warn', 'never'],
      'no-mixed-operators': 'off',
      'key-spacing': 'off',
      'spaced-comment': 'off',
      'func-names': 'off',
      'padded-blocks': 'off',
      'quote-props': 'off',
      'one-var-declaration-per-line': 'off',
      'max-len': [1, 200, 2, { ignoreComments: true }],
      'object-curly-spacing': ['error', 'always'],
      'no-param-reassign': 'off',
      'one-var': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'comma-dangle': 'off',
      'no-multi-spaces': 'off',
      'no-prototype-builtins': 'off',
      'wrap-iife': ['error', 'any'],
      'no-use-before-define': 'off',
      'object-property-newline': 'off',
      'no-restricted-syntax': 'off',
      'no-else-return': 'off',
      'no-cond-assign': ['error', 'except-parens'],
      'space-infix-ops': ['warn', { int32Hint: true }],
      'no-nested-ternary': 'off',
      'global-require': 'off',
      'no-continue': 'off',
      'no-bitwise': 'off',
      'no-plusplus': 'off',
      'no-multi-assign': 'off',
      'lines-between-class-members': ['off'],
      'no-debugger': 'warn',
      'prettier/prettier': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      '@eslint-react/no-missing-component-display-name': 'error',
      '@eslint-react/jsx-no-children-prop': 'error',
      '@eslint-react/jsx-no-children-prop-with-children': 'error',
      '@eslint-react/jsx-no-comment-textnodes': 'error',
      '@eslint-react/no-component-will-mount': 'error',
      '@eslint-react/no-component-will-receive-props': 'error',
      '@eslint-react/no-component-will-update': 'error',
      '@eslint-react/no-direct-mutation-state': 'error',
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'error',
      '@eslint-react/dom-no-find-dom-node': 'error',
      '@eslint-react/dom-no-render': 'error',
      '@eslint-react/dom-no-render-return-value': 'error',
      '@eslint-react/dom-no-void-elements-with-children': 'error',
      '@eslint-react/dom-no-unsafe-target-blank': 'error',
    },
  },
];
