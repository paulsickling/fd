import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * The data-layer guardrail below is not style enforcement — it is how SPEC.md CAP-7
 * ("the JSON source is swappable for a real API") stays demonstrable. If any component
 * could import seed JSON or call fetch directly, the repository interface would be a
 * convention rather than a boundary, and the swap would quietly stop being a one-line
 * change. Violating it must fail the build, not rely on discipline.
 */
const dataLayerGuardrail = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/data/**', 'src/test/**', 'src/**/*.{test,spec}.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['*.json', '**/*.json'],
            message:
              'Data must not be imported directly. Read it through the DataRepository interface in src/data (SPEC.md CAP-7).',
          },
          {
            group: ['@/data/json/*', '@/data/remote/*', '**/data/json/*', '**/data/remote/*'],
            message:
              'Do not reach into a concrete repository adapter. Depend on the DataRepository interface and let the composition root choose the implementation (SPEC.md CAP-7).',
          },
        ],
      },
    ],
    'no-restricted-globals': [
      'error',
      {
        name: 'fetch',
        message:
          'Network access belongs in a DataRepository adapter under src/data, never in domain, feature or component code (SPEC.md CAP-7).',
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: 'fetch',
        message:
          'Network access belongs in a DataRepository adapter under src/data (SPEC.md CAP-7).',
      },
    ],
  },
};

/** domain/ is pure: no React, no data-source knowledge. That is what makes it trivially unit-testable. */
const domainPurity = {
  files: ['src/domain/**/*.{ts,tsx}'],
  ignores: ['src/domain/**/*.{test,spec}.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'react', message: 'src/domain must stay free of React — it is pure functions over the domain types (stack.md).' },
          { name: 'react-dom', message: 'src/domain must stay free of React (stack.md).' },
          { name: 'react-router-dom', message: 'src/domain must stay free of routing concerns (stack.md).' },
          { name: '@tanstack/react-query', message: 'src/domain must stay free of data-fetching concerns (stack.md).' },
        ],
        patterns: [
          {
            group: ['@/data/*', '**/data/*', '*.json', '**/*.json'],
            message: 'src/domain must not know where data comes from (stack.md).',
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  dataLayerGuardrail,
  domainPurity,
);
