const { flatten, fromPromise, map, merge, pipe, scan, share } = require('callbag-basics')
const { debounce } = require('callbag-debounce')
const fromNodeEvent = require('callbag-from-events')
const { watch: watchFile } = require('chokidar')
const { watch: createRollupWatcher } = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')
const { resolve } = require('path')
const logger = require('./logger')

async function loadRollupConfig (configFile) {
  try {
    return loadRollup(resolve(configFile))
  } catch (error) {
    logger.error('Failed to load rollup configuration, error:', error)
    throw error
  }
}

function createRollupWatchStream ({ configFile, debounceWait = 1000 }) {
  const fileWatcher = watchFile(configFile)

  const fileReadyStream = fromNodeEvent(fileWatcher, 'ready')
  const fileChangeStream = fromNodeEvent(fileWatcher, 'change')

  const fileUpdateStream = merge(
    fileReadyStream,
    debounceWait ? debounce(debounceWait)(fileChangeStream) : fileChangeStream
  )

  const configStream = pipe(
    fileUpdateStream,
    map(() => fromPromise(loadRollupConfig(configFile))),
    flatten
  )

  return pipe(
    configStream,
    scan((rollupWatcher, { options, warnings }) => {
      // If there was already a rollup watcher, close it.
      if (rollupWatcher) {
        rollupWatcher.close()
      }
      const watcher = createRollupWatcher(options)

      // Attach the warnings to the watcher... such a weird interface.
      watcher.warnings = warnings

      return watcher
    }, undefined),
    share
  )
}

module.exports = { createRollupWatchStream }
