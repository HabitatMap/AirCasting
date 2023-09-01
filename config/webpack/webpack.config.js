const baseConfig = require('./base')

module.exports = (_, argv) => {
  let webpackConfig = baseConfig(argv.mode);

  if (argv.mode === 'development') {
    const devConfig = require('./development');
    devConfig(webpackConfig);
  }

  if (argv.mode === 'production') {
    const prodConfig = require('./production');
    prodConfig(webpackConfig);
  }

  return webpackConfig;
}
