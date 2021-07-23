const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ExamplesComponent extends AbstractTreeComponent {
  loadExampleCommand(name) {
    app.loadNewSim(exampleSims.getNode(name).childrenToString())
    location.hash = ""
  }

  toStumpCode() {
    const sims = exampleSims
      .getFirstWords()
      .map(
        item => ` a ${item}
  href index.html#example%20${item}
  clickCommand loadExampleCommand ${item}`
      )
      .join("\n")
    return `div
 class ExamplesComponent
${sims}`
  }
}

module.exports = { ExamplesComponent }
