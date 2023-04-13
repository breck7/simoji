#!/usr/bin/env node

const path = require("path")
const express = require("express")
const { Disk } = require("jtree/products/Disk.node.js")
const { readFile } = require("fs")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const grammarParser = require("jtree/products/grammar.nodejs.js")

class Server {
  get files() {
    const files = {}
    Disk.getFiles(path.join(__dirname, "examples")).forEach(filepath => {
      files[filepath] = Disk.read(filepath)
    })
    return files
  }

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

    app.get("/files", (req, res) => res.send(JSON.stringify(this.files, null, 2)))

    app.get("/dist/simoji.grammar", (req, res) => res.send(this.grammar))

    app.use(express.static(__dirname + "/"))

    app.listen(port, () => console.log(`Running Simoji Dev Server. cmd+dblclick: http://localhost:${port}/dev.html`))
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
