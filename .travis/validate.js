const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const readFileAsync = util.promisify(fs.readFile);

async function changedFiles() {
  const { stdout, stderr } = await exec(
    `git diff --name-only ${process.env.TRAVIS_BRANCH}...HEAD`
  );
  return stdout
    .trim()
    .split(/\r?\n/)
    .filter(file => file.match(/.json$/));
}

function validate(plugins) {
  plugins.forEach(plugin => {
    if (!plugin.name) {
      throw new Error("plugin name missing");
    }
    if (!plugin.vers) {
      throw new Error("plugin vers missing");
    }
    if (!plugin.url) {
      throw new Error("plugin url missing");
    }
  });
}

changedFiles().then(files => {
  files.map(file => {
    readFileAsync(file, { encoding: "utf8" }).then(data => {
      const plugin = JSON.parse(data);
      try {
        validate(plugin);
      } catch (e) {
        console.error(`ERROR: Plugin ${file} validation failed: ${e.message}: ${JSON.stringify(plugin)}`);
        process.exit(1);
      }
    });
  });
});
