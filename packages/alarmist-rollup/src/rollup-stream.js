const { combine, flatten, fromPromise, map, merge, pipe, scan } = require('callbag-basics')
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
    flatten
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

      console.log('Options: ', JSON.stringify(options))

      let result = {}

      try {
        result = createRollupWatcher(options)
      } catch (error) {
        result = error
      }

      // Attach the warnings to the result... such a weird interface.
      result.warnings = warnings

      return result
    }, undefined),
    map(result =>
      combine(
        result instanceof Error
          ? callbagOf({ code: 'ERROR', error: result }) // Simulate an error event
          : fromNodeEvent(result, 'event'),
        callbagOf(result)
      )
    ),
    flatten,
    // Combine add the source to the event.
    map(([event, source]) => ({ ...event, source }))
  )
}

module.exports = {
  createRollupConfigStream,
  createRollupEventStream
}
