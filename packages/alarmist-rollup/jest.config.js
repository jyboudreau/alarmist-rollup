module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['jest-mock-console/dist/setupTestFramework.js'],
  testMatch: ['**/test/**/*.test.js']
}
