const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { Keywords } = require("./Types.js")

class TitleComponent extends AbstractTreeComponent {
  get question() {
    return this.app.mainExperiment.get(Keywords.question) ?? ""
  }

  get app() {
    return this.getRootNode()
  }

  getDependencies() {
    return [this.app.firstProgram]
  }

  toStumpCode() {
    return `div 
 class ${TitleComponent.name}
 style left:${this.app.leftStartPosition + 10}px;
 div ${this.question}
  class Question`
  }
}

module.exports = { TitleComponent }
