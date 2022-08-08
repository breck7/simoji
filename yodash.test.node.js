#!/usr/bin/env node

const { yodash } = require("./yodash.js")

const testTree = {}

testTree.getRandomAngle = areEqual => {
	areEqual(yodash.getRandomAngle(Math.random).match(/(East|West|North|South)/).length, 2)
}

module.exports = { testTree }
const runTree = testTree => {
	const tap = require("tap")
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})
}
if (module && !module.parent) runTree(testTree)
