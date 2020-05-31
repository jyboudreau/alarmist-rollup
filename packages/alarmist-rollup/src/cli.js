const yargs = require('yargs')
const { watch } = require('./index.js')
const path = require('path')

const argv = yargs.argv._

const configFile = path.resolve(argv[0])

watch({ name: 'rollup', configFile, workingDir: '.alarmist', colors: true })
