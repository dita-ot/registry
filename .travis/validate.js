const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
const readFileAsync = util.promisify(fs.readFile);
const semver = require('semver');

const IGNORE = [
  '.travis/package-lock.json',
  '.travis/package.json',
  '.netlify/package-lock.json',
  '.netlify/package.json'
];

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
  if (['name', 'vers', 'url', 'cksum'].map(key => p1[key] === p2[key]).includes(false)) {
    return false;
  }
  const depsCompare = (a, b) => a.name.localeCompare(b.name);
  p1.deps.sort(depsCompare);
  p2.deps.sort(depsCompare);
  return JSON.stringify(p1.deps) === JSON.stringify(p2.deps);
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

function validateVersion(file, plugin, prev) {
  if (isSame(plugin, prev)) {
    console.log(`INFO: No changes in ${plugin.name}@${plugin.vers}`);
    return;
  }

  console.log(`INFO: Validating plugin ${plugin.name}@${plugin.vers}`);
  if (!plugin.name) {
    return Promise.reject(new Error('plugin name missing'));
  } else {
    if (file !== `${plugin.name}.json`) {
      return Promise.reject(new Error(`plugin name ${plugin.name} doesn't match filename ${file}`));
    }
  }
  if (!plugin.vers) {
    return Promise.reject(new Error('plugin vers missing'));
  } else {
    if (!semver.valid(plugin.vers)) {
      return Promise.reject(new Error(`plugin version ${plugin.vers} is not a valid SemVer version`));
    }
  }
  if (!!plugin.deps) {
    try {
      plugin.deps.forEach(dep => {
        if (!dep.name) {
          throw new Error('plugin dependency name missing');
        }
        if (!dep.req) {
          throw new Error('plugin dependency version missing');
        } else {
          if (!semver.validRange(dep.req)) {
            throw new Error(`plugin dependency version ${dep.req} is not a valid SemVer version`);
          }
        }
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  if (!plugin.url) {
    return Promise.reject(new Error('plugin url missing'));
  }
  if (!plugin.cksum) {
    console.log('WARN: cksum missing');
    return Promise.resolve();
  } else {
    return sha256(plugin.url).then(act => {
      if (plugin.cksum.toLowerCase() !== act.toLowerCase()) {
        throw new Error(`File checksum ${act} doesn't match expected ${plugin.cksum}`);
      }
    });
  }
}

async function validate(file, plugins, origs) {
  if (!!plugins.alias) {
    // FIXME
    return Promise.resolve();
  }
  const origByVers = arrayToMapByVersion(origs);
  const validations = plugins
    .map(plugin => validateVersion(file, plugin, origByVers[plugin.vers]))
    .filter(promise => !!promise);
  return Promise.all(validations);
}

changedFiles()
  .then(files => {
    if (files.length === 0) {
      console.log('INFO: No changes to validate');
    }
    files.map(file => {
      Promise.all([readFileAsync(file, { encoding: 'utf8' }), readBaseFile(file)])
        .then(([data, orig]) => {
          console.log(`INFO: Reading ${file}`);
          const plugin = JSON.parse(data);
          const origPlugin = JSON.parse(orig);
          return validate(file, plugin, origPlugin);
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
