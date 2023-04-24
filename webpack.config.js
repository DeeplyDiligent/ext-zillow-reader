const { resolve } = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const tsRule = {
  test: /\.ts(x?)$/,
  exclude: /node_modules/,
  use: 'ts-loader',
}

const plugins = [
  new CopyWebpackPlugin({
    patterns: [
      { from: "public", to: "." }
    ],
  }),
  new CleanWebpackPlugin(),
];

module.exports = {
  mode: "development",
  devtool: 'cheap-module-source-map',
  entry: resolve(__dirname) + '/src/index.tsx',
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist'),
  },
  module: {
    rules: [tsRule, { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] }]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  plugins
}