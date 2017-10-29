let nodegit = require("nodegit"),
  path = require("path"),
  fs = require("fs"),
  os = require("os"),
  exec = require("child_process").exec,
  walker,
  historyCommits = [],
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
  let body = commitList
    .map(entry => {
      let sha = entry.commit.sha();
      return `<div class="snap">
      <img src="file:///private${buildName(sha)}"/>
      <pre>${sha}</pre>
</div>`;
    })
    .join("\n");

  return `<html>
  <head>
  <style>${styles}</style>
  </head><body>
  <div class="content">
  ${body}
  </div>
  </body></html>`;
}

function saveFile(blob, sha) {
  // console.log(buildName(sha));
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

// This code walks the history of the master branch and prints results
// that look very similar to calling `git log` from the command line

function compileHistory(resultingArrayOfCommits) {
  var lastSha;
  if (historyCommits.length > 0) {
    lastSha = historyCommits[historyCommits.length - 1].commit.sha();
    if (
      resultingArrayOfCommits.length == 1 &&
      resultingArrayOfCommits[0].commit.sha() == lastSha
    ) {
      return;
    }
  }

  resultingArrayOfCommits.forEach(function(entry) {
    historyCommits.push(entry);
  });
  lastSha = historyCommits[historyCommits.length - 1].commit.sha();

  walker = repo.createRevWalk();
  walker.push(lastSha);
  walker.sorting(nodegit.Revwalk.SORT.TIME);

  return walker.fileHistoryWalk(screenshotName, 500).then(compileHistory);
}

nodegit.Repository
  .open(path.resolve(directoryName, ".git"))
  .then(function(r) {
    repo = r;
    return repo.getHeadCommit();
  })
  .then(function(firstCommitOnMaster) {
    walker = repo.createRevWalk();
    walker.push(firstCommitOnMaster.sha());
    walker.sorting(nodegit.Revwalk.SORT.Time);

    return walker.fileHistoryWalk(screenshotName, 500);
  })
  .then(compileHistory)
  .then(function() {
    historyCommits.forEach(function(entry) {
      commit = entry.commit;
      findFile(commit.sha());
    });
    let page = buildPage(historyCommits);
    let outputFileName = tempDirName+"/index.html";
    fs.writeFileSync(outputFileName, page);
    exec('open '+ outputFileName);
  })
  .done();
