#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function changedFiles() {
    const { stdout, stderr } = await exec(`git diff --name-only HEAD...${process.env.TRAVIS_BRANCH}`);
    console.log(stdout.split(/\r?\n/));
}
changedFiles();
