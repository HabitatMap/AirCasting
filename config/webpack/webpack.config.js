const baseConfig = require("./base");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

module.exports = (_, argv) => {
  let webpackConfig = baseConfig(argv.mode);

  if (argv.mode === "development") {
    const devConfig = require("./development");
    devConfig(webpackConfig);
  }

  if (argv.mode === "production") {
    const prodConfig = require("./production");
    prodConfig(webpackConfig);

    webpackConfig.devtool = "source-map";

    webpackConfig.plugins = [
      ...(webpackConfig.plugins || []),
      sentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "habitatmap",
        project: "aircasting-web",
      }),
    ];
  }

  return webpackConfig;
};
