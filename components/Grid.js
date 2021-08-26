const { yodash } = require("../yodash.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class GridComponent extends AbstractTreeComponent {
  gridClickCommand(down, right) {
    const positionHash = down + " " + right
    const board = this.getParent()
    const root = board.getRootNode()
    board.resetAgentPositionMap()
    const { agentPositionMap } = board
    const existingObjects = agentPositionMap.get(positionHash) ?? []
    if (existingObjects.length) return root.toggleSelectCommand(existingObjects)
    const { agentToInsert } = root

    if (!agentToInsert) return this

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    board.prependLine(`${agentToInsert} ${positionHash}`)
    board.renderAndGetRenderReport()
    board.resetAgentPositionMap()
  }

  makeBlock(down, right, gridSize) {
    return `\n div
  class block
  style width:${gridSize}px;height:${gridSize}px;top:${down * gridSize}px;left:${right * gridSize}px;
  clickCommand gridClickCommand ${yodash.makePositionHash({ right, down })}`
  }

  toStumpCode() {
    const { cols, rows, gridSize } = this.getParent()
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
 class GridComponent` + blocks
    )
  }
}

module.exports = { GridComponent }
