import invalidateModuleCache from './invalidate-module-cache';
import { resolve } from 'path';
import { appRoot } from '../constants';

export default function buildRollupConfig(config) {
	invalidateModuleCache(resolve(appRoot, 'dist/rollup.config.js'));
	const rollupConfig = require(resolve(appRoot, 'dist/rollup.config.js'));

	return rollupConfig({
		input: {
			input: resolve(config.context, config.input),
			treeshake: config.treeshake !== false
		},
		output: {
			file: resolve(config.context, config.output),
			name: config.name,
			namespaceFunction: config.namespaceFunction
		}
	});
}