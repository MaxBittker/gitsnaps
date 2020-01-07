let fs = require("fs");
let fse = require("fs-extra");
let path = require("path");
let _ = require("lodash");
let promisify = require("promisify-node");
let pfs = promisify(require("fs"));
let p = "/home/max/Pictures";

let { screenshotLocation } = require("./commit.js");

function getNewest() {
  return new Promise(function(resolve, reject) {
    fs.readdir(p, (err, files) => {
      let i,
        totalSizeBytes = 0;
      if (err) throw err;

      file_opens = files.map(file =>
        pfs
          .stat(path.join(p, file))
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
      fse.copySync(path.join(p, file), screenshotLocation);
      resolve();
    });
  });
}

module.exports = moveFile;
