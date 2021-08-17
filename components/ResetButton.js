const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ResetButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span ≪
 title Clear and reset
 class ResetButtonComponent BottomButton
 clickCommand resetAllCommand`
  }

  resetAllCommand() {
    this.getRootNode().pauseAllCommand()
    this.getRootNode().resetAllCommand()
  }
}

module.exports = { ResetButtonComponent }
