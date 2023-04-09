const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { AgentPaletteComponent } = require("./AgentPalette.js")

class RightBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      AgentPaletteComponent
    })
  }
}

module.exports = { RightBarComponent }
