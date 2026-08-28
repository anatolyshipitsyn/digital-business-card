// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Type-aware linting: the rules that catch a misused Promise or an unchecked `any` need the
// program, and `strict: true` in tsconfig.json only covers what the compiler sees.
export default tseslint.config(
  { ignores: ['dist/', 'eslint.config.mjs', 'jest.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Last, so it switches off the rules Prettier already decides.
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
