/* global jest */ // See https://github.com/facebook/jest/issues/9920 */
const { beforeEach, describe, expect, test } = require('@jest/globals')
const callbagMock = require('callbag-mock')
const rollup = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')
const EventEmitter = require('events')
const flushPromises = require('flush-promises')
const fileWatcherStream = require('../src/file-watcher-stream.js')

jest.mock('rollup')
jest.mock('rollup/dist/loadConfigFile')
jest.mock('../src/file-watcher-stream.js')

rollup.watch = jest.fn()
fileWatcherStream.create = jest.fn()

const { createRollupEventStream } = require('../src/rollup-stream.js')

beforeEach(() => {
  // Disable console from polluting tests
  loadRollup.mockReset()
  rollup.watch.mockReset()
  fileWatcherStream.create.mockReset()
})

class MockRollupWatcher extends EventEmitter {
  constructor (name = undefined) {
    super()
    this.name = name
    this.close = jest.fn()
  }
}

describe('createRollupEventStream creates a stream that', async () => {
  test('emits INIT event on file load', async () => {
    const fileUpdateStreamMock = callbagMock(true)

    fileWatcherStream.create.mockReturnValue(fileUpdateStreamMock)
    loadRollup.mockResolvedValue({ options: {}, warnings: {} })

    const configFile = 'dummyFile'

    const rollupEventStream = createRollupEventStream({ configFile })

    const sinkMock = callbagMock()

    rollupEventStream(0, sinkMock)

    fileUpdateStreamMock.emit(1, configFile)

    await flushPromises()

    expect(sinkMock.getReceivedData()).toEqual([{ code: 'INIT' }])
  })

  test('emits ERROR when config fails to load', async () => {
    const fileUpdateStreamMock = callbagMock(true)

    const error = new Error('Dummy Error')

    fileWatcherStream.create.mockReturnValue(fileUpdateStreamMock)
    loadRollup.mockRejectedValue(error)

    const configFile = 'dummyFile'

    const rollupEventStream = createRollupEventStream({ configFile })

    const sinkMock = callbagMock()

    rollupEventStream(0, sinkMock)

    fileUpdateStreamMock.emit(1, configFile)

    await flushPromises()

    expect(sinkMock.getReceivedData()).toEqual([{ code: 'INIT' }, { code: 'ERROR', error }])
  })

  test('emits ERROR when watcher fails to be created', async () => {
    const fileUpdateStreamMock = callbagMock(true)

    const error = new Error('Dummy Error')
    const warnings = {}
    const config = { options: {}, warnings }

    fileWatcherStream.create.mockReturnValue(fileUpdateStreamMock)
    loadRollup.mockResolvedValue(config)
    rollup.watch.mockImplementation(() => {
      throw error
    })

    const configFile = 'dummyFile'

    const rollupEventStream = createRollupEventStream({ configFile })

    const sinkMock = callbagMock()

    rollupEventStream(0, sinkMock)

    fileUpdateStreamMock.emit(1, configFile)

    await flushPromises()

    expect(sinkMock.getReceivedData()).toEqual([{ code: 'INIT' }, { code: 'ERROR', error, source: { warnings } }])
  })

  test('emits event when watcher emits', async () => {
    const fileUpdateStreamMock = callbagMock(true)

    const warnings = {}
    const config = { options: {}, warnings }
    const mockWatcher = new MockRollupWatcher()

    fileWatcherStream.create.mockReturnValue(fileUpdateStreamMock)
    loadRollup.mockResolvedValue(config)
    rollup.watch.mockReturnValue(mockWatcher)

    const configFile = 'dummyFile'

    const rollupEventStream = createRollupEventStream({ configFile })

    const sinkMock = callbagMock()

    rollupEventStream(0, sinkMock)

    fileUpdateStreamMock.emit(1, configFile)
    await flushPromises()

    const event = { code: 'START' }
    mockWatcher.emit('event', event)

    expect(sinkMock.getReceivedData()).toEqual([{ code: 'INIT' }, { code: 'START', source: mockWatcher }])
  })

  test('normalizes events over multiple watchers', async () => {
    const configFile = 'dummyFile'
    const mockFileUpdateStream = callbagMock(true)

    fileWatcherStream.create.mockReturnValueOnce(mockFileUpdateStream)

    const reloads = [
      // Reload 1
      {
        config: { options: 'options 1', warnings: 'warnings 1' },
        mockWatcher: new MockRollupWatcher('watcher 1')
      },
      // Reload 2
      {
        config: { options: 'options 2', warnings: 'warnings 2' },
        mockWatcher: new MockRollupWatcher('watcher 2')
      }
    ]

    const executeReload = async ({ config, mockWatcher }, event) => {
      rollup.watch.mockReturnValueOnce(mockWatcher)
      loadRollup.mockResolvedValueOnce(config)

      mockFileUpdateStream.emit(1, configFile)

      await flushPromises()

      mockWatcher.emit('event', { code: 'START' })
    }

    const rollupEventStream = createRollupEventStream({ configFile })

    const sinkMock = callbagMock()

    rollupEventStream(0, sinkMock)

    await executeReload(reloads[0], { code: 'START' })
    await executeReload(reloads[1], { code: 'START' })

    expect(sinkMock.getReceivedData()).toEqual([
      { code: 'INIT' },
      { code: 'START', source: reloads[0].mockWatcher },
      { code: 'INIT' },
      { code: 'START', source: reloads[1].mockWatcher }
    ])
  })
})
