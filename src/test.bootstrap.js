import resolvePackageModule from './utils/resolve-package-module';
import { JSDOM } from 'jsdom';
import mocha from 'mocha';
import assert from 'assert';
import * as sinon from 'sinon';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

global.sinon = sinon;
global.assert = assert;
global.describe = mocha.describe;
global.it = mocha.it;
global.xit = mocha.xit;
global.before = mocha.before;
global.beforeEach = mocha.beforeEach;
global.after = mocha.after;
global.afterEach = mocha.afterEach;
global.setup = mocha.setup;
global.suite = mocha.suite;
global.suiteSetup = mocha.suiteSetup;
global.suiteTeardown = mocha.suiteTeardown;
global.teardown = mocha.teardown;
global.test = mocha.test;
global.run = mocha.run;

const DOM = new JSDOM(``, {
	url: 'https://example.org/',
	referrer: 'https://example.com/',
	contentType: 'text/html',
	includeNodeLocations: true,
	storageQuota: 10000000
});

global.window = DOM.window;
global.document = DOM.window.document;
global.Node = DOM.window.Node;
global.Element = DOM.window.Element;
global.DOMParser = DOM.window.DOMParser;

Object.keys(DOM.window).forEach((property) => {
	if (typeof global[property] === 'undefined') {
		global[property] = DOM.window[property];
	}
});

global.navigator = {
	userAgent: 'node.js'
};

require('../public/babel-regenerator-runtime');

require.extensions['.css'] = () => null;
require.extensions['.png'] = () => null;
require.extensions['.jpg'] = () => null;

require('@babel/register')({
	cwd: (function() {
		const cwd = process.cwd();

		if (cwd.includes('/modules')) {
			return cwd.split('/modules')[0];
		}

		if (cwd.includes('/bitrix')) {
			return cwd.split('/bitrix')[0];
		}

		return resolve(cwd, '../../../../../');
	})(),
	presets: [
		resolvePackageModule('@babel/preset-env'),
		resolvePackageModule('@babel/preset-react')
	],
	plugins: [
		[resolvePackageModule('babel-plugin-module-resolver'), {
			resolvePath: moduleResolver
		}],
		resolvePackageModule('@babel/plugin-transform-flow-strip-types'),
		resolvePackageModule('@babel/plugin-proposal-class-properties')
	],
	exclude: [
		'**/node_modules**/',
		'**/babel-external-helpers.js',
		'**/base-polyfill.js',
		'**/bundle.core-init.js',
		'**/bundle.core.js',
		'**/core/core.js'
	]
});

function moduleResolver(sourcePath, currentFile, opts) {
	const exp = /(^\w+)\.(.*)/;
	const root = currentFile.split('modules')[0];

	if (exp.test(sourcePath)) {
		const modulesPath = resolve(root, 'modules');
		const splitedName = sourcePath.split('.');
		const moduleName = splitedName.shift();

		const moduleJsPath = resolve(modulesPath, moduleName, 'install', 'js', moduleName);
		let extPath = resolve(moduleJsPath, join.apply(null, splitedName));

		// @todo refactoring
		if (extPath.endsWith('main/core')) {
			extPath = resolve(extPath, 'es6');
		}

		const configPath = resolve(extPath, 'bundle.config.js');

		if (existsSync(configPath)) {
			const config = require(configPath);
			return resolve(extPath, config.input);
		}
	}
}