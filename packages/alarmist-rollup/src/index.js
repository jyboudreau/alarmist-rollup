const { combine, flatten, forEach, fromPromise, map, merge, pipe, scan, share } = require('callbag-basics')
const { debounce } = require('callbag-debounce')
const fromNodeEvent = require('callbag-from-events')
const { default: callbagOf } = require('callbag-of')
const { watch: watchFile } = require('chokidar')
const { resolve, relative, isAbsolute } = require('path')
const { watch: createRollupWatcher } = require('rollup')
const { VERSION: ROLLUP_VERSION } = require('rollup')
const loadRollup = require('rollup/dist/loadConfigFile')
const yargs = require('yargs')
const { createJob } = require('alarmist')
const color = require('colorette')
const dateTime = require('date-time')
const prettyBytes = require('pretty-bytes')
const ms = require('pretty-ms')

const argv = yargs.argv._

const logger = title => (...args) => console.log(title, ...args)
const log = logger('Log -> ')

log('Starting')

const configFile = argv[0]
const fileWatcher = watchFile(argv[0])

const fileReadyStream = fromNodeEvent(fileWatcher, 'ready')
const fileChangeStream = fromNodeEvent(fileWatcher, 'change')
const debouncedFileChangeStream = debounce(1000 /* msec */)(fileChangeStream)

async function loadRollupConfig (configFile) {
  try {
    return loadRollup(resolve(configFile))
  } catch (error) {
    return { error }
  }
}

const configStream = pipe(
  merge(fileReadyStream, debouncedFileChangeStream),
  map(() => fromPromise(loadRollupConfig(configFile))),
  flatten
)

const rollupWatcherStream = pipe(
  configStream,
  scan((rollupWatcher, { options, warnings }) => {
    // If there was already a rollup watcher, close it.
    log('Starting to create watcher')
    if (rollupWatcher) {
      log('Closing existing watcher')
      rollupWatcher.close()
    }
    const watcher = createRollupWatcher(options)

    // Attach the warnings to the watcher... such a weird interface.
    watcher.warnings = warnings

    return watcher
  }, undefined),
  share
)

function withRedirectedStdErr (func, redirect) {
  const oldWrite = process.stderr.write
  process.stderr.write = redirect
  func()
  process.stderr.write = oldWrite
}

const rollupEventStream = pipe(
  rollupWatcherStream,
  // Map the watcher to it's events. Need to combine the watcher as well to keep the context.
  map(watcher => combine(fromNodeEvent(watcher, 'event'), callbagOf(watcher))),
  flatten,
  // Combine add the source to the event.
  map(([event, source]) => ({ ...event, source }))
)

const createJobRunner = () => {
  let jobPromise

  const end = async (...params) => {
    if (jobPromise) {
      const job = await jobPromise
      job.end(...params)
    }
    jobPromise = undefined
  }

  const start = async (params = {}) => {
    jobPromise = (async () => {
      await end(params.abortMessage || 'aborted: new run started')
      return createJob(params)
    })()

    return jobPromise
  }

  const write = async data => {
    if (jobPromise) {
      const job = await jobPromise
      job.log.write(data)
    } else {
      log('Attempt to write to non-existant job.')
    }
  }

  const writeln = async data => {
    write(`${data}\n`)
  }

  return {
    end,
    start,
    write,
    writeln
  }
}

function relativeId (id) {
  if (!isAbsolute(id)) {
    return id
  }
  return relative(process.cwd(), id)
}

function handleRollupError (err, stderr) {
  let description = err.message || err
  if (err.name) description = `${err.name}: ${description}`
  const message = (err.plugin ? `(plugin ${err.plugin}) ${description}` : description) || err

  stderr(color.bold(color.red(`[!] ${color.bold(message.toString())}`)))

  if (err.url) {
    stderr(color.cyan(err.url))
  }

  if (err.loc) {
    stderr(`${relativeId(err.loc.file || err.id)} (${err.loc.line}:${err.loc.column})`)
  } else if (err.id) {
    stderr(relativeId(err.id))
  }

  if (err.frame) {
    stderr(color.dim(err.frame))
  }

  if (err.stack) {
    stderr(color.dim(err.stack))
  }

  stderr('')
}

function printTimings (timings, stderr) {
  Object.keys(timings).forEach(label => {
    const appliedColor = label[0] === '#' ? (label[1] !== '#' ? color.underline : color.bold) : text => text
    const [time, memory, total] = timings[label]
    const row = `${label}: ${time.toFixed(0)}ms, ${prettyBytes(memory)} / ${prettyBytes(total)}`
    stderr(appliedColor(row))
  })
}

// TODO: All these need to be parameters
const name = 'rollup'
const workingDir = '.alarmist'
const jobRunner = createJobRunner()

pipe(
  rollupEventStream,
  forEach(event => {
    switch (event.code) {
      case 'START':
        jobRunner.start({ name, workingDir })
        jobRunner.writeln(color.underline(`rollup v${ROLLUP_VERSION}`))
        break
      case 'BUNDLE_START':
        {
          let { input } = event
          if (typeof input !== 'string') {
            input = Array.isArray(input) ? input.join(', ') : Object.values(input).join(', ')
          }

          jobRunner.writeln(
            color.cyan(`bundles ${color.bold(input)} → ${color.bold(event.output.map(relativeId).join(', '))}...`)
          )
        }
        break
      case 'BUNDLE_END':
        withRedirectedStdErr(() => event.source.warnings.flush(), jobRunner.write)
        jobRunner.writeln(
          color.green(
            `created ${color.bold(event.output.map(relativeId).join(', '))} in ${color.bold(ms(event.duration))}`
          )
        )
        if (event.result && event.result.getTimings) {
          printTimings(event.result.getTimings(), jobRunner.writeln)
        }
        break
      case 'END':
        jobRunner.writeln(`\n[${dateTime()}] waiting for changes...`)
        jobRunner.end()
        break
      case 'ERROR':
        withRedirectedStdErr(() => event.source.warnings.flush(), jobRunner.write)
        handleRollupError(event.error, jobRunner.writeln)
        jobRunner.end()
        break
      default:
        log('Error -> Wrong type of rollup event received')
        break
    }
  })
)
