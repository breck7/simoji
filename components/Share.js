const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ShareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 style display: inline;
 input
  readonly
  value ${this.link}`
  }

  getDependencies() {
    return [this.getRootNode().simojiProgram]
  }

  get link() {
    const url = new URL(location.href)
    url.hash = ""
    return url.toString() + this.getRootNode().urlHash
  }
}

module.exports = { ShareComponent }
