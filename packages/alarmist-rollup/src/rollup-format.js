// This file contains formatting code for events and errors of `rollup.watch`.
// It matches closely the formatting code in the rollup cli with most of the code
// lifted from there.

const color = require('colorette')
const prettyBytes = require('pretty-bytes')
const { isAbsolute, relative } = require('path')

const { logger } = require('./logger')

// Rollup code uses a function named stderr that writes to stderr via console.error.
// Since we need to use our contextual logger for logging into jobs, we map stderr to
// our logger here. We keep the code in here relatively similar to the rollup code in
// order to be able to update it for new versions.

const stderr = logger.log.bind(logger)

function relativeId (id) {
  if (!isAbsolute(id)) {
    return id
  }
  return relative(process.cwd(), id)
}

function handleRollupError (err) {
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

function printTimings (timings) {
  Object.keys(timings).forEach(label => {
    const appliedColor = label[0] === '#' ? (label[1] !== '#' ? color.underline : color.bold) : text => text
    const [time, memory, total] = timings[label]
    const row = `${label}: ${time.toFixed(0)}ms, ${prettyBytes(memory)} / ${prettyBytes(total)}`
    stderr(appliedColor(row))
  })
}

module.exports = { handleRollupError, printTimings }
