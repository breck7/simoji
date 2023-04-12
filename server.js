#!/usr/bin/env node

const path = require("path")
const express = require("express")
const { Disk } = require("jtree/products/Disk.node.js")
const { readFile } = require("fs")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const { getExamples } = require("./examples")
const grammarParser = require("jtree/products/grammar.nodejs.js")

class Server {
  start(port = 80) {
    const app = express()

    app.get("/*.js", (req, res) => {
      const filename = req.path.substr(1)
      readFile(__dirname + "/" + filename, "utf8", (err, code) => {
        if (err) throw err
        res.send(
          new TypeScriptRewriter(code)
            .removeRequires()
            .removeNodeJsOnlyLines()
            .changeNodeExportsToWindowExports()
            .getString()
        )
      })
    })

    app.get("/examples", (req, res) => {
      res.send(getExamples())
    })

    app.get("/examples", (req, res) => {
      res.send(getExamples())
    })

    app.get("/dist/simoji.grammar", (req, res) => {
      res.send(this.grammar)
    })

    app.use(express.static(__dirname + "/"))

    app.listen(port, () => {
      console.log(`Running Simoji Dev Server. cmd+dblclick: http://localhost:${port}/dev.html`)
    })
  }

  get grammar() {
    const asOneFile = Disk.getFiles(path.join(__dirname, "grammar"))
      .filter(file => file.endsWith(".grammar"))
      .map(filePath => Disk.read(filePath))
      .join("\n\n")
      .trim()
    return new grammarParser(asOneFile)._sortNodesByInScopeOrder()._sortWithParentParsersUpTop().asString
  }
}

if (!module.parent) new Server().start()
module.exports = { Server }
