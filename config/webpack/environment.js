const { environment } = require("@rails/webpacker");
const elm = require("./loaders/elm");
const webpack = require("webpack");

environment.plugins.append(
  "nouislider",
  new webpack.ProvidePlugin({
    noUiSlider: "nouislider"
  })
);

environment.loaders.append("elm", elm);
module.exports = environment;
