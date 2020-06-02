const yargs = require('yargs')
const { watch } = require('./index.js')
const { getDefaults } = require('./defaults.js')

const usageText = `Usage: $0 [options]

Start rollup in watch mode. The working directory
should match the working directory of the monitor and usually this will
be the default. If the job is started via a watcher started
by the monitor then the 'ALARMIST_WORKING_DIRECTORY' environment
variable will have already been set.

Environment Variables:

FORCE_COLOR
NO_COLOR
ALARMIST_WORKING_DIRECTORY
ALARMIST_ROLLUP_NAME
ALARMIST_ROLLUP_CONFIG`

function run (args) {
  const defaults = getDefaults()

  const cli = yargs
    .scriptName('alarmist-rollup')
    .usage(usageText)
    .option('name', {
      alias: 'n',
      describe: 'The name to use for the job.',
      default: defaults.name
    })
    .option('working-dir', {
      alias: 'w',
      describe: 'The directory in which to write logs, etc.',
      default: defaults.workingDir
    })
    .option('config', {
      alias: 'c',
      describe: 'The Rollup config file path.',
      default: defaults.configFile
    })
    .help()
    .exitProcess(false)

  const argv = cli.parse(args)
  if (argv.help) {
    yargs.showHelp()
  } else {
    watch({
      name: argv.name,
      workingDir: argv['working-dir'],
      configFile: argv.config
    })
  }
}

module.exports = { run }
