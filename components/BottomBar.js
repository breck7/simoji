const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { PlayButtonComponent } = require("./PlayButton.js")
const { ReportButtonComponent } = require("./ReportButton.js")
const { ResetButtonComponent } = require("./ResetButton.js")
const { jtree } = require("jtree")

class BottomBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      PlayButtonComponent,
      ReportButtonComponent,
      ResetButtonComponent
    })
  }
}

module.exports = { BottomBarComponent }
