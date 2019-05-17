const { environment } = require("@rails/webpacker");
const elm = require("./loaders/elm");
const webpack = require("webpack");

// https://github.com/rails/webpacker/blob/master/docs/v4-upgrade.md#excluding-node_modules-from-being-transpiled-by-babel-loader
environment.loaders.delete("nodeModules");

environment.plugins.append(
  "nouislider",
  new webpack.ProvidePlugin({
    noUiSlider: "nouislider"
  })
);

environment.loaders.get("sass").use.splice(-1, 0, {
  loader: "resolve-url-loader"
});

environment.loaders.prepend("elm", elm);
module.exports = environment;
