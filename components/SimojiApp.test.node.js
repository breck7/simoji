#!/usr/bin/env node

const { jtree } = require("jtree")
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { SimojiApp } = require("./SimojiApp.js")

const grammarPath = __dirname + "/../simoji.grammar"
const examplesPath = __dirname + "/../examples/"
const simojiCompiler = jtree.compileGrammarFileAtPathAndReturnRootConstructor(grammarPath)
const testTree = {}

testTree.simojiGrammar = areEqual => {
	const errs = new grammarNode(Disk.read(grammarPath)).getAllErrors().map(err => err.toObject())
	if (errs.length) console.log(new jtree.TreeNode(errs).toFormattedTable(60))
	areEqual(errs.length, 0, "no grammar errors")
}

testTree.simGrammarErrors = areEqual => {
	const errs = Disk.getFiles(examplesPath)
		.map(path => {
			const code = Disk.read(path)
			const program = new simojiCompiler(code)
			const errors = program.getAllErrors()
			areEqual(errors.length, 0)
			return errors.map(err => {
				return { filename: path, ...err.toObject() }
			})
		})
		.flat()
	if (errs.length) console.log(new jtree.TreeNode(errs).toFormattedTable(60))
}

testTree.SimojiApp = areEqual => {
	const app = SimojiApp.setupApp("")
	areEqual(!!app, true)
}

module.exports = { testTree }
const runTree = testTree => {
	const tap = require("tap")
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})
}
if (module && !module.parent) runTree(testTree)
