// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Type-aware linting: the rules that catch a misused Promise or an unchecked `any` need the
// program, and `strict: true` in tsconfig.json only covers what the compiler sees.
export default tseslint.config(
  // src/generated/ is the Prisma client. It ships its own `/* eslint-disable */`, so linting it
  // reports nothing either way — skipping it just keeps the type-aware pass off 350 KB of code
  // nobody in this repository writes.
  { ignores: ['dist/', 'src/generated/', 'eslint.config.mjs', 'jest.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Last, so it switches off the rules Prettier already decides.
  prettier,
  {
    languageOptions: {
      parserOptions: {
        // `allowDefaultProject` is what puts prisma.config.ts under the type-aware rules: it is
        // TypeScript that imports application code, so it can be wrong in the same ways, but it
        // sits outside tsconfig.json's `src/**/*` include and would otherwise be skipped.
        projectService: { allowDefaultProject: ['prisma.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
