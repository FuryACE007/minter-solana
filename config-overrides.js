const webpack = require("webpack");

const getCacheIdentifier = require("react-dev-utils/getCacheIdentifier");

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

module.exports = function override(config, webpackEnv) {
  console.log("overriding webpack config...");

  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const loaders = config.module.rules[1].oneOf;

  loaders.splice(loaders.length - 1, 0, {
    test: /\.(js|mjs|cjs)$/,
    exclude: /@babel(?:\/|\{1,2})runtime/,
    loader: require.resolve("babel-loader"),
    options: {
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [
        [
          require.resolve("babel-preset-react-app/dependencies"),
          { helpers: true },
        ],
      ],
      cacheDirectory: true,
      // See #6846 for context on why cacheCompression is disabled
      cacheCompression: false,
      // @remove-on-eject-begin
      cacheIdentifier: getCacheIdentifier(
        isEnvProduction ? "production" : isEnvDevelopment && "development",
        [
          "babel-plugin-named-asset-import",
          "babel-preset-react-app",
          "react-dev-utils",
          "react-scripts",
        ]
      ),
      // @remove-on-eject-end
      // Babel sourcemaps are needed for debugging into node_modules
      // code.  Without the options below, debuggers like VSCode
      // show incorrect code and set breakpoints on the wrong lines.
      sourceMaps: shouldUseSourceMap,
      inputSourceMap: shouldUseSourceMap,
    },
  });
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "zlib": require.resolve("browserify-zlib"),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);
  return config;
};
