#!/usr/bin/env node

const { WorldMap } = require("./WorldMap.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

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

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
