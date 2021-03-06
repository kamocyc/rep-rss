/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require('path')
const { merge } = require('webpack-merge');

const htmlWebpackPlugin = new HtmlWebPackPlugin({
  template: "./src/client/index.html",
  filename: "./index.html",
});

module.exports = merge({
  entry: "./src/client/index.tsx",
  output: {
    path: path.resolve('dist/client'),
    filename: '[name].js',
    publicPath: '/'
  },
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts', '.js', '.tsx'
    ],
  },
  plugins: [htmlWebpackPlugin]
}, {
  mode: 'development',
  devServer: {
    historyApiFallback: true,
    // inline: true,
    open: true,
    host: '127.0.0.1',
    port: 8080,
    index: '',
    proxy: {
      '**': {
        target: 'http://127.0.0.1:3000',
        secure: false,
        logLevel: 'debug'
      },
    },
  }
}); 