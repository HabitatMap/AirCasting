var path = require('path');
var webpack = require('webpack');
var StatsPlugin = require('stats-webpack-plugin');

var devServerPort = 3808;
var production = process.env.NODE_ENV === 'production';

config = {
  mode: production ? 'production' : 'development',
  entry: {
    'application': './webpack/application.js'
  },
  output: {
    path: path.join(__dirname, '..', 'public', 'webpack'),
    publicPath: '/webpack/',
    filename: production ? '[name]-[chunkhash].js' : '[name].js'
  },
  plugins: [
    new StatsPlugin('manifest.json', {
      chunkModules: false,
      source: false,
      chunks: false,
      modules: false,
      assets: true
    })],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

if (production) {
  config.devtool = 'nosources-source-map';
} else {
  config.devServer = {
    port: devServerPort,
    headers: { 'Access-Control-Allow-Origin': '*' }
  };
  config.output.publicPath = '//localhost:' + devServerPort + '/webpack/';
  config.devtool = 'cheap-module-eval-source-map';
}

module.exports = config;
