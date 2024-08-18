const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      demo: './src/demo/index.tsx',
      lib: './src/index.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: 'morph-state',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.scss'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ],
        },
      ],
    },
    externals: isProduction ? {
      react: {
        commonjs: 'react',
        commonjs2: 'react',
        amd: 'react',
        root: 'React'
      },
      'react-dom': {
        commonjs: 'react-dom',
        commonjs2: 'react-dom',
        amd: 'react-dom',
        root: 'ReactDOM'
      },
      'react-dom/client': {
        root: ['ReactDOM', 'client'],
        commonjs2: 'react-dom/client',
        commonjs: 'react-dom/client',
        amd: 'react-dom/client'
      }
    } : undefined,
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'README.md', to: './' },
          { from: 'LICENSE', to: './' }
        ]
      }),
      new HtmlWebpackPlugin({
        template: './src/demo/index.html',
        filename: 'index.html',
        chunks: ['demo']
      })
    ],
    devServer: !isProduction ? {
      static: {
        directory: path.join(__dirname, 'demo')
      },
      compress: true,
      port: 9000,
      hot: true
    } : undefined,
  };
};