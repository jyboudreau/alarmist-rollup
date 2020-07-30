/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { afterEach, beforeEach, describe, expect, test } = require('@jest/globals')

const { default: mockConsole } = require('jest-mock-console')
const mockProcess = require('jest-mock-process')

const { withRedirectedOutput, safeAsync, safeSync } = require('../src/utils.js')

describe('withRedirectedOutput', () => {
  let mockStdout
  let mockStderr

  beforeEach(() => {
    // Mock the stdout and stderr that way we don't get actual things written to
    // jest's output.
    mockStdout = mockProcess.mockProcessStdout()
    mockStderr = mockProcess.mockProcessStderr()

    // Also mock the console and change it to have standard behaviour since Jest overwrites this.
    mockConsole()

    console.log.mockImplementation((...params) => {
      process.stdout.write(...params)
    })
    console.error.mockImplementation((...params) => {
      process.stderr.write(...params)
    })
  })

  afterEach(() => {
    mockStdout.mockRestore()
    mockStderr.mockRestore()
  })

  test('withRedirectedOutput redirects stdout appropriately', () => {
    const logLogger = message => () => console.log(message)
    const mockRedirect = jest.fn()
    const message = 'Error Message'

    withRedirectedOutput(logLogger(message), { stdout: mockRedirect })

    expect(mockRedirect).toHaveBeenCalledWith(message)
  })

  test('withRedirectedOutput redirects stderr appropriately', () => {
    const errorLogger = message => () => console.error(message)
    const mockRedirect = jest.fn()
    const message = 'Error Message'

    withRedirectedOutput(errorLogger(message), { stderr: mockRedirect })

    expect(mockRedirect).toHaveBeenCalledWith(message)
  })

  test('withRedirectedOutput redirects both outputs appropriately', () => {
    const consoleLogger = message => () => {
      console.error(message)
      console.log(message)
    }

    const mockStdoutRedirect = jest.fn()
    const mockStderrRedirect = jest.fn()
    const message = 'Error Message'

    withRedirectedOutput(consoleLogger(message), { stderr: mockStderrRedirect, stdout: mockStdoutRedirect })

    expect(mockStderrRedirect).toHaveBeenCalledWith(message)
    expect(mockStdoutRedirect).toHaveBeenCalledWith(message)
  })

  test('withRedirectedOutput redirects only one output appropriately', () => {
    const consoleLogger = message => () => {
      console.error(message)
      console.log(message)
    }

    const mockStdoutRedirect = jest.fn()
    const message = 'Error Message'

    const stdoutWriteSpy = jest.spyOn(process.stdout, 'write')
    const stderrWriteSpy = jest.spyOn(process.stderr, 'write')

    withRedirectedOutput(consoleLogger(message), { stdout: mockStdoutRedirect })

    expect(mockStdoutRedirect).toHaveBeenCalledWith(message)
    expect(stdoutWriteSpy).not.toBeCalled()
    expect(stderrWriteSpy).toBeCalled()

    stdoutWriteSpy.mockRestore()
    stderrWriteSpy.mockRestore()
  })
})

test('safeSync will run error-free function successfully', () => {
  const mockFunc = jest.fn().mockReturnValue('dummyReturn')

  const result = safeSync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result).toEqual({ ok: 'dummyReturn' })
})

test('safeSync will return error object on function throwing', () => {
  const error = new Error('dummyException')
  const mockFunc = jest.fn(() => {
    throw error
  })

  const result = safeSync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result.error).toBe(error)
})

test('safeAsync will run error-free sync function successfully', async () => {
  const mockFunc = jest.fn().mockReturnValue('dummyReturn')

  const result = await safeAsync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result).toEqual({ ok: 'dummyReturn' })
})

test('safeAsync will return error object on sync function throwing', async () => {
  const error = new Error('dummyException')
  const mockFunc = jest.fn(() => {
    throw error
  })

  const result = await safeSync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result.error).toBe(error)
})

test('safeAsync will run error-free async function successfully', async () => {
  const mockFunc = jest.fn().mockResolvedValue('dummyReturn')

  const result = await safeAsync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result).toEqual({ ok: 'dummyReturn' })
})

test('safeAsync will return error object on async function rejecting', async () => {
  const error = new Error('dummyException')
  const mockFunc = jest.fn().mockRejectedValue(error)

  const result = await safeAsync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result.error).toBe(error)
})
test('safeAsync will return error object on async function throwing', async () => {
  const error = new Error('dummyException')
  const mockFunc = jest.fn(async () => {
    throw error
  })

  const result = await safeAsync(mockFunc)('dummyParam')

  expect(mockFunc).nthCalledWith(1, 'dummyParam')
  expect(result.error).toBe(error)
})
