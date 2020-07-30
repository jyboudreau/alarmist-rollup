const identity = val => val
const optionDefault = (variable, defaultValue, transform = identity) =>
  process.env[variable] ? transform(process.env[variable]) : defaultValue

module.exports = {
  getDefaults () {
    return {
      name: optionDefault('ALARMIST_ROLLUP_NAME', 'rollup'),
      configFile: optionDefault('ALARMIST_ROLLUP_CONFIG', 'rollup.config.js'),
      debounceWait: optionDefault('ALARMIST_ROLLUP_DEBOUNCE_WAIT', 0, val => parseInt(val, 10)),
      workingDir: optionDefault('ALARMIST_WORKING_DIRECTORY', '.alarmist')
    }
  }
}
