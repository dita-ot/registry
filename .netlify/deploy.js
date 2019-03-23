const util = require('util');
const _fs = require('fs');
const fs = {
  mkdir: util.promisify(_fs.mkdir),
  readdir: util.promisify(_fs.readdir),
  copyFile: util.promisify(_fs.copyFile),
  readFile: util.promisify(_fs.readFile),
  writeFile: util.promisify(_fs.writeFile)
};

async function listFiles() {
  const src = '..';
  const site = 'build';
  try {
    await fs.mkdir(site, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const filesAll = await fs.readdir(src);
  const files = filesAll.filter(file => file.endsWith('.json') && !file.startsWith('_'));
  const all = {};
  const index = [];
  for (let file of files) {
    await fs.copyFile(`${src}/${file}`, `${site}/${file}`);
    const data = await fs.readFile(`${src}/${file}`, { encoding: 'utf8' });
    const json = JSON.parse(data);
    const id = file.substring(0, file.length - 5);
    all[id] = json;
    index.push(id);
  }
  await fs.writeFile(`${site}/_all.json`, JSON.stringify(all), { encoding: 'utf8' });
  await fs.writeFile(`${site}/_index.json`, JSON.stringify(index), { encoding: 'utf8' });
}

listFiles();
