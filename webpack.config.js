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
      query: {
        presets: ['es2015']
      }
    }, {
      test: /\.json$/,
      loader: 'json-loader',
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    }, {
      test: /\.dot$/,
      loader: 'raw-loader',
    },{
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: "url-loader?limit=10000&mimetype=application/font-woff"
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: "file-loader"
    }, {
      test: /\.(jpg|png)$/,
      loader: "file-loader"
    }, {
      test: /\.xm$/,
      loader: "file-loader"
    }, {
      test: /\.marko$/,
      loader: "marko-loader"
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
  resolve: {
      alias: {
          'jquery-ui': 'jquery-ui/ui'
      }
  },
};
