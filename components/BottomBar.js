const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { PlayButtonComponent } = require("./PlayButton.js")
const { jtree } = require("jtree")

class BottomBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      PlayButtonComponent,
      AnalyzeDataButtonComponent
    })
  }
}

class AnalyzeDataButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Δ
 title Open Report
 class ReportButton
 clickCommand openInOhayoCommand`
  }
}

module.exports = { BottomBarComponent }
