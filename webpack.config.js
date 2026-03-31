const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  target: "web",
  entry: "./src/config-lang.js",
  devtool: "source-map",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "config-lang.min.js",
    module: true, //
    chunkFormat: "module",
    library: { type: "module" },
  },

  experiments: {
    outputModule: true,
  },

  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimize: false,
  },
  plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
};
