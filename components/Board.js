const { jtree } = require("jtree")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class BoardComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, this.getRootNode().agentMap)
  }

  get gridSize() {
    return parseInt(this.getWord(1))
  }

  get rows() {
    return parseInt(this.getWord(2))
  }

  get cols() {
    return parseInt(this.getWord(3))
  }
}

class BoardStyleComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

module.exports = { BoardStyleComponent, BoardComponent }
