const { join, resolve } = require("path");
const fs = require("fs");

const {
  sourcePath,
  sourceEntryPath,
  additionalPaths,
  publicRootPath,
  publicOutputPath,
  devServerPort,
} = require("./config");
const getRules = require("./rules");
const getPlugins = require("./plugins");

const getEntryObject = () => {
  const packsPath = resolve(process.cwd(), join(sourcePath, sourceEntryPath));
  const entryPoints = {};

  fs.readdirSync(packsPath).forEach((packNameWithExtension) => {
    const packName = packNameWithExtension
      .replace(".js", "")
      .replace(".scss", "");

    if (entryPoints[packName]) {
      entryPoints[packName] = [
        entryPoints[packName],
        packsPath + "/" + packNameWithExtension,
      ];
    } else {
      entryPoints[packName] = packsPath + "/" + packNameWithExtension;
    }
  });

  return entryPoints;
};

const getModulePaths = () => {
  const result = [resolve(process.cwd(), sourcePath)];

  additionalPaths.forEach((additionalPath) => {
    result.push(resolve(process.cwd(), additionalPath));
  });

  result.push("node_modules");

  return result;
};

const sharedWebpackConfig = (mode) => {
  const isProduction = mode === "production";
  const hash = isProduction ? "-[contenthash]" : "";
  const publicPath = isProduction
    ? `/${publicOutputPath}/`
    : `http://localhost:${devServerPort}/${publicOutputPath}/`;

  return {
    mode,
    devtool: "source-map",
    entry: getEntryObject(),
    optimization: {
      runtimeChunk: false,
      splitChunks: {
        chunks(chunk) {
          return chunk.name !== "application2"; // if you want to exclude code splitting for certain packs
        },
      },
    },
    resolve: {
      extensions: [
        ".coffee",
        ".js.coffee",
        ".erb",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".js.ts",
        ".vue",
        ".sass",
        ".scss",
        ".css",
        ".png",
        ".svg",
        ".gif",
        ".jpeg",
        ".jpg",
      ],
      modules: getModulePaths(),
    },
    resolveLoader: {
      modules: ["node_modules"],
    },
    module: {
      strictExportPresence: true,
      rules: getRules(),
    },
    output: {
      filename: "[name]-[chunkhash].js",
      chunkFilename: `js/[name]${hash}.chunk.js`,
      hotUpdateChunkFilename: "js/[id].[fullhash].hot-update.js",
      path: resolve(process.cwd(), `${publicRootPath}/${publicOutputPath}`),
      publicPath: publicPath,
    },
    plugins: getPlugins(isProduction),
  };
};

module.exports = sharedWebpackConfig;
