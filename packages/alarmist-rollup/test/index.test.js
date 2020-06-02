/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { beforeEach, expect, test } = require('@jest/globals')
const callbagMock = require('callbag-mock')

const path = require('path')
const jobRunner = require('../src/job-runner.js')
const rollupStream = require('../src/rollup-stream.js')
const rollupFormat = require('../src/rollup-format.js')

jest.mock('path')
jest.mock('../src/job-runner.js')
jest.mock('../src/rollup-stream.js')
jest.mock('../src/rollup-format.js')

path.resolve = jest.fn()
jobRunner.create = jest.fn()
rollupStream.createRollupConfigStream = jest.fn()
rollupStream.createRollupEventStream = jest.fn()
rollupFormat.createRollupPrinter = jest.fn()

const { watch } = require('../src/index.js')

const createMockJobRunner = () => {
  const calls = []
  return {
    start (...params) {
      calls.push(['start', ...params])
    },
    end (...params) {
      calls.push(['end', ...params])
    },
    write (...params) {
      calls.push(['write', ...params])
    },
    getCalls () {
      return calls
    }
  }
}
beforeEach(() => {
  path.resolve.mockReset()
  jobRunner.create.mockReset()
  rollupStream.createRollupEventStream.mockReset()
  rollupFormat.createRollupPrinter.mockReset()
})

test('alarmist-rollup creates job-runner with right name', () => {
  const name = 'dummyName'

  rollupStream.createRollupEventStream.mockReturnValue(callbagMock(true))
  jobRunner.create.mockReturnValue(createMockJobRunner())

  watch({ name })
  expect(jobRunner.create).toBeCalledWith(expect.objectContaining({ name }))
})

test('alarmist-rollup creates job-runner with right working dir', () => {
  const workingDir = 'dummyWorkingDir'

  rollupStream.createRollupEventStream.mockReturnValue(callbagMock(true))
  jobRunner.create.mockReturnValue(createMockJobRunner())

  watch({ workingDir })
  expect(jobRunner.create).toBeCalledWith(expect.objectContaining({ workingDir }))
})

test('alarmist-rollup creates config stream with the right file', () => {
  const configFile = 'dummyConfigFile'

  path.resolve.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(callbagMock(true))
  jobRunner.create.mockReturnValue(createMockJobRunner())

  watch({ configFile })
  expect(rollupStream.createRollupConfigStream).toBeCalledWith(expect.objectContaining({ configFile }))
})

test('alarmist-rollup creates config stream with the debounce wait', () => {
  const debounceWait = 132

  rollupStream.createRollupEventStream.mockReturnValue(callbagMock(true))
  jobRunner.create.mockReturnValue(createMockJobRunner())

  watch({ debounceWait })
  expect(rollupStream.createRollupConfigStream).toBeCalledWith(expect.objectContaining({ debounceWait }))
})

test('alarmist-rollup does the right thing on START event', () => {
  const mockEventStream = callbagMock(true)
  const mockJobRunner = createMockJobRunner()

  // The mock printer just returns the output function passed to it.
  rollupFormat.createRollupPrinter.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(mockEventStream)
  jobRunner.create.mockReturnValue(mockJobRunner)

  watch()
  const event = { code: 'START' }
  mockEventStream.emit(1, event)

  expect(mockJobRunner.getCalls()).toEqual([['start'], ['write', event]])
})

test('alarmist-rollup does the right thing on an END event', () => {
  const mockEventStream = callbagMock(true)
  const mockJobRunner = createMockJobRunner()

  // The mock printer just returns the output function passed to it.
  rollupFormat.createRollupPrinter.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(mockEventStream)
  jobRunner.create.mockReturnValue(mockJobRunner)

  watch()
  const event = { code: 'END' }
  mockEventStream.emit(1, event)

  expect(mockJobRunner.getCalls()).toEqual([['write', event], ['end']])
})

test('alarmist-rollup does the right thing on an ERROR event', () => {
  const mockEventStream = callbagMock(true)
  const mockJobRunner = createMockJobRunner()

  // The mock printer just returns the output function passed to it.
  rollupFormat.createRollupPrinter.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(mockEventStream)
  jobRunner.create.mockReturnValue(mockJobRunner)

  watch()
  const event = { code: 'ERROR' }
  mockEventStream.emit(1, event)

  expect(mockJobRunner.getCalls()).toEqual([
    ['write', event],
    ['end', 'rollup build failed']
  ])
})

test('alarmist-rollup does the right thing on an BUNDLE_START event', () => {
  const mockEventStream = callbagMock(true)
  const mockJobRunner = createMockJobRunner()

  // The mock printer just returns the output function passed to it.
  rollupFormat.createRollupPrinter.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(mockEventStream)
  jobRunner.create.mockReturnValue(mockJobRunner)

  watch()
  const event = { code: 'BUNDLE_START' }
  mockEventStream.emit(1, event)

  expect(mockJobRunner.getCalls()).toEqual([['write', event]])
})

test('alarmist-rollup does the right thing on an BUNDLE_END event', () => {
  const mockEventStream = callbagMock(true)
  const mockJobRunner = createMockJobRunner()

  // The mock printer just returns the output function passed to it.
  rollupFormat.createRollupPrinter.mockImplementation(val => val)
  rollupStream.createRollupEventStream.mockReturnValue(mockEventStream)
  jobRunner.create.mockReturnValue(mockJobRunner)

  watch()
  const event = { code: 'BUNDLE_END' }
  mockEventStream.emit(1, event)

  expect(mockJobRunner.getCalls()).toEqual([['write', event]])
})
