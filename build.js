#!/usr/bin/env node

const { readFile } = require("fs")
const { Disk } = require("jtree/products/Disk.node.js")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const { getExamples } = require("./examples")

const libPaths = `node_modules/jtree/treeComponentFramework/sweepercraft/lib/mousetrap.min.js
node_modules/mathjs/lib/browser/math.js
node_modules/jtree/sandbox/lib/codemirror.js
node_modules/jtree/sandbox/lib/show-hint.js
node_modules/jtree/products/jtree.browser.js
node_modules/jtree/products/stump.browser.js
node_modules/jtree/products/hakon.browser.js
node_modules/jtree/products/TreeComponentFramework.browser.js`.split("\n")

const libCode = libPaths.map(path => Disk.read(__dirname + "/" + path)).join("\n\n")

Disk.write(__dirname + "/dist/libs.js", libCode)

const ourPaths = Disk.getFiles(__dirname + "/components").filter(path => !path.includes(".test"))
ourPaths.unshift(__dirname + "/yodash.js")
ourPaths.push(__dirname + "/BrowserGlue.js")

const simCode = ourPaths
	.map(path => {
		const code = Disk.read(path)

		return new TypeScriptRewriter(code)
			.removeRequires()
			.removeNodeJsOnlyLines()
			.changeNodeExportsToWindowExports()
			.getString()
	})
	.join("\n\n")

Disk.write(__dirname + "/dist/simoji.js", simCode)

const SimConstants = {
	grammar: Disk.read(__dirname + "/simoji.grammar"),
	examples: getExamples(new Set("startup-ideas fire moths covid19 pong soccer zombies".split(" ")))
}

Disk.write(__dirname + "/dist/constants.js", `const SimConstants = ` + JSON.stringify(SimConstants))
