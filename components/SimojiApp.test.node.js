#!/usr/bin/env node

const { TreeNode } = require("jtree/products/TreeNode.js")
const { GrammarCompiler } = require("jtree/products/GrammarCompiler.js")
const { Disk } = require("jtree/products/Disk.node.js")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const { SimojiApp } = require("./SimojiApp.js")

const grammarPath = __dirname + "/../simoji.grammar"
const examplesPath = __dirname + "/../examples/"
const simojiParser = GrammarCompiler.compileGrammarFileAtPathAndReturnRootParser(grammarPath)
const testTree = {}

testTree.simojiGrammar = areEqual => {
  const errs = new grammarNode(Disk.read(grammarPath)).getAllErrors().map(err => err.toObject())
  if (errs.length) console.log(new TreeNode(errs).toFormattedTable(60))
  areEqual(errs.length, 0, "no grammar errors")
}

testTree.simGrammarErrors = areEqual => {
  const errs = Disk.getFiles(examplesPath)
    .map(path => {
      const code = Disk.read(path)
      const program = new simojiParser(code)
      const errors = program.getAllErrors()
      areEqual(errors.length, 0)
      return errors.map(err => {
        return { filename: path, ...err.toObject() }
      })
    })
    .flat()
  if (errs.length) console.log(new TreeNode(errs).toFormattedTable(60))
}

testTree.SimojiApp = areEqual => {
  const app = SimojiApp.setupApp("")
  areEqual(!!app, true)
}

testTree.loadNewSim = async areEqual => {
  // Arrange
  const app = SimojiApp.setupApp("")
  app.verbose = false
  await app.start()

  // Act
  app.pasteCodeCommand(`😃
insert 200 😃`)
  const boardState1 = app.board.toString()

  areEqual(app.board.populationCount["😃"], 200)

  // Act
  app.resetAllCommand()

  const boardState2 = app.board.toString()

  // Race condition is possible but pigs more likely to fly first.
  areEqual(boardState1 === boardState2, false, "Boards should have changed")
  areEqual(app.simojiPrograms[0].getAllErrors().length, 0, "program is valid")

  // Act
  app.pasteCodeCommand(`😃
insert
insert 10 😃
`)
  areEqual(app.simojiPrograms[0].getAllErrors().length, 2, "invalid programs dont crash")
}

module.exports = { testTree }
const runTree = testTree => {
  const tap = require("tap")
  Object.keys(testTree).forEach(key => {
    testTree[key](tap.equal)
  })
}
if (module && !module.parent) runTree(testTree)
