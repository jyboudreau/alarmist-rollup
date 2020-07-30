const { flatten, filter, fromPromise, map, merge, pipe, scan, share } = require('callbag-basics')
const fromNodeEvent = require('callbag-from-events')
const { watch: createRollupWatcher } = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')

const { create: createFileWatcherStream } = require('./file-watcher-stream.js')
const { safeAsync, safeSync } = require('./utils.js')

const safeLoadRollup = safeAsync(loadRollup)
const safeCreateRollupWatcher = safeSync(createRollupWatcher)

function createEventFromError (error, source = undefined) {
  return { code: 'ERROR', error, source }
}

function createRollupEventStream ({ configFile, debounceWait = 0 }) {
  const fileUpdateStream = share(createFileWatcherStream(configFile, debounceWait))

  const initEvents = pipe(
    fileUpdateStream,
    map(() => ({ code: 'INIT' }))
  )

  const configStream = pipe(
    fileUpdateStream,
    map(() => fromPromise(safeLoadRollup(configFile))),
    flatten,
    share
  )

  const configErrors = pipe(
    configStream,
    filter(result => Boolean(result.error)),
    map(result => createEventFromError(result.error))
  )
  const watchers = pipe(
    configStream,
    filter(result => Boolean(result.ok)),
    scan((watcherResult, { ok: { options, warnings } }) => {
      // If there was already a rollup watcher, close it.
      if (watcherResult && watcherResult.ok) {
        watcherResult.ok.close()
      }
      const result = safeCreateRollupWatcher(options)
      result.warnings = warnings
      return result
    }, {}),
    share
  )

  const watcherEvents = pipe(
    watchers,
    filter(result => Boolean(result.ok)),
    map(({ ok: watcher, warnings }) => {
      // Attach the warnings to the source.
      watcher.warnings = warnings
      return pipe(
        fromNodeEvent(watcher, 'event'),
        map(event => ({ ...event, source: watcher }))
      )
    }),
    flatten
  )

  const watcherErrors = pipe(
    watchers,
    filter(result => Boolean(result.error)),
    map(({ error, warnings }) => createEventFromError(error, { warnings }))
  )

  return merge(initEvents, configErrors, watcherEvents, watcherErrors)
}

module.exports = {
  createRollupEventStream
}
