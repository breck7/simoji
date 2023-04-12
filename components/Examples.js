const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")
const { ExampleSims } = require("./ExampleSims.js")

const { AbstractContextMenuComponent } = require("./AbstractContextMenu.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

const Categories = new TreeNode(`🦠 Epidemiology
 virus
 covid19
🌲 Forests
 fire
 fireAdvanced
⚽️ Sports
 soccer
 pong
 basketball
💰 Business
 startupIdeas
🦋 Biology
 moths
🕹 Games
 zombies`)

class ExampleMenuComponent extends AbstractContextMenuComponent {
  getContextMenuBodyStumpCode() {
    const icon = this.getWord(1)
    const category = Categories.getNode(icon)

    return category
      .map(node => {
        const name = node.firstWord
        const program = ExampleSims.getNode(name)
        const icon = program.childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
        const properName = Utils.ucfirst(name)
        return `a ${icon}  &nbsp; ${properName}
 clickCommand loadExampleCommand ${name}
 class ExampleButton`
      })
      .join("\n")
  }

  // Align these to below and to the left of the clicked button
  top = 28
  get left() {
    const evt = this.root.getMouseEvent()
    return evt.clientX - evt.offsetX
  }
}

class ExamplesComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    const categories = Categories.map(category => {
      const icon = category.firstWord
      const name = category.content
      const firstFile = category.nodeAt(0).firstWord
      return ` a ${icon}
  href index.html#example%20${firstFile}
  title ${name}
  clickCommand openCategoryCommand ${icon}`
    }).join("\n")
    return `div
 class ${ExamplesComponent.name}
${categories}`
  }

  async openCategoryCommand(icon) {
    const root = this.root
    const category = Categories.getNode(icon)
    const firstFile = category.nodeAt(0).firstWord
    this.root.toggleAndRender(`${ExampleMenuComponent.name} ${icon}`)
  }
}

module.exports = { ExamplesComponent, ExampleMenuComponent }
