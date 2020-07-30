const { fromEvent, merge, pipe, map, share } = require('callbag-basics')
const { debounce } = require('callbag-debounce')
const { watch: watchFile } = require('chokidar')

function create (file, debounceWait = 0) {
  const fileWatcher = watchFile(file)
  const fileReadyStream = fromEvent(fileWatcher, 'ready')
  const fileChangeStream = fromEvent(fileWatcher, 'change')
  return pipe(
    merge(fileReadyStream, debounceWait ? debounce(debounceWait)(fileChangeStream) : fileChangeStream),
    // Always just emit the filename.
    map(() => file),
    share
  )
}

module.exports = {
  create
}
