const { createJob } = require('alarmist')
const { default: PQueue } = require('p-queue')

const create = ({ name = 'rollup', workingDir = './.alarmist', abortMessage = 'aborted: new run started' } = {}) => {
  let jobOrPromise
  const queue = new PQueue({ concurrency: 1 })

  const withJob = async fn => {
    await queue.add(async () => {
      const job = await jobOrPromise
      jobOrPromise = fn(job)
    })
  }

  const end = async (...params) => {
    return withJob(job => {
      if (job) {
        job.end(...params)
      }
      return undefined
    })
  }

  const start = async () => {
    return withJob(job => {
      if (job) {
        job.end(abortMessage)
      }
      return createJob({ name, workingDir })
    })
  }

  const write = async data => {
    await withJob(job => {
      if (job) {
        job.log.write(data)
      } else {
        // We use the console here and not the logger
        // because the logger can be set to log to jobs.
        // This could cause an infinite loop.
        console.error(`Job (${name}) missing: ${data}`)
      }

      return job
    })
  }

  const writeln = async data => {
    await write(`${data}\n`)
  }

  return {
    end,
    start,
    write,
    writeln
  }
}

module.exports = { create }
