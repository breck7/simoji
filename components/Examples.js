const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ExamplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const sims = exampleSims
      .getFirstWords()
      .map(
        item => ` a ${jtree.Utils.ucfirst(item)}
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
