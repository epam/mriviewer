/* eslint-env node */

import { spawnSync } from 'child_process';
import packageJson from '../package.json';

const version = {
  base: packageJson.version,
  date: new Date().toISOString()
    .replace(/[-:]|\..+/gi, '')
    .replace(/T/, '.'),
};

version.hash = (() => {
  function stdout(cmd) {
    return cmd.stdout === null ? 'nogit' : String(cmd.stdout).trim();
  }

  const gitLogHash = stdout(spawnSync('git', ['log', '-n1', '--pretty=format:%h']));
  console.log('hash');
  console.log(gitLogHash);
  const gitStatus = stdout(spawnSync('git', ['status', '-s']));
  console.log('status');
  console.log(gitStatus);
  const gitDate = stdout(spawnSync('git', ['log', '-1', '--date=iso', '--pretty=format:%cd']));
  if (gitDate !== 'nogit') {
    const date = new Date(gitDate);
    version.date = date.toISOString()
      .replace(/[-:]|\..+/gi, '')
      .replace(/T/, '.');
  } else {
    version.date = gitDate;
  }
  console.log('git date');
  console.log(version.date);
  return gitLogHash + (gitLogHash !== 'nogit' && gitStatus ? '-mod' : '');
})();

version.combined = `${version.base}+${version.date}.${version.hash}`;
console.log('VERSION');
console.log(version.combined);

version.copyright = `${packageJson.description} v${version.combined} Copyright ${(new Date().getFullYear())} ${packageJson.author}`;

export default version;
