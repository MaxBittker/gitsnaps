#!/usr/local/bin/node

let { writecommit } = require("./commit");
let moveFile = require("./prepare");

moveFile().then(() => writecommit());
