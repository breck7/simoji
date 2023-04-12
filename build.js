#!/usr/bin/env node

const path = require("path")
const { readFile } = require("fs")
const { Disk } = require("jtree/products/Disk.node.js")
const { TypeScriptRewriter } = require("jtree/products/TypeScriptRewriter.js")
const { getExamples } = require("./examples")
const { Server } = require("./server.js")

const distFolder = path.join(__dirname, "dist")

const libPaths = `node_modules/jtree/treeComponentFramework/sweepercraft/lib/mousetrap.min.js
node_modules/mathjs/lib/browser/math.js
node_modules/lodash/lodash.min.js
node_modules/jquery/dist/jquery.min.js
lib/jquery-ui.min.js
lib/jquery.ui.touch-punch.min.js
node_modules/jtree/sandbox/lib/codemirror.js
node_modules/jtree/sandbox/lib/show-hint.js
node_modules/jtree/products/Utils.browser.js
node_modules/jtree/products/TreeNode.browser.js
node_modules/jtree/products/GrammarLanguage.browser.js
node_modules/jtree/products/GrammarCodeMirrorMode.browser.js
node_modules/jtree/products/stump.browser.js
node_modules/jtree/products/hakon.browser.js
node_modules/jtree/products/TreeComponentFramework.browser.js`.split("\n")

const libCode = libPaths.map(libPath => Disk.read(path.join(__dirname, libPath))).join("\n\n")

Disk.write(path.join(distFolder, "simoji.grammar"), new Server().grammar)
Disk.write(path.join(distFolder, "libs.js"), libCode)

const ourPaths = Disk.getFiles(path.join(__dirname, "components")).filter(path => !path.includes(".test"))
ourPaths.unshift(path.join(__dirname, "yodash.js"))
ourPaths.push(path.join(__dirname, "BrowserGlue.js"))

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

Disk.write(path.join(distFolder, "simoji.js"), simCode)

const SimConstants = {
  grammar: Disk.read(path.join(distFolder, "simoji.grammar")),
  examples: getExamples()
}

Disk.write(path.join(distFolder, "constants.js"), `const SimConstants = ` + JSON.stringify(SimConstants))
