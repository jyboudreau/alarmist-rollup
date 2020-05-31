function withRedirectedOutput (func, redirect, output = 'stdout') {
  const oldValue = process[output].write
  process[output].write = redirect
  func()
  process[output].write = oldValue
}

module.exports = { withRedirectedOutput }
