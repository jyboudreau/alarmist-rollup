const defaultDestination = {
  log (...params) {
    return console.log(...params)
  },
  error (...params) {
    return console.error(...params)
  }
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
