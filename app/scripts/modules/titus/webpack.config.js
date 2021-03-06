'use strict';

const path = require('path');
const basePath = path.join(__dirname, '..', '..', '..', '..');
const NODE_MODULE_PATH = path.join(basePath, 'node_modules');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const exclusionPattern = /(node_modules|\.\.\/deck)/;
const WEBPACK_THREADS = Math.max(require('physical-cpu-count') - 1, 1);

module.exports = {
  context: basePath,
  mode: 'production',
  stats: 'errors-only',
  watch:  process.env.WATCH === 'true',
  entry: {
    lib: path.join(__dirname, 'src', 'index.ts'),
  },
  output: {
    path: path.join(__dirname, 'lib'),
    filename: '[name].js',
    library: '@spinnaker/titus',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        cache: true,
        sourceMap: true,
        uglifyOptions: { mangle: false }
      }),
    ],
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.html'],
    modules: [
      NODE_MODULE_PATH,
      path.resolve('.'),
    ],
    alias: {
      '@spinnaker/titus': path.join(__dirname, 'src'),
      'coreImports': path.resolve(basePath, 'app', 'scripts', 'modules', 'core', 'src', 'presentation', 'less', 'imports', 'commonImports.less'),
      'titus': path.join(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          { loader: 'cache-loader' },
          { loader: 'thread-loader', options: { workers: WEBPACK_THREADS } },
          { loader: 'babel-loader' },
          { loader: 'envify-loader' },
          { loader: 'eslint-loader' },
        ],
        exclude: exclusionPattern
      },
      {
        test: /\.tsx?$/,
        use: [
          { loader: 'cache-loader' },
          { loader: 'thread-loader', options: { workers: WEBPACK_THREADS } },
          { loader: 'babel-loader' },
          { loader: 'ts-loader', options: { happyPackMode: true } },
          { loader: 'tslint-loader' },
        ],
        exclude: exclusionPattern
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'postcss-loader' },
          { loader: 'less-loader' },
        ],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'postcss-loader' },
        ]
      },
      {
        test: /\.html$/,
        exclude: exclusionPattern,
        use: [
          { loader: 'ngtemplate-loader?relativeTo=' + (path.resolve(__dirname)) + '&prefix=titus' },
          { loader: 'html-loader' },
        ]
      },
      {
        test: /\.(woff|woff2|otf|ttf|eot|png|gif|ico|svg)$/,
        use: [
          { loader: 'file-loader', options: { name: '[name].[hash:5].[ext]'} },
        ],
      },
      {
        test: require.resolve('jquery'),
        use: [
          { loader: 'expose-loader?$' },
          { loader: 'expose-loader?jQuery' },
        ],
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
  ],
  externals: [
    '@spinnaker/core',
    '@spinnaker/amazon',
    'exports-loader?"n3-line-chart"!n3-charts/build/LineChart.js',
    nodeExternals({ modulesDir: '../../../../node_modules' }),
  ],
};
