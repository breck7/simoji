#!/usr/bin/env node

const { yodash } = require("./yodash.js")

const testTree = {}

testTree.getRandomAngle = areEqual => {
	areEqual(yodash.getRandomAngle().match(/(East|West|North|South)/).length, 2)
}

testTree.makeRectangle = areEqual => {
	const expected = `😀 0⬇️ 0➡️
😀 0⬇️ 1➡️
😀 1⬇️ 0➡️
😀 1⬇️ 1➡️`

	areEqual(yodash.makeRectangle("😀", 2, 2), expected)
	areEqual(
		yodash.makeRectangle("🚪", 2, 1, 1, 1),
		`🚪 1⬇️ 1➡️
🚪 1⬇️ 2➡️`
	)
}

module.exports = { testTree }
const runTree = testTree => {
	const tap = require("tap")
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})
}
if (module && !module.parent) runTree(testTree)
