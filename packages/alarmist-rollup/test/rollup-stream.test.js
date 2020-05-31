/* global jest */ // See https://github.com/facebook/jest/issues/9920 */
const { beforeEach, expect, test } = require('@jest/globals')
const callbagMock = require('callbag-mock')
const chokidar = require('chokidar')
const rollup = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')
const { default: mockConsole } = require('jest-mock-console')
const EventEmitter = require('events')
const flushPromises = require('flush-promises')

jest.mock('chokidar')
jest.mock('rollup')
jest.mock('rollup/dist/loadConfigFile')
jest.useFakeTimers()

chokidar.watch = jest.fn()
rollup.watch = jest.fn()

const { createRollupConfigStream, createRollupEventStream } = require('../src/rollup-stream.js')

beforeEach(() => {
  // Disable console from polluting tests
  mockConsole()
  chokidar.watch.mockReset()
  rollup.watch.mockReset()
  loadRollup.mockReset()
})

test('createRollupConfigStream returns a stream of configs that emits when the file is ready', async () => {
  const mockChokidarWatcher = new EventEmitter()
  const config = { options: 'dummyOptions' }
  const configFile = 'dummyFile'

  chokidar.watch.mockReturnValue(mockChokidarWatcher)
  loadRollup.mockResolvedValue(config)

  const rollupConfigStream = createRollupConfigStream({ configFile })

  const sinkMock = callbagMock()
  rollupConfigStream(0, sinkMock)

  mockChokidarWatcher.emit('ready')
  await flushPromises()

  expect(sinkMock.getReceivedData()).toEqual([config])

  // Terminate the source and sink.
  sinkMock.emit(2)
})

test('createRollupConfigStream returns a stream of configs that emits when the file is updated', async () => {
  const mockChokidarWatcher = new EventEmitter()
  const config = { options: 'dummyOptions' }
  const configFile = 'dummyFile'

  chokidar.watch.mockReturnValue(mockChokidarWatcher)
  loadRollup.mockResolvedValue(config)

  const rollupConfigStream = createRollupConfigStream({ configFile })

  const sinkMock = callbagMock()
  rollupConfigStream(0, sinkMock)

  mockChokidarWatcher.emit('change')
  await flushPromises()

  expect(sinkMock.getReceivedData()).toEqual([config])

  // Terminate source and sink
  sinkMock.emit(2)
})

test('configStream can be debounced', async () => {
  const mockChokidarWatcher = new EventEmitter()
  const config = { options: 'dummyOptions' }
  const configFile = 'dummyFile'

  chokidar.watch.mockReturnValue(mockChokidarWatcher)
  loadRollup.mockResolvedValue(config)

  const rollupConfigStream = createRollupConfigStream({ configFile, debounceWait: 1000 })

  const sinkMock = callbagMock()

  rollupConfigStream(0, sinkMock)

  mockChokidarWatcher.emit('change')
  mockChokidarWatcher.emit('change')
  mockChokidarWatcher.emit('change')
  await flushPromises()

  expect(sinkMock.getReceivedData()).toEqual([])

  jest.advanceTimersByTime(1000)
  await flushPromises()

  expect(sinkMock.getReceivedData()).toEqual([config])
})

class MockRollupWatcher extends EventEmitter {
  constructor () {
    super()
    this.close = jest.fn()
  }
}

test('createRollupEventStream emits events from rollup watcher', async () => {
  const configStreamMock = callbagMock(true)
  const configStreamDummyValue = { options: 'dummyOptions', warnings: 'dummyWarnings' }
  const mockRollupWatcher = new MockRollupWatcher()

  rollup.watch.mockReturnValue(mockRollupWatcher)

  const rollupEventStream = createRollupEventStream(configStreamMock)

  const sinkMock = callbagMock()

  rollupEventStream(0, sinkMock)

  configStreamMock.emit(1, configStreamDummyValue)
  expect(rollup.watch).toBeCalledWith(configStreamDummyValue.options)

  mockRollupWatcher.emit('event', { code: 'dummyEvent' })
  expect(sinkMock.getReceivedData()).toEqual([
    {
      code: 'dummyEvent',
      source: mockRollupWatcher
    }
  ])
})

test('createRollupEventStream normalizes events over multiple watchers', async () => {
  const configStreamMock = callbagMock(true)
  const configStreamDummyValue = { options: 'dummyOptions', warnings: 'dummyWarnings' }
  const mockRollupWatcher = new MockRollupWatcher()

  rollup.watch.mockReturnValue(mockRollupWatcher)

  const rollupEventStream = createRollupEventStream(configStreamMock)

  const sinkMock = callbagMock()
  rollupEventStream(0, sinkMock)

  const emulateConfigEmit = (config, code) => {
    configStreamMock.emit(1, config)
    mockRollupWatcher.emit('event', { code })
  }

  emulateConfigEmit(configStreamDummyValue, 'dummyEvent1')

  expect(sinkMock.getReceivedData()).toEqual([
    {
      code: 'dummyEvent1',
      source: mockRollupWatcher
    }
  ])

  emulateConfigEmit(configStreamDummyValue, 'dummyEvent2')

  expect(sinkMock.getReceivedData()).toEqual([
    {
      code: 'dummyEvent1',
      source: mockRollupWatcher
    },
    {
      code: 'dummyEvent2',
      source: mockRollupWatcher
    }
  ])
})
