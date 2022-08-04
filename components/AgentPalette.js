const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class AgentPaletteComponent extends AbstractTreeComponent {
  toStumpCode() {
    const root = this.getRootNode()
    const { agentToInsert } = root
    const items = this.paletteItems
      .map(item => item.getWord(0))
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
    return this.getRootNode().allAgentTypes.filter(item => !item.has("noPalette"))
  }

  changeAgentBrushCommand(x) {
    this.getRootNode().changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.getRootNode().board]
  }
}

module.exports = { AgentPaletteComponent }
