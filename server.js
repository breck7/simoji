#!/usr/bin/env node

const express = require("express")
const { readFile } = require("fs")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const stamp = require("jtree/products/stamp.nodejs.js")
const { jtree } = require("jtree")

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
			const tree = new jtree.TreeNode(
				stamp.dirToStampWithContents(__dirname + "/examples/")
			)
			tree.forEach((node) => {
				// todo: refactor stamp
				node.setLine(node.getWord(1).replace(".simoji", ""))
				const contents = node.getNode("data")
				node.setChildren(contents.childrenToString())
				if (contents.length < 2) node.destroy()
			})
			res.send(tree.toString())
		})

		app.use(express.static(__dirname + "/"))

		app.listen(port, () => {
			console.log(
				`Running Simoji Server. cmd+dblclick: http://localhost:${port}/`
			)
		})
	}
}

const server = new Server()
server.start()
