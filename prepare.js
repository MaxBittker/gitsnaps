let fs = require("fs");
let fse = require("fs-extra");
let path = require("path");
let _ = require("lodash");
let promisify = require("promisify-node");
let pfs = promisify(require("fs"));
let { screenshotsFolder } = require("./config.js");

let { screenshotLocation } = require("./commit.js");

function getNewest() {
  return new Promise(function(resolve, reject) {
    fs.readdir(screenshotsFolder, (err, files) => {
      if (err) throw err;

      file_opens = files.map(file =>
        pfs
          .stat(path.join(screenshotsFolder, file))
          .then(function(stats) {
            return { file, stats };
          })
          .catch(function(e) {
            console.log("Error reading file", e);
          })
      );

      Promise.all(file_opens).then(values => {
        realfiles = values.filter(({ stats }) => stats.isFile());
        let max = _.maxBy(realfiles, ({ stats }) => stats.birthtimeMs);
        resolve(max.file);
      });
    });
  });
}

function moveFile() {
  return new Promise(function(resolve, reject) {
    getNewest().then(file => {
      fse.copySync(path.join(screenshotsFolder, file), screenshotLocation);
      resolve();
    });
  });
}

module.exports = moveFile;
