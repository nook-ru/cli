import * as path from 'path';
import * as fs from 'fs';
import ini from 'ini';
import * as os from 'os';
import { appRoot } from '../constants';
import argv from '../process/argv';
import 'colors';

const preUpdateHandler = path.resolve(appRoot, 'src/mercurial/hooks/preupdate.sh');
const updateHandler = path.resolve(appRoot, 'src/mercurial/hooks/update.sh');

const defaultPath = path.resolve(os.homedir(), '.hgrc');
const hgrcPath = argv.path || defaultPath;

export default function bitrixAdjust(params = { path: hgrcPath }) {
	if (!params.path) {
		throw new Error('params.path is not string');
	}

	if (!fs.existsSync(params.path)) {
		if (!fs.existsSync(path.dirname(params.path))) {
			fs.mkdirSync(path.dirname(params.path), {recursive: true});
		}

		fs.writeFileSync(params.path, '');
	}

	if (!fs.existsSync(`${params.path}.backup`)) {
		fs.copyFileSync(params.path, `${params.path}.backup`);
	}

	let hgrc = ini.parse(fs.readFileSync(params.path, 'utf-8'));

	if (!('hooks' in hgrc)) {
		hgrc.hooks = {};
	}

	hgrc.hooks['preupdate.bitrix.build.watcher'] = preUpdateHandler;
	hgrc.hooks['update.bitrix.build.watcher'] = updateHandler;

	let encodedHgrc = ini.encode(hgrc);

	fs.writeFileSync(params.path, encodedHgrc);

	if (!argv.silent) {
		console.log(`${params.path} updated`.green.bold);
	}
}