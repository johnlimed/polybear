const	autoprefixer = require('autoprefixer');
const	precss = require('precss');
const	path = require('path');

const REACT_DIR = path.join(__dirname, 'webpack/react_components/');
const FONT_DIR 	= path.join(__dirname, 'webpack/fonts');
const CSS_DIR	= path.join(__dirname, 'webpack/css');
const IMG_DIR	= path.join(__dirname, 'webpack/img');
const DIST_DIR 	= path.join(__dirname, 'public/');
const NODE_DIR 	= path.join(__dirname, 'node_modules');
const ENTRY_DIR = `${REACT_DIR}/reactRouter.jsx`;


const Loaders = [{
	test: /\.jsx?/,
	// include: REACT_DIR,
	// target: 'node',
	// externals: [nodeExternals()],
	include: REACT_DIR,
	exclude: NODE_DIR,
	loader: 'babel',
	query: {
		presets: ['es2015', 'react'],
	},
}, {
	test: /\.scss$/,
	loader: 'style!css!sass',
}, {
	test: /\.css$/,
	include: CSS_DIR,
	loader: 'style-loader!css-loader?localIdentName=[path][name]---[local]---[hash:base64:5]&modules=true!postcss-loader',
}, {
	test: /\.png$/,
	include: IMG_DIR,
	loader: 'url-loader?limit=100000',
}, {
	test: /\.jpg$/,
	include: IMG_DIR,
	loader: 'file-loader',
}, {
	test: /\.(eot|svg|ttf|woff|woff2)$/,
	include: FONT_DIR,
	loader: 'url',
}];

module.exports = [{
	devtool: 'eval-source-map',
	// entry: [ENTRY_DIR],
	output: {
		path: DIST_DIR,
		filename: 'bundle.js',
	},
	module: {
		loaders: Loaders,
	},
  postcss() {
      return [precss, autoprefixer];
  },
}];
