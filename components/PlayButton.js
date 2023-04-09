const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class PlayButtonComponent extends AbstractTreeComponentParser {
  get isStarted() {
    return this.root.isRunning
  }

  toStumpCode() {
    return `span ${this.isStarted ? "&#10074;&#10074;" : "▶︎"}
 class ${PlayButtonComponent.name} BottomButton
 clickCommand togglePlayAllCommand`
  }
}

module.exports = { PlayButtonComponent }
