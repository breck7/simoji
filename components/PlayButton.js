const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class PlayButtonComponent extends AbstractTreeComponent {
  get isStarted() {
    return this.getRootNode().isRunning
  }

  toStumpCode() {
    return `span ${this.isStarted ? "⏸" : "▶️"}
 class TopBarComponentButton
 clickCommand togglePlayCommand`
  }
}

module.exports = { PlayButtonComponent }
