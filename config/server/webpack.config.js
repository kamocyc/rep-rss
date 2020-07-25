const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: "./src/server/server.ts",
  output: {
    path: path.resolve('dist/server'),
    filename: '[name].js'
  },
  target: 'node',
  externals: [nodeExternals()], 
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
    ]
  },
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
  }
}; 