const { EsbuildPlugin } = require('esbuild-loader')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = (webpackConfig) => {
  webpackConfig.devtool = 'source-map'
  webpackConfig.stats = 'normal'
  webpackConfig.bail = true

  webpackConfig.plugins.push(
    new CompressionPlugin({
      filename: '[path][base].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|css|html|json|ico|svg|eot|otf|ttf|map)$/
    })
  )

  const prodOptimization = {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: 'es2015',
        css: true  // Apply minification to CSS assets
      })
    ],
    splitChunks: false
  }

  Object.assign(webpackConfig.optimization, prodOptimization);

  return webpackConfig;
}
