let nodegit = require("nodegit");
let path = require("path");
let pathToRepo = path.resolve(".");
let promisify = require("promisify-node");
let fse = promisify(require("fs-extra"));
fse.ensureDir = promisify(fse.ensureDir);

let directoryName = process.cwd();
let screenshotName= ".screenshot.png";
let screenshotLocation = path.join(directoryName, screenshotName);

function writecommit() {
  let repo;
  let index;
  let oid;
  nodegit.Repository
    .open(path.resolve(directoryName, ".git"))
    .then(function(repoResult) {
      repo = repoResult;
      return fse.ensureDir(path.join(repo.workdir(), directoryName));
    })
    .then(function() {
      return repo.refreshIndex();
    })
    .then(function(indexResult) {
      index = indexResult;
    })
    .then(function() {
      return index.addByPath(screenshotName);
    })
    .then(function() {
      return index.addAll();
    })
    .then(function() {
      // this will write both files to the index
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    })
    .then(function(oidResult) {
      oid = oidResult;
      return nodegit.Reference.nameToId(repo, "HEAD");
    })
    .then(function(head) {
      return repo.getCommit(head);
    })
    .then(function(parent) {
      let signature = nodegit.Signature.default(repo);
      return repo.createCommit(
        "HEAD",
        signature,
        signature,
        "[screenshot]",
        oid,
        [parent]
      );
    })
    .done(function(commitId) {
      console.log("New Commit: ", commitId);
    });
}

module.exports = { writecommit, screenshotLocation };
