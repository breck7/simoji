#!/usr/bin/env node

const { yodash } = require("./yodash.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

const testTree = {}

testTree.getRandomAngle = areEqual => {
  areEqual(yodash.getRandomAngle(Math.random).match(/(East|West|North|South)/).length, 2)
}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
