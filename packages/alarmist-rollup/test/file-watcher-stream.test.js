/* global jest */ // See https://github.com/facebook/jest/issues/9920 */
const { beforeEach, describe, expect, test } = require('@jest/globals')
const callbagMock = require('callbag-mock')
const chokidar = require('chokidar')
const EventEmitter = require('events')

jest.mock('chokidar')
jest.useFakeTimers()

chokidar.watch = jest.fn()

const { create: createFileWatcherStream } = require('../src/file-watcher-stream.js')

beforeEach(() => {
  // Disable console from polluting tests
  chokidar.watch.mockReset()
})

describe('createFileWatcherStream creates a stream', () => {
  test('that emits when the file is ready', () => {
    const mockChokidarWatcher = new EventEmitter()
    chokidar.watch.mockReturnValue(mockChokidarWatcher)

    const file = 'dummyFile'

    const fileWatcherStream = createFileWatcherStream(file, 0)

    const sinkMock = callbagMock()
    fileWatcherStream(0, sinkMock)

    mockChokidarWatcher.emit('ready')

    expect(sinkMock.getReceivedData()).toEqual([file])

    // Terminate source and sink
    sinkMock.emit(2)
  })

  test('that emits when the file is changed', () => {
    const mockChokidarWatcher = new EventEmitter()
    chokidar.watch.mockReturnValue(mockChokidarWatcher)

    const file = 'dummyFile'

    const fileWatcherStream = createFileWatcherStream(file)

    const sinkMock = callbagMock()
    fileWatcherStream(0, sinkMock)

    mockChokidarWatcher.emit('change')

    expect(sinkMock.getReceivedData()).toEqual([file])

    // Terminate source and sink
    sinkMock.emit(2)
  })

  test('that emits when the file is changed', () => {
    const mockChokidarWatcher = new EventEmitter()
    chokidar.watch.mockReturnValue(mockChokidarWatcher)

    const file = 'dummyFile'

    const fileWatcherStream = createFileWatcherStream(file)

    const sinkMock = callbagMock()
    fileWatcherStream(0, sinkMock)

    mockChokidarWatcher.emit('change')

    expect(sinkMock.getReceivedData()).toEqual([file])

    // Terminate source and sink
    sinkMock.emit(2)
  })

  test('that can debounce emits when the file is changed', () => {
    const mockChokidarWatcher = new EventEmitter()
    chokidar.watch.mockReturnValue(mockChokidarWatcher)

    const file = 'dummyFile'
    const debounceTime = 1000

    const fileWatcherStream = createFileWatcherStream(file, debounceTime)

    const sinkMock = callbagMock()
    fileWatcherStream(0, sinkMock)

    mockChokidarWatcher.emit('change')
    mockChokidarWatcher.emit('change')
    mockChokidarWatcher.emit('change')

    expect(sinkMock.getReceivedData()).toEqual([])

    jest.advanceTimersByTime(1000)

    expect(sinkMock.getReceivedData()).toEqual([file])

    // Terminate source and sink
    sinkMock.emit(2)
  })
})
