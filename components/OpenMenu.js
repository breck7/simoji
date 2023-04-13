const { TreeNode } = require("jtree/products/TreeNode.js")
const { Utils } = require("jtree/products/Utils.js")

const { AbstractContextMenuComponent } = require("./AbstractContextMenu.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

// 🦠 Epidemiology
//  virus
//  covid19
// 🌲 Forests
//  fire
//  fireAdvanced
// ⚽️ Sports
//  soccer
//  pong
//  basketball
// 💰 Business
//  startupIdeas
// 🦋 Biology
//  moths
// 🕹 Games
//  zombies

class OpenMenuDropDownComponent extends AbstractContextMenuComponent {
  getContextMenuBodyStumpCode() {
    const fileSystem = this.root.fileSystem
    const files = fileSystem.list("/Users/breck/simoji/examples/")

    return Object.values(files)
      .map(name => {
        const program = fileSystem.read(name)
        const icon = new TreeNode(program).childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
        const properName = Utils.ucfirst(name)
        return `a ${icon}  &nbsp; ${properName}
 clickCommand openFileCommand ${name}
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

class OpenMenuButtonComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `div
 class ${OpenMenuButtonComponent.name}
 a 📂
  title Open
  clickCommand openCategoryCommand`
  }

  async openCategoryCommand() {
    this.root.toggleAndRender(`${OpenMenuDropDownComponent.name}`)
  }
}

module.exports = { OpenMenuButtonComponent, OpenMenuDropDownComponent }
