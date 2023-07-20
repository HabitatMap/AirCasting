const { resolve } = require("path");

const isProduction = process.env.NODE_ENV === "production";
const elmSource = resolve(process.cwd());
const elmBinary = `${elmSource}/node_modules/.bin/elm`;

const elmDefaultOptions = { cwd: elmSource, pathToElm: elmBinary };
const developmentOptions = Object.assign({}, elmDefaultOptions, {
  verbose: true,
  // when running the app in debug mode decoding a long list crashes the app
  // that happens for example when receiving all measurements for a selected session
  debug: false,
});
const productionOptions = Object.assign({}, elmDefaultOptions, {
  optimize: true,
});

const elmWebpackLoader = {
  loader: "elm-webpack-loader",
  options: isProduction ? productionOptions : developmentOptions,
};

module.exports = {
  test: /\.elm(\.erb)?$/,
  exclude: [/elm-stuff/, /node_modules/],
  use: isProduction
    ? [elmWebpackLoader]
    : [{ loader: "elm-hot-webpack-loader" }, elmWebpackLoader],
};
