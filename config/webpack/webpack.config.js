const path = require("path");
const webpack = require("webpack");
const elmLoader = require("./loaders/elm");

// Extracts CSS into .css file
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Removes exported JavaScript files from CSS-only entries
// in this example, entry.custom will create a corresponding empty custom.js file
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");

const mode =
  process.env.NODE_ENV === "development" ? "development" : "production";

module.exports = {
  mode: mode,
  optimization: { moduleIds: "deterministic" },
  devtool:
    mode === "production" ? "source-map" : "cheap-module-eval-source-map",
  devServer: {
    https: false,
    host: "localhost",
    port: 3035,
    hot: true,
    devMiddleware: {
      publicPath: "/assets/builds",
    },
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  entry: {
    application: [
      "./app/javascript/packs/elm.js",
      "./app/assets/stylesheets/main.scss",
    ],
  },
  output: {
    filename: "[name].js",
    sourceMapFilename: "[file].map",
    path: path.resolve(__dirname, "..", "..", "app/assets/builds"),
  },
  module: {
    rules: [
      elmLoader,
      {
        test: /\.(?:sa|sc|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true, // Set this option to true to enable source maps for resolve-url-loader
            },
          },

          {
            loader: "resolve-url-loader",
            options: {
              sourceMap: true, // Set this option to true to enable source maps for resolve-url-loader
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true, // Set this option to true to enable source maps for resolve-url-loader
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|eot|woff2|woff|ttf|svg)$/i,
        use: "file-loader",
      },
    ],
  },

  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
  ],
  resolve: {
    extensions: [
      ".elm",
      ".js",
      ".sass",
      ".scss",
      ".css",
      ".png",
      ".svg",
      ".gif",
      ".jpeg",
      ".jpg",
      ".eot",
      ".woff",
    ],
  },
};
