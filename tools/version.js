/* eslint-env node */

import {spawnSync} from 'child_process';
import packageJson from '../package.json';

const version = {
  base: packageJson.version,
  date: new Date().toISOString()
    .replace(/[-:]|\..+/gi, '')
    .replace(/T/, '.'),
};

version.combined = version.base + '+' + version.date;

version.copyright = packageJson.description + ' v' + version.combined + ' Copyright ' +
  (new Date().getFullYear()) + ' ' + packageJson.author;

export default version;
