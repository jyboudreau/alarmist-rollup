import rollup from 'rollup'
import loadConfigFile from 'rollup/dist/loadConfigFile'
import alarmist from 'alarmist'
import fs from 'fs'

let watcher

async function loadConfig(configFile) {
  await loadConfigFile(configFile)
}

function fromFileWatcher(configFile) {
  return fromObs({
    subscribe(observer) {
      // Trigger an initial event
      observer.next(configFile)

      const watcher = fs.watch(configFile, event => { 
        switch(event) {
          case 'change':
            observer.next(configFile)
            break
          case 'close':
            observer.complete()
            break
          default: 
            observer.error(`Watching for changes in file $(configFile) failed`)
            break
        }
      })

      return { unsubscribe() { watcher.close() }}
    },
  })
}

const configStream = pipe(
  fromFileWatcher(configFile),
  mapPromise(loadConfig)
)



async function * watchConfig(configFile) {
  yield loadConfig(configFile)
  fs.watch(configFile, (event) => {
    if (event === 'change') {
      yield loadConfig(configFile)
    }
  }
}

export function watch({ name, configFile, workingDir, color }) {
  // 1. Load the config and watch

  for async (const config of watchConfig(configFile)) {

  }

  let jobPromise

  const watcher = rollup.watch(config)

  watcher.on('event', (event) => {
    switch (event.code) {
      case 'START':
        // Start a job, but don't wait for the promise
        jobPromise = alarmist.createJob({ name, workingDir })
        break
      case 'END':
        if (jobPromise) {
          ;(async (promise) => {
            const job = await promise

            job.log.write()
          })(jobPromise)
        }
        break
      case 'ERROR':
        break
      default:
      // Do nothing
    }
  })
}
