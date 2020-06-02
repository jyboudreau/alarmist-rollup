const { forEach, pipe } = require('callbag-basics')
const path = require('path')
const { create: createJobRunner } = require('./job-runner.js')
const rollupStream = require('./rollup-stream.js')
const { createRollupPrinter } = require('./rollup-format.js')
const { getDefaults } = require('./defaults')

// TODO: Test this function
function watch (params = {}) {
  let { name, configFile, workingDir, debounceWait } = { ...getDefaults(), ...params }

  configFile = path.resolve(params.configFile)
  const jobRunner = createJobRunner({ name, workingDir })
  const printRollupEvent = createRollupPrinter(jobRunner.write)

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
          printRollupEvent(event)
          jobRunner.end()
          break
        case 'ERROR':
          printRollupEvent(event)
          jobRunner.end('rollup build failed')
          break
        default:
          printRollupEvent(event)
          break
      }
    })
  )
}

module.exports = { watch }
