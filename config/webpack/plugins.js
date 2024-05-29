const { devServerPort } = require("./config");
// Extracts CSS into .css file
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const WebpackAssetsManifest = require("webpack-assets-manifest");
const Dotenv = require("dotenv-webpack");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

module.exports = (isProduction) => {
  const devServerManifestPublicPath = `http://localhost:${devServerPort}/packs/`;
  const plugins = [
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "habitatmap",
      project: "aircasting-web",
    }),
    new Dotenv(),
    new WebpackAssetsManifest({
      output: "manifest.json",
      writeToDisk: true,
      publicPath: isProduction ? true : devServerManifestPublicPath,
      entrypoints: true,
      entrypointsUseAssets: true,
    }),
    new RemoveEmptyScriptsPlugin(),
  ];

  const hash = isProduction ? "-[contenthash:8]" : "";
  plugins.push(
    new MiniCssExtractPlugin({
      filename: `css/[name]${hash}.css`,
      chunkFilename: `css/[id]${hash}.css`,
    })
  );

  return plugins;
};
