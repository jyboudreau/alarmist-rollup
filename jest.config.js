module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['**/src/**/*.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  projects: ['<rootDir>/packages/alarmist-rollup']
}
