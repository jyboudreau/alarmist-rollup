module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!**/node_modules/**', '!**/vendor/**'],
  coverageDirectory: 'coverage',
  rootDir: '.',
  transform: { '^.+\\.js$': require.resolve('./jest-esm-transform.js') },
  testMatch: ['**/test/**/*.spec.js']
}
