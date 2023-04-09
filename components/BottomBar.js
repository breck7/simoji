const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { PlayButtonComponent } = require("./PlayButton.js")
const { ReportButtonComponent } = require("./ReportButton.js")
const { ResetButtonComponent } = require("./ResetButton.js")
const { TreeNode } = require("jtree/products/TreeNode.js")

class BottomBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      PlayButtonComponent,
      ReportButtonComponent,
      ResetButtonComponent
    })
  }
}

module.exports = { BottomBarComponent }
