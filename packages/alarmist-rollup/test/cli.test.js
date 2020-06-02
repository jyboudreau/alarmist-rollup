/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { afterEach, beforeEach, expect, test, describe } = require('@jest/globals')
const { default: mockConsole } = require('jest-mock-console')

jest.mock('../src/index.js')

const alarmistRollup = require('../src/index.js')

alarmistRollup.watch = jest.fn()

const { run } = require('../src/cli.js')

beforeEach(() => {
  mockConsole()
  alarmistRollup.watch.mockReset()
})

test('cli help is working', () => {
  run(['--help'])
  expect(alarmistRollup.watch).not.toBeCalled()
  expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
    "Usage: alarmist-rollup [options]

    Start rollup in watch mode. The working directory
    should match the working directory of the monitor and usually this will
    be the default. If the job is started via a watcher started
    by the monitor then the 'ALARMIST_WORKING_DIRECTORY' environment
    variable will have already been set.

    Environment Variables:

    FORCE_COLOR
    NO_COLOR
    ALARMIST_WORKING_DIRECTORY
    ALARMIST_ROLLUP_NAME
    ALARMIST_ROLLUP_CONFIG

    Options:
      --version          Show version number                               [boolean]
      --name, -n         The name to use for the job.            [default: \\"rollup\\"]
      --working-dir, -w  The directory in which to write logs, etc.
                                                              [default: \\".alarmist\\"]
      --config, -c       The Rollup config file path.  [default: \\"rollup.config.js\\"]
      --help             Show help                                         [boolean]"
  `)
})

describe('cli name parameter is passed to watch', () => {
  test('using long form', () => {
    const name = 'rollitup'
    run(['--name', name])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ name }))
  })

  test('using short form', () => {
    const name = 'rollitup'
    run(['-n', name])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ name }))
  })
})

describe('cli working-dir parameter is passed to watch', () => {
  test('using long form', () => {
    const workingDir = '.alarms'
    run(['--working-dir', workingDir])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ workingDir }))
  })

  test('using short form', () => {
    const workingDir = '.alarms'
    run(['-w', workingDir])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ workingDir }))
  })
})

describe('cli config parameter is passed to watch', () => {
  test('using long form', () => {
    const configFile = 'rollup.conf.js'
    run(['--config', configFile])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ configFile }))
  })

  test('using short form', () => {
    const configFile = 'rollup.conf.js'
    run(['-c', configFile])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ configFile }))
  })
})

describe('cli will use environment variables when available', () => {
  const oldEnv = process.env

  beforeEach(() => {
    // Need this so that process is reset properly since it's implicitely loaded.
    jest.resetModules()
    // Make a copy of the old env.
    process.env = { ...oldEnv }
  })

  afterEach(() => {
    // Restore the old env
    process.env = oldEnv
  })

  test('ALARMIST_WORKING_DIRECTORY is used', () => {
    const workingDir = '.envDir'
    process.env.ALARMIST_WORKING_DIRECTORY = workingDir
    run([])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ workingDir }))
  })

  test('ALARMIST_ROLLUP_NAME is used', () => {
    const name = 'envRollup'
    process.env.ALARMIST_ROLLUP_NAME = name
    run([])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ name }))
  })

  test('ALARMIST_ROLLUP_CONFIG is used', () => {
    const configFile = 'envConfig.js'
    process.env.ALARMIST_ROLLUP_CONFIG = configFile
    run([])
    expect(alarmistRollup.watch).toBeCalledWith(expect.objectContaining({ configFile }))
  })
})
