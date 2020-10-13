# alarmist-rollup

Wrap rollup watch in alarmist jobs

![Tests](https://github.com/jyboudreau/alarmist-rollup/workflows/CI%20Workflow/badge.svg?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![code format: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)

## Usage

As this is a tool linking `rollup` with `alarmist`, it is expected that your project already has both [`alarmist`](https://www.npmjs.com/package/alarmist) and [`rollup`](https://www.npmjs.com/package/rollup) installed.

npm:

```
npm install --save-dev rollup alarmist alarmist-rollup
```

yarn:

```
yarn add --dev rollup alarmist alarmist-rollup
```

You can then add something like the following to your `package.json` scripts

```javascript
{
  ...
  "scripts": {
    ...
    "alarmist:build": "alarmist-rollup -n job-name -c ./path/to/rollup/config",
    ...
  },
  ...
}
```

Then add that script to the watch jobs started by `alarmist-monitor`.

```
Usage: alarmist-rollup [options]

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
ALARMIST_ROLLUP_CONFIG

Options:
  --version          Show version number                        [boolean]
  --name, -n         The name to use for the job.               [default: "rollup"]
  --working-dir, -w  The directory in which to write logs, etc. [default: ".alarmist"]
  --config, -c       The Rollup config file path.               [default: "rollup.config.js"]
  --help             Show help                                  [boolean]
```

## Example configuration

See the example project in [./packages/alarmist-rollup-example] for a working configuration.

Test the example configuration with these steps:

1. Install yarn from [yarnpkg.com](https://yarnpkg.com/getting-started/install).
2. Clone this project: `git clone https://github.com/jyboudreau/alarmist-rollup.git`
3. Run `yarn` to install dependencies
4. Run `yarn example:monitor` to see it in action.

> Note: The example is setup in a way to trigger rollup warnings in order to show
> that the integration with rollup is working fine.

## Contributing

Run lint, format and tests etc before pushing/submitting PRs

- `yarn test` - Run tests for the project.
- `yarn format` - Enforce prettier formatting.
- `yarn lint` - Lint the project with standardjs rules.
- `yarn verify` - Test, format and lint all in one.
- `yarn start` - Watch for changes lint, test, etc in parallel with alarmist.
- `yarn ci` - Run `verify` and submit coverage to coveralls.
- `yarn example:monitor` - Run the example project's monitor with alarmist and alarmist-rollup.
