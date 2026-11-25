import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import react from '@eslint-react/eslint-plugin';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['build/**', 'dist/**', 'coverage/**', 'node_modules/**'],
  },

  // JavaScript and TypeScript base configuration
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // TypeScript and React
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommended,
      react.configs['recommended-typescript'],
      react.configs['disable-conflict-eslint-plugin-react-hooks'],
      reactHooks.configs.flat.recommended,
      jsxA11yX.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // Vitest globals in test files
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
]);
