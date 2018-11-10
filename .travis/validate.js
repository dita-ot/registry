const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
const readFileAsync = util.promisify(fs.readFile);

const IGNORE = ['.travis/package-lock.json', '.travis/package.json'];

async function changedFiles() {
  const { stdout, stderr } = await exec(`git diff --name-only ${process.env.TRAVIS_BRANCH}...HEAD`);
  return stdout
    .trim()
    .split(/\r?\n/)
    .filter(file => file.match(/.json$/) && !IGNORE.includes(file));
}

async function readBaseFile(file, opts) {
  try {
    const { stdout, stderr } = await exec(`git show ${process.env.TRAVIS_BRANCH}:${file}`, { encoding: 'utf8' });
    return stdout;
  } catch (e) {
    return null;
  }
}

function arrayToMapByVersion(plugins) {
  const res = {};
  if (!!plugins) {
    plugins.forEach(plugin => {
      res[plugin.vers] = plugin;
    });
  }
  return res;
}

function isSame(p1, p2) {
  if (!p1 || !p2) {
    return false;
  }
  return !['name', 'url', 'cksum'].map(key => p1[key] === p2[key]).includes(false);
}

function sha256(url) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    console.log(`INFO: Download ${url}`);
    request
      .get(url)
      .on('error', err => {
        reject(new Error(`Failed to download ${url}: ${err}`));
      })
      .on('data', chunk => {
        try {
          hash.update(chunk);
        } catch (e) {
          reject(new Error(`Failed to calculate checksum: ${e}`));
        }
      })
      .on('end', () => {
        try {
          resolve(hash.digest('hex'));
        } catch (e) {
          reject(new Error(`Failed to calculate checksum: ${e}`));
        }
      });
  });
}

function validateVersion(plugin, prev) {
  if (isSame(plugin, prev)) {
    console.log(`INFO: No changes in ${plugin.name}@${plugin.vers}`);
    return;
  }

  console.log(`INFO: Validating plugin ${plugin.name}@${plugin.vers}`);
  if (!plugin.name) {
    return Promise.reject(new Error('plugin name missing'));
  }
  if (!plugin.vers) {
    return Promise.reject(new Error('plugin vers missing'));
  }
  if (!plugin.url) {
    return Promise.reject(new Error('plugin url missing'));
  }
  if (!plugin.cksum) {
    console.log('WARN: cksum missing');
    return Promise.resolve();
  } else {
    return sha256(plugin.url).then(act => {
      if (plugin.cksum !== act) {
        throw new Error(`File checksum ${act} doesn't match expected ${plugin.cksum}`);
      }
    });
  }
}

async function validate(plugins, origs) {
  if (!!plugins.alias) {
    // FIXME
    return Promise.resolve();
  }
  const origByVers = arrayToMapByVersion(origs);
  const validations = plugins
    .map(plugin => validateVersion(plugin, origByVers[plugin.vers]))
    .filter(promise => !!promise);
  return Promise.all(validations);
}

changedFiles()
  .then(files => {
    files.map(file => {
      Promise.all([readFileAsync(file, { encoding: 'utf8' }), readBaseFile(file)])
        .then(([data, orig]) => {
          console.log(`INFO: Reading ${file}`);
          const plugin = JSON.parse(data);
          const origPlugin = JSON.parse(orig);
          return validate(plugin, origPlugin);
        })
        .catch(e => {
          console.error(`ERROR: Plugin ${file} validation failed: ${e.message}`);
          process.exit(1);
        });
    });
  })
  .catch(e => {
    console.error(`ERROR: Failed to list changed files`);
    process.exit(1);
  });
