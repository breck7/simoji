const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class GridComponent extends AbstractTreeComponentParser {
  gridClickCommand(x, y) {
    return this.parent.insertAgentAtCommand(x, y)
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return super.treeComponentDidMount()

    jQuery(`.${GridComponent.name}`).on("click", function (evt) {
      const { offsetX, offsetY } = evt
      const x = offsetX
      const y = offsetY
      that.gridClickCommand(x, y)
    })
  }

  toStumpCode() {
    return `div
 class ${GridComponent.name}`
  }
}

module.exports = { GridComponent }
