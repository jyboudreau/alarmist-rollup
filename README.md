# alarmist-rollup

Wrap rollup watch in alarmist jobs

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

Run lint, tests, build, etc before pushing/submitting PRs

- `npm test` - lint and test
- `npm run build` - run tests then build
- `npm run watch` - watch for changes and run build
- `npm run ci` - run build and submit coverage to coveralls
- `npm start` - watch for changes and build, lint, test, etc in parallel with alarmist
