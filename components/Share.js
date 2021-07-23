const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ShareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 style display: inline;
 span 🔗
 input
  readonly
  value ${this.link}`
  }

  get link() {
    const url = new URL(location.href)
    url.hash = ""
    return url.toString() + this.hash
  }

  get hash() {
    const tree = new jtree.TreeNode()
    tree.appendLineAndChildren("simoji", this.getRootNode().simojiProgram?.childrenToString() ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }
}

module.exports = { ShareComponent }
