/**
 * Used to perform operation in an isolated context where stdout or stderr are
 * redirected to the function provided by the `redirect` parameter.
 * @param {Function} operation The operation to execute in the redirected context
 * @param {Object} options The options for redirection
 * @param {Function} options.stdout The function used for stdout output (such as console.log output)
 * @param {Function} options.stderr The function used for stderr output (such as console.error output)
 */
function withRedirectedOutput (operation, options) {
  const oldOutputs = Object.entries(options).map(([key, val]) => {
    const oldVal = process[key].write
    process[key].write = val
    return [key, oldVal]
  })
  try {
    operation()
  } finally {
    oldOutputs.forEach(([key, oldVal]) => {
      process[key].write = oldVal
    })
  }
}

// Wrapper to convert the an async operation that might throw
// into one that returns an either-like object.
function safeAsync (op) {
  return async (...params) => {
    try {
      return { ok: await op(...params) }
    } catch (error) {
      return { error }
    }
  }
}

// Wrapper to convert the a sync operation that might throw
// into one that returns an either-like object.
function safeSync (op) {
  return (...params) => {
    try {
      return { ok: op(...params) }
    } catch (error) {
      return { error }
    }
  }
}

module.exports = { withRedirectedOutput, safeAsync, safeSync }
