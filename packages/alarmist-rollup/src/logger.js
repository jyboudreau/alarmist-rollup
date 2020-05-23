const defaultDestination = {
  log: console.log.bind(console),
  error: console.error.bind(console)
}

let destination = defaultDestination

module.exports = {
  log (...params) {
    return destination.log(...params)
  },
  error (...params) {
    return destination.error(...params)
  },
  setDestination (value = defaultDestination) {
    destination = value
  }
}
