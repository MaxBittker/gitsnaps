let nodegit = require("nodegit"),
  path = require("path"),
  walker,
  historyCommits = [],
  commit,
  repo;

let { screenshotName } = require("./commit.js");
let directoryName = process.cwd();

function findFile(commit) {
  commit
    .getTree()
    .then(function(tree) {
      // `walk()` returns an event.
      var walker = tree.walk();
      walker.on("entry", function(entry) {
        console.log(entry.path());
      });

      // Don't forget to call `start()`!
      walker.start();
    })
    .done();
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
    return repo.getMasterCommit();
  })
  .then(function(firstCommitOnMaster) {
    console.log(firstCommitOnMaster);
    firstCommitOnMaster.nthGenAncestor(2).then(function(commit) {
      console.log(commit);

      findFile(commit);
    });
    // History returns an event.
    walker = repo.createRevWalk();
    walker.push(firstCommitOnMaster.sha());
    walker.sorting(nodegit.Revwalk.SORT.Time);
    return walker.fileHistoryWalk(screenshotName, 500);
  })
  .then(compileHistory)
  .then(function() {
    historyCommits.forEach(function(entry) {
      //   console.log(entry);
      commit = entry.commit;

      console.log("commit " + commit.sha());
      //   console.log(
      // "Author:",
      // commit.author().name() + " <" + commit.author().email() + ">"
      //   );
      console.log("Date:", commit.date());
      console.log(commit.message());
    });
  })
  .done();
