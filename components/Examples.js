const { jtree } = require("jtree")
const { ExampleSims } = require("./ExampleSims.js")

const { AbstractContextMenuComponent } = require("./AbstractContextMenu.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

const Categories = new jtree.TreeNode(`🦠 Epidemiology
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
👾 Game of Life
 gameOfLife
 gospersGliderGun
 gameOfLifeAdvanced
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
        const name = node.getFirstWord()
        const program = ExampleSims.getNode(name)
        const icon = program.childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
        const properName = jtree.Utils.ucfirst(name)
        return `a ${icon}  &nbsp; ${properName}
 clickCommand loadExampleCommand ${name}
 class ExampleButton`
      })
      .join("\n")
  }

  // Align these to below and to the left of the clicked button
  top = 28
  get left() {
    const evt = this.getRootNode().getMouseEvent()
    return evt.clientX - evt.offsetX
  }
}

class ExamplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const categories = Categories.map(category => {
      const icon = category.getFirstWord()
      const name = category.getContent()
      const firstFile = category.nodeAt(0).getFirstWord()
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
    const root = this.getRootNode()
    const category = Categories.getNode(icon)
    const firstFile = category.nodeAt(0).getFirstWord()
    this.getRootNode().toggleAndRender(`${ExampleMenuComponent.name} ${icon}`)
  }
}

module.exports = { ExamplesComponent, ExampleMenuComponent }
