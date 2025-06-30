const { EsbuildPlugin } = require('esbuild-loader')
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
const webpack = require('webpack');

module.exports = (webpackConfig) => {
  webpackConfig.devtool = 'source-map'
  webpackConfig.stats = 'normal'
  webpackConfig.bail = true

  if (process.env.ANALYZE_BUNDLE) {
    webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  }

  webpackConfig.plugins.push(
    new CompressionPlugin({
      filename: '[path][base].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|css|html|json|ico|svg|eot|otf|ttf|map)$/
    }),
    // Ignore all moment.js locales
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    // Optimize moment-timezone
    new MomentTimezoneDataPlugin({
      startYear: 2018,
      endYear: 2028,
    }),
  )

  const prodOptimization = {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: 'es2015',
        css: true  // Apply minification to CSS assets
      })
    ]
  }

  Object.assign(webpackConfig.optimization, prodOptimization);

  return webpackConfig;
}
