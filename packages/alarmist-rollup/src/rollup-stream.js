const { combine, flatten, fromPromise, map, merge, pipe, scan, share } = require('callbag-basics')
const { debounce } = require('callbag-debounce')
const fromNodeEvent = require('callbag-from-events')
const { default: callbagOf } = require('callbag-of')
const { watch: watchFile } = require('chokidar')
const { watch: createRollupWatcher } = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')

function createRollupConfigStream ({ configFile, debounceWait = 0 }) {
  const fileWatcher = watchFile(configFile)

  const fileReadyStream = fromNodeEvent(fileWatcher, 'ready')
  const fileChangeStream = fromNodeEvent(fileWatcher, 'change')

  const fileUpdateStream = merge(
    fileReadyStream,
    debounceWait ? debounce(debounceWait)(fileChangeStream) : fileChangeStream
  )

  return pipe(
    fileUpdateStream,
    map(() => fromPromise(loadRollup(configFile))),
    flatten,
    share
  )
}

function createRollupEventStream (configStream) {
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
    map(watcher => combine(fromNodeEvent(watcher, 'event'), callbagOf(watcher))),
    flatten,
    // Combine add the source to the event.
    map(([event, source]) => ({ ...event, source }))
  )
}

module.exports = {
  createRollupConfigStream,
  createRollupEventStream
}
