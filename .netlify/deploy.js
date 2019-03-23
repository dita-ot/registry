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
    const input = `${src}/${file}`;
    const output = `${site}/${file}`;
    const data = await fs.readFile(input, { encoding: 'utf8' });
    const json = JSON.parse(data);
    console.log(`Write ${output}`);
    await fs.writeFile(output, JSON.stringify(json), { encoding: 'utf8' });
    const id = file.substring(0, file.length - 5);
    all[id] = json;
    index.push(id);
  }
  const allOutput = `${site}/_all.json`
  console.log(`Write ${allOutput}`);
  await fs.writeFile(`${allOutput}`, JSON.stringify(all), { encoding: 'utf8' });
  const indexOutput = `${site}/_index.json`
  console.log(`Write ${indexOutput}`);
  await fs.writeFile(`${indexOutput}`, JSON.stringify(index), { encoding: 'utf8' });
}

listFiles();
