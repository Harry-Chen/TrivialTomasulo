const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const htmlPlugin = new HtmlWebpackPlugin({
  template: "./src/index.html",
  filename: "./index.html",
});


module.exports = {
  entry: {
    index: "./src/index.tsx",
  },
  output: {
    path: path.resolve("./dist"),
    filename: "[name].js"
  },
  plugins: [ htmlPlugin ],
  devServer: {
    contentBase: './dist'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', {
          loader: 'typings-for-css-modules-loader',
          options: {
            modules: true,
            namedExport: true,
            sass: true,
            localIdentName: '[name]--[local]--[hash:base64:5]'
          }
        }]
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  }
};
