const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ResetButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span ≪
 title Clear and reset
 class ResetButtonComponent
 clickCommand resetCommand`
  }

  resetCommand() {
    this.getRootNode().pauseCommand()
    this.getRootNode().resetCommand()
  }
}

module.exports = { ResetButtonComponent }
