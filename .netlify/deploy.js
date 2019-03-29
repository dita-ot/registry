const util = require('util');
const _fs = require('fs');
const fs = {
  mkdir: util.promisify(_fs.mkdir),
  readdir: util.promisify(_fs.readdir),
  copyFile: util.promisify(_fs.copyFile),
  readFile: util.promisify(_fs.readFile),
  writeFile: util.promisify(_fs.writeFile)
};

const SRC = '..';
const BUILD = 'build';
const PREFIX = '.json'

async function main() {
  try {
    await fs.mkdir(BUILD, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const filesAll = await fs.readdir(SRC);
  const files = filesAll.filter(file => file.endsWith(PREFIX) && !file.startsWith('_'));
  const all = {};
  const index = [];
  for (let file of files) {
    const input = `${SRC}/${file}`;
    const output = `${BUILD}/${file}`;
    const data = await fs.readFile(input, { encoding: 'utf8' });
    const json = JSON.parse(data);
    console.log(`Write ${output}`);
    await fs.writeFile(output, JSON.stringify(json), { encoding: 'utf8' });
    const id = file.substring(0, file.length - PREFIX.length);
    all[id] = json;
    index.push(id);
  }
  const allOutput = `${BUILD}/_all.json`
  console.log(`Write ${allOutput}`);
  await fs.writeFile(`${allOutput}`, JSON.stringify(all), { encoding: 'utf8' });
  const indexOutput = `${BUILD}/_index.json`
  console.log(`Write ${indexOutput}`);
  await fs.writeFile(`${indexOutput}`, JSON.stringify(index), { encoding: 'utf8' });
}

main();
