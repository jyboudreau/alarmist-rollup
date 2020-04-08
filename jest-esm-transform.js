const babelJest = require('babel-jest')
const babelConfig = {
  babelrc: false,
  presets: [
    [
      '@babel/preset-env',
      {
        exclude: ['transform-regenerator'],
      },
    ],
  ],
}

module.exports = babelJest.createTransformer(babelConfig)
