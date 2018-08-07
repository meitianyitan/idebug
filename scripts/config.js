// rollup.config.js

const path = require('path');
// 转换ES2015与buble
const buble = require('rollup-plugin-buble');
const alias = require('rollup-plugin-alias');
const cjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const node = require('rollup-plugin-node-resolve');

const version = process.env.VERSION || require('../package.json').version;
const copyright = new Date().getFullYear() > 2018 ? '2018-' + new Date().getFullYear() : 2018;

const banner =
  '/*!\n' +
  ' * idebug v' + version + '\n' +
  ' * (c) ' + copyright + ' Weich\n' +
  ' * Released under the MIT License.\n' +
  ' */';

const aliases = require('./alias');
const resolve = p => {
	const base = p.split('/')[0];
	if (aliases[base]) {
		return path.resolve(aliases[base], p.slice(base.length + 1));
	} else {
		return path.resolve(__dirname, '../', p);
	}
};

const builds = {
	// CommonJS. Used by bundlers e.g. Webpack & Browserify
	'web-idebug-cjs': {
		entry: resolve('web/idebug.js'),
		dest: resolve('dist/idebug.cjs.js'),
		format: 'cjs',
		banner
	},
	// ES Modules. Used by bundlers that support ES Modules, e.g. Rollup & Webpack 2
	'web-idebug-esm': {
		entry: resolve('web/idebug.js'),
		dest: resolve('dist/idebug.esm.js'),
		format: 'es',
		banner
	},
	// dev build (UMD for in-browser use)
	'web-idebug-umd-dev': {
		entry: resolve('web/idebug.js'),
		dest: resolve('dist/idebug.js'),
		format: 'umd',
		env: 'development',
		moduleName: 'IDebug',
		plugins: [node(), cjs()],
		banner
	},
	// production build (UMD for in-browser use)
	'web-idebug-umd-prod': {
		entry: resolve('web/idebug.js'),
		dest: resolve('dist/idebug.min.js'),
		format: 'umd',
		env: 'production',
		moduleName: 'IDebug',
		plugins: [node(), cjs()],
		banner
	}
};

function genConfig(name) {
	const opts = builds[name];
	const config = {
		input: opts.entry,
		external: opts.external,
		plugins: [
			replace({
				__VERSION__: version
			}),
			buble(),
			alias(Object.assign({}, aliases, opts.alias))
		].concat(opts.plugins || []),
		output: {
			file: opts.dest,
			format: opts.format,
			banner: opts.banner,
			name: opts.moduleName || 'IDebug'
		}
	};

	if (opts.env) {
		config.plugins.push(replace({
			'process.env.NODE_ENV': JSON.stringify(opts.env)
		}));
	}

	Object.defineProperty(config, '_name', {
		enumerable: false,
		value: name
	});

	return config;
}

if (process.env.TARGET) {
	module.exports = genConfig(process.env.TARGET);
} else {
	exports.getBuild = genConfig;
	exports.getAllBuilds = () => Object.keys(builds).map(genConfig);
}