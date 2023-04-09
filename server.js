#!/usr/bin/env node

const express = require("express")
const { readFile } = require("fs")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const stamp = require("jtree/products/stamp.nodejs.js")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { getExamples } = require("./examples")

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

    app.use(express.static(__dirname + "/"))

    app.listen(port, () => {
      console.log(`Running Simoji Dev Server. cmd+dblclick: http://localhost:${port}/dev.html`)
    })
  }
}

const server = new Server()
server.start()
