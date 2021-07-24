const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class AgentPaletteComponent extends AbstractTreeComponent {
  toStumpCode() {
    const root = this.getRootNode()
    const activeObject = root.agentToInsert
    const items = root.simojiProgram.objectTypes
      .map(item => item.getWord(0))
      .map(
        word => ` div ${word}
  class ${activeObject === word ? "ActiveObject" : ""}
  clickCommand changeAgentBrushCommand ${word}`
      )
      .join("\n")
    return `div
 class AgentPaletteComponent
${items}`
  }

  changeAgentBrushCommand(x) {
    this.getRootNode().changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }
}

module.exports = { AgentPaletteComponent }
