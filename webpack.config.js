const fs = require('fs');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isExampleMode = !!env.exampleMode;

  return {
    mode: isProduction ? 'production' : 'development',
    entry: isProduction ? (isExampleMode ? './src/demo/index.tsx' : './src/index.ts') : {
      demo: './src/demo/index.tsx',
      lib: './src/index.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'index.js' : '[name].js',
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
      isProduction && !isExampleMode && new CopyWebpackPlugin({
        patterns: [
          { from: 'README.md', to: './' },
          { from: 'LICENSE', to: './' }
        ]
      }),
      isProduction && isExampleMode && new CopyWebpackPlugin({ patterns: [{ from: 'README.md', to: './' }] }),
      (!isProduction || isExampleMode) && new HtmlWebpackPlugin({
        template: './src/demo/index.html',
        filename: isProduction ? 'examples/index.html' : 'index.html',
        chunks: isProduction ? undefined : ['demo']
      }),
      isProduction && !isExampleMode && new PackageJsonTransformerPlugin(),
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


class PackageJsonTransformerPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('PackageJsonTransformerPlugin', (compilation, callback) => {
      const packageJsonPath = path.resolve(__dirname, 'package.json');
      const distPackageJsonPath = path.resolve(compiler.options.output.path, 'package.json');

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Remove devDependencies and scripts
      delete packageJson.devDependencies;
      delete packageJson.scripts;

      // Modify main and types
      packageJson.main = 'index.js';
      packageJson.types = 'index.d.ts';

      // Write the modified package.json to the output directory
      fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

      console.log('Transformed and copied package.json to dist folder.');
      callback();
    });
  }
}