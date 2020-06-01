const yargs = require('yargs')
const { watch } = require('../index.js')

const optionDefault = (variable, defaultValue) => process.env[variable] || defaultValue

const usageText = `Usage: $0 [options]

Start rollup in watch mode. The working directory
should match the working directory of the monitor and usually this will
be the default. If the job is started via a watcher started
by the monitor then the 'ALARMIST_WORKING_DIRECTORY' environment
variable will have already been set.

Environment Variables:

FORCE_COLOR
ALARMIST_WORKING_DIRECTORY
ALARMIST_ROLLUP_NAME
ALARMIST_ROLLUP_CONFIG`

const argv = yargs
  .scriptName('alarmist-rollup')
  .usage(usageText)
  .option('name', {
    alias: 'n',
    describe: 'The name to use for the job.',
    default: optionDefault('ALARMIST_ROLLUP_NAME', 'rollup')
  })
  .option('working-dir', {
    alias: 'w',
    describe: 'The directory in which to write logs, etc.',
    default: optionDefault('ALARMIST_WORKING_DIRECTORY', '.alarmist')
  })
  .option('config', {
    alias: 'c',
    describe: 'The Rollup config file path.',
    default: optionDefault('ALARMIST_ROLLUP_CONFIG', 'rollup.config.js')
  })
  .option('color', {
    describe: 'Turn on colors for rollup stats report.',
    boolean: true,
    default: true
  })
  .help().argv

watch({
  name: argv.name,
  workingDir: argv['working-dir'],
  configFile: argv.config,
  colors: argv.colors
})
