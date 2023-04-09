const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { jtree } = require("jtree")
const { AgentPaletteComponent } = require("./AgentPalette.js")

class RightBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      AgentPaletteComponent
    })
  }
}

module.exports = { RightBarComponent }
