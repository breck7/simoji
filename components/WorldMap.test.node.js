#!/usr/bin/env node

const { WorldMap } = require("./WorldMap.js")

const testTree = {}

testTree.makeRectangle = areEqual => {
	const expected = `😀 0⬇️ 0➡️
😀 0⬇️ 1➡️
😀 1⬇️ 0➡️
😀 1⬇️ 1➡️`

	const map = new WorldMap([])
	areEqual(map.makeRectangle("😀", 2, 2), expected)
	areEqual(
		map.makeRectangle("🚪", 2, 1, 1, 1),
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
