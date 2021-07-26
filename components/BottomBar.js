const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { jtree } = require("jtree")

class BottomBarComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class BottomBarComponent
 span
  clickCommand dumpErrorsCommand
  id codeErrorsConsole`
  }
}

module.exports = { BottomBarComponent }
