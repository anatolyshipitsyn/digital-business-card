// Jest reads TypeScript through ts-jest against the repository's own tsconfig.json — the wide one
// that includes the specs, not tsconfig.build.json, which excludes them so that no compiled test
// reaches dist/ and the runtime image.
//
// `@types/jest` is deliberately absent: the specs import `describe`, `it` and `expect` from
// `@jest/globals`, which ships with Jest and carries its own types. Globals would have meant a
// third package and a `types` entry in tsconfig.json that every source file then pays for.
export default {
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
    // @nestjs/config@12 ships ESM only. The application is unaffected — it compiles to CommonJS
    // and Node 22 resolves `require()` of an ES module — but Jest's own module registry does not,
    // and a spec that reaches `registerAs` fails on `Unexpected token 'export'`. So that one
    // package is transpiled to CommonJS on the way in, which is why it has to be carved out of
    // transformIgnorePatterns below: Jest skips node_modules by default.
    '^.+\\.js$': ['ts-jest', { tsconfig: { allowJs: true, module: 'commonjs', target: 'ES2023' } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!@nestjs/config/)'],
};
