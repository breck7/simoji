const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class PlayButtonComponent extends AbstractTreeComponent {
  get isStarted() {
    return this.getRootNode().isStarted
  }

  toStumpCode() {
    return `span ${this.isStarted ? "⏸" : "▶️"}
 class PlayButtonComponent
 clickCommand togglePlayCommand`
  }

  togglePlayCommand() {
    this.getRootNode().togglePlayCommand()
  }
}

module.exports = { PlayButtonComponent }
