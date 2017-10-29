let nodegit = require("nodegit"),
  path = require("path"),
  fs = require("fs"),
  os = require("os"),
  exec = require("child_process").exec,
  walker,
  commit,
  repo;

let { screenshotName } = require("./commit.js");
let styles = require("./main.css.js");
let directoryName = process.cwd();

let tempDirName = fs.mkdtempSync(
  path.join(os.tmpdir(), "/") + "gitsnaps-" + path.parse(directoryName).base
);

// console.log(tempDirName);

function buildName(sha) {
  let name = "snap-" + sha + ".png";
  return tempDirName + "/" + name;
}

function buildPage(commitList) {
  console.log("building page", commitList.length);
  let body = commitList
    .map(entry => {
      let sha = entry.commit.sha();
      return `<div class="snap">
      <img src="file:///private${buildName(sha)}"/>
      <pre>${sha}</pre>
</div>`;
    })
    .join("\n");

  return `<html><head>
  <style>${styles}</style>
  </head>
  <body>
  <div class="content">
  ${body}
  </div>
  </body></html>`;
}

function saveFile(blob, sha) {
  fs.writeFileSync(buildName(sha), blob.content());
}

function findFile(sha) {
  let _entry;
  let _commit;
  nodegit.Repository
    .open(path.resolve(directoryName, ".git"))
    .then(function(repo) {
      return repo.getCommit(sha);
    })
    .then(commit => {
      _commit = commit;
      return commit.getEntry(screenshotName);
    })
    .then(entry => {
      _entry = entry;
      return _entry.getBlob();
    })
    .then(blob => {
      // console.log(_entry.name(), _entry.sha(), blob.rawsize() + "b");
      saveFile(blob, _commit.sha());
    });
}

nodegit.Repository
  .open(path.resolve(directoryName, ".git"))
  .then(function(r) {
    repo = r;
    walker = repo.createRevWalk();
    walker.sorting(nodegit.Revwalk.SORT.TIME);
    return repo.getReferences(nodegit.Reference.TYPE.OID);
  })
  .then(refs => {

    refs.filter(ref => ref.isBranch()).forEach(ref => {
      walker.pushRef(ref.name());
    });

    return walker.fileHistoryWalk(screenshotName, 500);
  })
  .then(function(walkedCommits) {
    walkedCommits.forEach(function(entry) {
      commit = entry.commit;
      findFile(commit.sha());
    });

    let page = buildPage(walkedCommits);

    let outputFileName = tempDirName + "/index.html";
    fs.writeFileSync(outputFileName, page);
    exec("open " + outputFileName);
  })
  .done();
