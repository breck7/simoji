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
    return [this.getRootNode().firstProgram]
  }

  get link() {
    const url = new URL(typeof location === "undefined" ? "http://localhost/" : location.href) // todo: TCF should provide shim for this
    url.hash = ""
    return url.toString() + this.getRootNode().urlHash
  }
}

module.exports = { ShareComponent }
