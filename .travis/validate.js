const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);

async function changedFiles() {
  const { stdout, stderr } = await exec(`git diff --name-only ${process.env.TRAVIS_BRANCH}...HEAD`);
  return stdout
    .trim()
    .split(/\r?\n/)
    .filter(file => file.match(/.json$/));
}

async function readBaseFile(file, opts) {
  const { stdout, stderr } = await exec(`git show ${process.env.TRAVIS_BRANCH}:${file}`, { encoding: 'utf8' });
  return stdout;
}

function arrayToMapByVersion(plugins) {
  const res = {};
  plugins.forEach(plugin => {
    res[plugin.vers] = plugin;
  });
  return res;
}

function isSame(p1, p2) {
  if (!p1 || !p2) {
    return false;
  }
  return !['name', 'url', 'cksum'].map(key => p1[key] === p2[key]).includes(false);
}

function validate(plugins, origs) {
  if (!!plugins.alias) {
    // FIXME
    return;
  }
  const origByVers = arrayToMapByVersion(origs);
  plugins.forEach(plugin => {
    if (isSame(plugin, origByVers[plugin.vers])) {
      console.log(`INFO: No changes in ${plugin.name}@${plugin.vers}`);
      return;
    }

    console.log(`INFO: Validating plugin ${plugin.name}@${plugin.vers}`);
    if (!plugin.name) {
      throw new Error('plugin name missing');
    }
    if (!plugin.vers) {
      throw new Error('plugin vers missing');
    }
    if (!plugin.url) {
      throw new Error('plugin url missing');
    }
    if (!plugin.cksum) {
      console.log('WARN: cksum missing');
    }
  });
}

changedFiles()
  .then(files => {
    files.map(file => {
      Promise.all([readFileAsync(file, { encoding: 'utf8' }), readBaseFile(file)])
        .then(([data, orig]) => {
          console.log(`INFO: Reading ${file}`);
          const plugin = JSON.parse(data);
          const origPlugin = JSON.parse(orig);
          try {
            validate(plugin, origPlugin);
          } catch (e) {
            console.error(`ERROR: Plugin ${file} validation failed: ${e.message}: ${JSON.stringify(plugin)}`);
            process.exit(1);
          }
        })
        .catch(e => {
          console.error(`ERROR: Failed to read ${file}`);
          process.exit(1);
        });
    });
  })
  .catch(e => {
    console.error(`ERROR: Failed to list changed files`);
    process.exit(1);
  });
