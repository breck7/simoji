const { jtree } = require("jtree")
const { ExampleSims } = require("./ExampleSims.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class ExamplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const sims = ExampleSims.map(item => {
      const name = item.getFirstWord()
      const properName = jtree.Utils.ucfirst(name)
      const icon = item.childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
      return ` a ${icon}
  href index.html#example%20${name}
  title ${properName}
  clickCommand loadExampleCommand ${name}`
    }).join("\n")
    return `div
 class ${ExamplesComponent.name}
${sims}`
  }
}

module.exports = { ExamplesComponent }
