const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { PlayButtonComponent } = require("./PlayButton.js")
const { jtree } = require("jtree")

class BottomBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      PlayButtonComponent
    })
  }
}

module.exports = { BottomBarComponent }
