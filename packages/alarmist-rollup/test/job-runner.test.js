/* global jest,  */ // See https://github.com/facebook/jest/issues/9920 */
const { beforeEach, expect, test, describe } = require('@jest/globals')
const alarmist = require('alarmist')
const { default: mockConsole } = require('jest-mock-console')

jest.mock('alarmist')
alarmist.createJob = jest.fn()

const { create: createJobRunner } = require('../src/job-runner.js')

const createMockJob = () => ({
  end: jest.fn().mockResolvedValue(),
  log: {
    write: jest.fn()
  }
})

beforeEach(() => {
  alarmist.createJob.mockReset()
})

test('createJobRunner creates a job runner', () => {
  const jobRunner = createJobRunner()

  expect(jobRunner).toEqual(
    expect.objectContaining({
      end: expect.any(Function),
      start: expect.any(Function),
      write: expect.any(Function),
      writeln: expect.any(Function)
    })
  )
})

test('jobRunner start will start an alarmist job', async () => {
  const jobRunner = createJobRunner()

  const mockJob = createMockJob()
  alarmist.createJob.mockResolvedValue(mockJob)

  await jobRunner.start()

  expect(alarmist.createJob).toBeCalledTimes(1)
})

test('jobRunner start will end a current job if we start a new one.', async () => {
  const jobRunner = createJobRunner()

  const mockJob1 = createMockJob()
  const mockJob2 = createMockJob()

  alarmist.createJob
    .mockResolvedValueOnce(mockJob1)
    .mockResolvedValueOnce(mockJob2)
    .mockRejectedValue(new Error())

  await jobRunner.start()

  expect(alarmist.createJob).toBeCalledTimes(1)

  await jobRunner.start()

  expect(mockJob1.end).nthCalledWith(1, 'aborted: new run started')
})

describe('jobRunner parameter', () => {
  test('name is used for the job name', async () => {
    alarmist.createJob.mockResolvedValue(createMockJob())
    const name = 'myRollupJob'
    const jobRunner = createJobRunner({ name })

    await jobRunner.start()

    expect(alarmist.createJob).toBeCalledWith(expect.objectContaining({ name }))
  })

  test('workingDir is passed to the job', async () => {
    alarmist.createJob.mockResolvedValue(createMockJob())
    const workingDir = __dirname
    const jobRunner = createJobRunner({ workingDir })

    await jobRunner.start()

    expect(alarmist.createJob).toBeCalledWith(expect.objectContaining({ workingDir }))
  })

  test('abortMessage is used when aborting a job', async () => {
    const mockJob1 = createMockJob()
    const mockJob2 = createMockJob()

    alarmist.createJob.mockResolvedValueOnce(mockJob1).mockResolvedValueOnce(mockJob2)

    const abortMessage = 'Abort!'
    const jobRunner = createJobRunner({ abortMessage })

    await jobRunner.start()
    await jobRunner.start()

    expect(mockJob1.end).lastCalledWith(abortMessage)
  })
})

test('jobRunner.end will end a job', async () => {
  const mockJob = createMockJob()

  alarmist.createJob.mockResolvedValue(mockJob)

  const jobRunner = createJobRunner()

  await jobRunner.start()

  const param1 = 'param1'
  const param2 = 'param2'

  await jobRunner.end(param1, param2)

  expect(mockJob.end).toBeCalledWith(param1, param2)
})

test("jobRunner.end won't miss ending a pending start", async () => {
  const mockJob = createMockJob()

  alarmist.createJob.mockResolvedValue(mockJob)

  const jobRunner = createJobRunner()

  jobRunner.start()

  await jobRunner.end()

  expect(mockJob.end).toHaveBeenCalled()
})

test('jobRunner.end is indempotent', async () => {
  const mockJob = createMockJob()

  alarmist.createJob.mockResolvedValue(mockJob)

  const jobRunner = createJobRunner()

  await jobRunner.start()

  await jobRunner.end()
  await jobRunner.end()

  expect(mockJob.end).toBeCalledTimes(1)
})

test('jobRunner.write will write to an existing job', async () => {
  const mockJob = createMockJob()

  alarmist.createJob.mockResolvedValue(mockJob)

  const jobRunner = createJobRunner()

  await jobRunner.start()
  const message = 'hello'
  await jobRunner.write(message)

  expect(mockJob.log.write).toBeCalledWith(message)
})

test('jobRunner.write will write to console if there is no job running', async () => {
  const mockJob = createMockJob()
  alarmist.createJob.mockResolvedValue(mockJob)
  const jobRunner = createJobRunner()

  mockConsole()

  const message = 'hello'
  await jobRunner.write(message)

  expect(console.error).toBeCalledWith(expect.stringContaining(message))
})

test('jobRunner.writeln will write to a job with a line ending', async () => {
  const mockJob = createMockJob()

  alarmist.createJob.mockResolvedValue(mockJob)

  const jobRunner = createJobRunner()

  await jobRunner.start()
  const message = 'hello'
  await jobRunner.writeln(message)

  expect(mockJob.log.write).toBeCalledWith(`${message}\n`)
})
