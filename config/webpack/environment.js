const { environment } = require("@rails/webpacker");
const elm = require("./loaders/elm");
const erb = require("./loaders/erb");
const webpack = require("webpack");

environment.plugins.append(
  "nouislider",
  new webpack.ProvidePlugin({
    noUiSlider: "nouislider"
  })
);

environment.loaders.append("elm", elm);
environment.loaders.append("erb", erb);
module.exports = environment;
