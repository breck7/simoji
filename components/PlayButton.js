const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class PlayButtonComponent extends AbstractTreeComponent {
  get isStarted() {
    return this.getRootNode().isRunning
  }

  toStumpCode() {
    return `span ${this.isStarted ? "&#10074;&#10074;" : "▶︎"}
 class PlayButtonComponent
 clickCommand togglePlayCommand`
  }
}

module.exports = { PlayButtonComponent }
