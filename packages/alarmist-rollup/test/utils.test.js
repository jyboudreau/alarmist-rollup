/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { expect, test } = require('@jest/globals')
const { withRedirectedOutput } = require('../src/utils.js')
const { default: mockConsole } = require('jest-mock-console')

test('withRedirectedOutput redirects stdout appropriately', () => {
  mockConsole()

  // Make sure console.error writes to stderr to have appropriate behaviour. Jest
  // seems to overwrite this.
  console.log.mockImplementation((...params) => {
    process.stdout.write(...params)
  })

  const logLogger = message => () => console.log(message)
  const mockRedirect = jest.fn()
  const message = 'Error Message'

  withRedirectedOutput(logLogger(message), mockRedirect)

  expect(mockRedirect).toHaveBeenCalledWith(message)
})

test('withRedirectedOutput redirects stderr appropriately', () => {
  mockConsole()

  // Make sure console.error writes to stderr to have appropriate behaviour. Jest
  // seems to overwrite this.
  console.error.mockImplementation((...params) => {
    process.stderr.write(...params)
  })

  const errorLogger = message => () => console.error(message)
  const mockRedirect = jest.fn()
  const message = 'Error Message'

  withRedirectedOutput(errorLogger(message), mockRedirect, 'stderr')

  expect(mockRedirect).toHaveBeenCalledWith(message)
})
