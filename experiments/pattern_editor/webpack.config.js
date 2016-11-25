const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: [
    'babel-polyfill',
    './src/app.js',
  ],
  output: {
    path: path.join(__dirname, '/bin/'),
    filename: 'app.bundle.js',
    publicPath: '/bin/',
  },
  devServer: {
    inline: true,
    port: 8082,
    hot: true,
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }, {
      test: /\.json$/,
      loader: 'json-loader',
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    }]
  },
  node: {
    fs: "empty",
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: 'index.html'},
    ]),
    new webpack.HotModuleReplacementPlugin(),
  ],
  // Emit a source map for easier debugging
  devtool: 'source-map',
};
