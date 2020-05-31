/* istanbul ignore file */
// Ignoring this console formatting from test coverage since it's mostly
// written to mimic rollup cli code here:
// https://github.com/rollup/rollup/blob/aa33e4b9250ba9f2cfb216e58f31638147ce34b5/cli/run/watch-cli.ts#L86

// This file contains formatting code for events and errors of `rollup.watch`.
// It matches closely the formatting code in the rollup cli.

const color = require('colorette')
const dateTime = require('date-time')
const ms = require('pretty-ms')
const prettyBytes = require('pretty-bytes')
const { isAbsolute, relative } = require('path')
const rollup = require('rollup')
const util = require('util')

const { withRedirectedOutput } = require('./utils.js')

// Rollup code uses a function named stderr that writes to stderr via console.error.
// We use the same name to keep the code similar to the rollup cli code.
function createRollupPrinter (output, { colors, silent } = { colors: true, silent: false }) {
  color.options.enabled = colors

  // Rollup code uses a function named stderr that writes to stderr via console.error.
  // We use the same name to keep the code similar to the rollup cli code.
  const stderr = (...params) => {
    output(util.format(...params, '\n'))
  }

  // #region Rollup Simulacrum

  function relativeId (id) {
    if (!isAbsolute(id)) {
      return id
    }
    return relative(process.cwd(), id)
  }

  function printTimings (timings) {
    Object.keys(timings).forEach(label => {
      const appliedColor = label[0] === '#' ? (label[1] !== '#' ? color.underline : color.bold) : text => text
      const [time, memory, total] = timings[label]
      const row = `${label}: ${time.toFixed(0)}ms, ${prettyBytes(memory)} / ${prettyBytes(total)}`
      stderr(appliedColor(row))
    })
  }

  function handleError (err) {
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

  function printEvent (event, warnings) {
    switch (event.code) {
      case 'ERROR':
        warnings.flush()
        handleError(event.error)
        break
      case 'START':
        if (!silent) {
          stderr(color.underline(`rollup v${rollup.VERSION}`))
        }
        break
      case 'BUNDLE_START':
        if (!silent) {
          let { input } = event
          if (typeof input !== 'string') {
            input = Array.isArray(input) ? input.join(', ') : Object.values(input).join(', ')
          }

          stderr(color.cyan(`bundles ${color.bold(input)} → ${color.bold(event.output.map(relativeId).join(', '))}...`))
        }
        break
      case 'BUNDLE_END':
        warnings.flush()
        if (!silent) {
          stderr(
            color.green(
              `created ${color.bold(event.output.map(relativeId).join(', '))} in ${color.bold(ms(event.duration))}`
            )
          )
          if (event.result && event.result.getTimings) {
            printTimings(event.result.getTimings())
          }
        }
        break
      case 'END':
        if (!silent) {
          stderr(`\n[${dateTime()}] waiting for changes...`)
        }
    }
  }

  // #endregion

  // Because warnings are indiscriminately written to console.error we need to redirect the output
  // in order to target our output function.
  return event => withRedirectedOutput(() => printEvent(event, event.source.warnings), output, 'stderr')
}

module.exports = { createRollupPrinter }
