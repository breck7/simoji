const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ShareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class ShareComponent
 input
  readonly
  title ${this.link}
  value ${this.link}`
  }

  getDependencies() {
    return [this.getRootNode().simojiProgram]
  }

  get link() {
    const url = new URL(this.willowBrowser.location.href ?? "http://localhost/") // todo: TCF should provide shim for this
    url.hash = ""
    return url.toString() + this.getRootNode().urlHash
  }
}

module.exports = { ShareComponent }
