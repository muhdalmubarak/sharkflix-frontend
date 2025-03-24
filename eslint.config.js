// eslint.config.js
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig([
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module'
        },
        rules: {
            'react/prop-types': 'off', // Optional: If using TypeScript, prop-types are often unnecessary
            // eslint:recommended
            'no-unused-vars': 'warn',
            'no-console': 'warn',
            'no-debugger': 'warn',
            'curly': 'warn',
        },
        settings: {
            react: {
                version: 'detect', // Automatically detect React version
            },
        },
        ignores: ['.next/**', 'node_modules/**'], // Ignore .next and node_modules directories
    },
]);
