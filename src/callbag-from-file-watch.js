import fs from 'fs'

export const fromFileWatch = (configFile) => (type, data) => {
  if (type === 0) {
    const sink = data

    const watcher = fs.watch(configFile, (eventType, filename) => {
      switch (eventType) {
        case 'change':
          sink(1, configFile)
          break
        case 'close':
          // Successful termination
          sink(2, undefined)
          break
        case 'error':
          sink(2, filename /* error */)
          break
        default:
          sink(2, `Watching for changes in file ${configFile} failed`)
          break
      }
    })

    const talkback = (type, data) => {
      if (t === 2) {
        watcher.close()
      }
    }

    sink(0, talkback)
  }
}
