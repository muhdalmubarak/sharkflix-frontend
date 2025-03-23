// eslint.config.js
const {defineConfig} = require('eslint-define-config');

module.exports = defineConfig({
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        'semi': ['error', 'always'],
    },
    settings: {
        react: {
            version: 'detect',  // Automatically detect React version
        },
    },
    ignores: ['.next/**', 'node_modules/**'],  // Ignore .next and node_modules directories
});
