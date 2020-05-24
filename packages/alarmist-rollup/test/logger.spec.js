/* global jest */ // See https://github.com/facebook/jest/issues/9920 */
const { expect, test } = require('@jest/globals')
const mockConsole = require('jest-mock-console').default

const logger = require('../src/logger')

test('logger.log writes to default console.log', () => {
  expect.hasAssertions()
  const restoreConsole = mockConsole()
  const logParam = 'Dummy string'
  logger.log(logParam)

  expect(console.log).nthCalledWith(1, logParam)
  restoreConsole()
})

test('logger.error writes to default console.error', () => {
  expect.hasAssertions()

  const restoreConsole = mockConsole()
  const logParam = 'Dummy string'
  logger.error(logParam)

  expect(console.error).nthCalledWith(1, logParam)
  restoreConsole()
})

test('logger.log sends data to custom destination', () => {
  expect.hasAssertions()

  const logDest = {
    log: jest.fn(),
    error: jest.fn()
  }

  logger.setDestination(logDest)

  logger.log('Some log')
  logger.error('Some error')

  expect(logDest.log).toBeCalledTimes(1)
  expect(logDest.error).toBeCalledTimes(1)

  logger.setDestination()
})

test('logger.setDestination() reverts default destination', () => {
  expect.hasAssertions()

  const restoreConsole = mockConsole()

  const logDest = {
    log: jest.fn(),
    error: jest.fn()
  }

  logger.setDestination(logDest)
  logger.setDestination()

  logger.log('Some log')
  logger.error('Some error')

  expect(console.log).toBeCalledTimes(1)
  expect(console.error).toBeCalledTimes(1)

  restoreConsole()
})
