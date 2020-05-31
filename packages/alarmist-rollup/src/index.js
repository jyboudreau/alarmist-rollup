const { forEach, pipe } = require('callbag-basics')

const { create: createJobRunner } = require('./job-runner.js')
const rollupStream = require('./rollup-stream.js')
const { createRollupPrinter } = require('./rollup-format.js')

// TODO: Test this function
function watch ({ name, configFile, workingDir, colors, debounceWait } = { debounceWait: 1000 }) {
  const jobRunner = createJobRunner(name, workingDir)
  const printRollupEvent = createRollupPrinter(jobRunner.write, { colors })

  const configStream = rollupStream.createRollupConfigStream({ configFile, debounceWait })
  const rollupEventStream = rollupStream.createRollupEventStream(configStream)

  pipe(
    rollupEventStream,
    forEach(event => {
      switch (event.code) {
        case 'START':
          jobRunner.start()
          printRollupEvent(event)
          break
        case 'END':
        case 'ERROR':
          printRollupEvent(event)
          jobRunner.end()
          break
        default:
          printRollupEvent(event)
          break
      }
    })
  )
}

module.exports = { watch }
