#!/usr/bin/env node

const { yodash } = require("./yodash.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

const testTree = {}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
