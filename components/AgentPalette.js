const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class AgentPaletteComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    const root = this.root
    const { agentToInsert } = root
    const items = this.paletteItems
      .map(item => item.firstWord)
      .map(
        word => ` div ${word}
  class ${agentToInsert === word ? "ActiveAgent" : ""}
  clickCommand changeAgentBrushCommand ${word}`
      )
      .join("\n")
    return `div
 class AgentPaletteComponent
${items}`
  }

  get paletteItems() {
    return this.root.allAgentTypes.filter(item => !item.has("noPalette"))
  }

  changeAgentBrushCommand(x) {
    this.root.changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.root.board]
  }
}

module.exports = { AgentPaletteComponent }
