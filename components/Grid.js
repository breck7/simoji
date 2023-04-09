const { yodash } = require("../yodash.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class GridComponent extends AbstractTreeComponentParser {
  gridClickCommand(down, right) {
    return this.parent.insertAgentAtCommand(right, down)
  }

  makeBlock(down, right, gridSize) {
    return `\n div
  class block
  style width:${gridSize}px;height:${gridSize}px;top:${down * gridSize}px;left:${right * gridSize}px;
  clickCommand gridClickCommand ${yodash.makePositionHash({ right, down })}`
  }

  toStumpCode() {
    const { cols, rows, gridSize } = this.parent
    let blocks = ""
    let rs = rows
    while (rs >= 0) {
      let cs = cols
      while (cs >= 0) {
        blocks = this.makeBlock(rs, cs, gridSize) + blocks
        cs--
      }
      rs--
    }
    return (
      `div
 class ${GridComponent.name}` + blocks
    )
  }
}

module.exports = { GridComponent }
