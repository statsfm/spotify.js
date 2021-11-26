module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['@tribecamp/base', '@tribecamp/typescript', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    camelcase: 'off',
    'no-param-reassign': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/require-description-complete-sentence': 'off',
    'no-loops/no-loops': 'off'
  }
};
