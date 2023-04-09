const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class ResetButtonComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `span ≪
 title Clear and reset
 class ${ResetButtonComponent.name} BottomButton
 clickCommand resetAllCommand`
  }

  resetAllCommand() {
    this.root.pauseAllCommand()
    this.root.resetAllCommand()
  }
}

module.exports = { ResetButtonComponent }
