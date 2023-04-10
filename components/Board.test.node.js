#!/usr/bin/env node

const { BoardComponent } = require("./Board.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

const testTree = {}

testTree.makeRectangle = areEqual => {
	const expected = `😀 0 0
😀 1 0
😀 0 1
😀 1 1`

	const board = new BoardComponent()
	areEqual(board.makeRectangle("😀", 2, 2), expected)
	areEqual(
		board.makeRectangle("🚪", 2, 1, 1, 1),
		`🚪 1 1
🚪 2 1`
	)
}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
