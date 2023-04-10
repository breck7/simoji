#! /usr/bin/env node

const { TestRacer } = require("jtree/products/TestRacer.js")

const testAll = async () => {
  const fileTree = {}
  let folders = `./yodash.test.node.js
./components/SimojiApp.test.node.js
./components/WorldMap.test.node.js
./components/CollisionDetector.test.node.js`
    .split("\n")
    .forEach(file => (fileTree[file] = require(file).testTree))
  const runner = new TestRacer(fileTree)
  await runner.execute()
  runner.finish()
}
testAll()
