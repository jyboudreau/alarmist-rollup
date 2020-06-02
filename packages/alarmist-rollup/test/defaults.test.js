/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { expect, test } = require('@jest/globals')

const { getDefaults } = require('../src/defaults.js')

test('getDefaults returns default object', () => {
  expect(getDefaults()).toMatchInlineSnapshot(`
    Object {
      "configFile": "rollup.config.js",
      "debounceWait": 1000,
      "name": "rollup",
      "workingDir": ".alarmist",
    }
  `)
})

test('getDefaults takes values from env variables if exist', () => {
  const oldEnv = process.env
  try {
    // Need this so that process is reset properly since it's implicitely loaded.
    jest.resetModules()

    // Make a copy of the old env.
    process.env = { ...oldEnv }

    process.env.ALARMIST_ROLLUP_NAME = 'envName'
    process.env.ALARMIST_ROLLUP_CONFIG = 'envConfig.js'
    process.env.ALARMIST_ROLLUP_DEBOUNCE_WAIT = '1234'
    process.env.ALARMIST_WORKING_DIRECTORY = '.envWorkingDir'

    expect(getDefaults()).toMatchInlineSnapshot(`
      Object {
        "configFile": "envConfig.js",
        "debounceWait": 1234,
        "name": "envName",
        "workingDir": ".envWorkingDir",
      }
    `)
  } finally {
    process.env = oldEnv
  }
})
