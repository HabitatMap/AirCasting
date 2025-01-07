const { resolve } = require("path");
const { sourcePath, additionalPaths } = require("./config");


// Extracts CSS into .css file
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const getCssLoader = () => {
  return {
    loader: require.resolve("css-loader"),
    options: { sourceMap: true, importLoaders: 2 },
  };
};

const getResolveUrlLoader = () => {
  return {
    loader: require.resolve("resolve-url-loader"),
    options: {
      sourceMap: true,
    },
  };
};

const getSassLoader = () => {
  return {
    loader: require.resolve("sass-loader"),
    options: {
      sassOptions: {
        includePaths: additionalPaths,
      },
    },
  };
};

const getEsbuildLoader = (options) => {
  return {
    loader: require.resolve("esbuild-loader"),
    options,
  };
};

const getEsbuildRule = () => {
  return {
    test: /\.(js|jsx)$/,
    include: [sourcePath, ...additionalPaths].map((path) =>
      resolve(process.cwd(), path)
    ),
    exclude: /node_modules/,
    use: [getEsbuildLoader({ loader: "jsx", target: "es2016" })],
  };
};

const getEsbuildCssLoader = () => {
  return getEsbuildLoader({ minify: true });
};

module.exports = () => [
  // Raw
  {
    test: [/\.html$/],
    exclude: [/\.(js|mjs|jsx|ts|tsx)$/],
    type: "asset/source",
  },
  // File
  {
    test: [
      /\.bmp$/,
      /\.gif$/,
      /\.jpe?g$/,
      /\.png$/,
      /\.tiff$/,
      /\.ico$/,
      /\.avif$/,
      /\.webp$/,
      /\.eot$/,
      /\.otf$/,
      /\.ttf$/,
      /\.woff$/,
      /\.woff2$/,
      /\.svg$/,
    ],
    exclude: [/\.(js|mjs|jsx|ts|tsx)$/],
    type: "asset/resource",
    generator: { filename: "static/[hash][ext][query]" },
  },
  // CSS
  {
    test: /\.(css)$/i,
    use: [
      MiniCssExtractPlugin.loader,
      getCssLoader(),
      getResolveUrlLoader(),
      getEsbuildCssLoader(),
    ],
  },
  // SASS
  {
    test: /\.(scss|sass)(\.erb)?$/i,
    use: [
      MiniCssExtractPlugin.loader,
      getCssLoader(),
      getResolveUrlLoader(),
      getSassLoader(),
    ],
  },
  // Esbuild
  getEsbuildRule(),
  // Typescript
  {
    test: /\.(ts|tsx|js\.ts)?(\.erb)?$/,
    use: [
      {
        loader: require.resolve("ts-loader"),
      },
    ],
  },
  // Coffeescript
  {
    test: /\.coffee(\.erb)?$/,
    use: [{ loader: require.resolve("coffee-loader") }],
  },
];
