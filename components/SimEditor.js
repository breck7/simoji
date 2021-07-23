const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class SimEditorComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `textarea
 class SimEditorComponent
 changeCommand reloadSimCommand`
  }

  reloadSimCommand() {
    app.loadNewSim(this.el.val())
  }

  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      value: jtree.TreeNode
    })
  }

  get el() {
    return jQuery(".SimEditorComponent")
  }

  async treeComponentDidMount() {
    this.el.val(this.getNode("value").childrenToString())
    super.treeComponentDidMount()
  }

  async treeComponentDidUpdate() {
    this.el.val(this.getNode("value").childrenToString())
    super.treeComponentDidUpdate()
  }
}

module.exports = { SimEditorComponent }
