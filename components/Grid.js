const { yodash } = require("../yodash.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class GridComponent extends AbstractTreeComponent {
  gridClickCommand(right, down) {
    return this.getParent().insertOrSelectAgentAtCommand(right + "➡️", down + "⬇️")
  }

  evtToRightDown(evt) {
    if (this.isNodeJs()) return { right: 1, down: 1 }

    const { offsetX, offsetY } = evt
    const el = jQuery(evt.target)
    const height = el.height()
    const width = el.width()
    const { cols, rows, gridSize } = this.getParent()

    const right = Math.round((offsetX / width) * cols)
    const down = Math.round((offsetY / height) * rows)

    return { right, down }
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return super.treeComponentDidMount()

    jQuery(`.${GridComponent.name}`).on("click", function(evt) {
      const { right, down } = that.evtToRightDown(evt)
      that.gridClickCommand(right, down)
    })
  }

  toStumpCode() {
    return `div
 class ${GridComponent.name}`
  }
}

module.exports = { GridComponent }
