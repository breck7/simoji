#!/usr/bin/env node

const { BoardComponent } = require("./Board.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

const testTree = {}

testTree.makeRectangle = areEqual => {
	const expected = `😀 0 0
😀 1 0
😀 0 1
😀 1 1`

	const options = {
		agentSymbol: "😀",
		width: 2,
		height: 2,
		x: 0,
		y: 0,
		fillSymbol: false,
		spacing: 0,
		agentHeight: 1,
		agentWidth: 1
	}

	const board = new BoardComponent()
	areEqual(board.makeRectangle(options), expected)

	options.agentSymbol = "🚪"
	options.height = 1
	options.x = 1
	options.y = 1
	areEqual(
		board.makeRectangle(options),
		`🚪 1 1
🚪 2 1`
	)
}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
