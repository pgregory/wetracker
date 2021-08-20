/* eslint-disable */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

var apiHost;

var setupAPI=function() {
  switch(process.env.NODE_ENV) {
    case 'production':
      apiHost = "'https://wetracker-be.herokuapp.com/'";
      break;
    case 'dev':
    default:
      apiHost = "'http://localhost:8080/'";
      break;
  }
};

setupAPI();

module.exports = [
	{
		mode: 'development',
		entry: [
			'./src/app.js',
		],
		output: {
			path: path.resolve(__dirname, './bin/'),
			filename: 'app.bundle.js',
			publicPath: '/bin/',
		},
		devServer: {
			port: 8082,
			hot: true,
      historyApiFallback: {
        index: path.resolve(__dirname, '/bin/index.html')
      }
		},
		module: {
			rules: [{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					presets: ['@babel/env'],
					plugins: [
						"@babel/transform-exponentiation-operator"
					]
				}
			}, {
				test: /\.css$/i,
				use: [
          'style-loader',
          'css-loader',
        ]
			}, {
        test: /\.(scss)$/,
        use: [
          {
            loader: 'css-loader',
          }, {
            loader: 'sass-loader',
          }
        ]
      }, {
				test: /\.dot$/,
				loader: 'raw-loader',
			},{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 10000,
              mimetype: "application/font-woff"
            }
          }
        ]
			}, {
				test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: "file-loader"
			}, {
				test: /\.(jpg|png|gif)$/,
				loader: "file-loader"
			}, {
				test: /\.xm$/,
				loader: "arraybuffer-loader"
			}, {
				test: /\.marko$/,
				loader: "marko-loader"
			}, {
				test: /\.lz4$/,
				loader: "arraybuffer-loader"
			}, {
        test: /\.wasm$/,
        loader: 'arraybuffer-loader'
      }]
		},
		plugins: [
			new CopyWebpackPlugin({
				patterns: [
					{ from: 'index.html' },
				]
			}),
			new webpack.HotModuleReplacementPlugin(),
			new webpack.DefinePlugin({
				__API__: apiHost,
			}),
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery"
			}),
		],
		// Emit a source map for easier debugging
		devtool: 'source-map',
		resolve: {
			alias: {
					'jquery-ui': 'jquery-ui/ui'
      },
      fallback: {
        "stream": require.resolve('stream-browserify'),
        "path": require.resolve('path-browserify'),
        "fs": false,
        "buffer": require.resolve('buffer/'),
      }
		},
		resolveLoader: {
			alias: {
				'copy': 'file-loader?name=[path][name].[ext]&context=./src',
			}
		}
	}
]
/* eslint-enable */
