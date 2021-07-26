const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { jtree } = require("jtree")

class TopBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      LogoComponent,
      ShareComponent,
      PlayButtonComponent,
      AnalyzeDataButtonComponent,
      ExamplesComponent
    })
  }
}

class AnalyzeDataButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span 📈
 class TopBarComponentButton
 clickCommand openInOhayoCommand`
  }
}

class LogoComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Start📗
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.getRootNode().toggleHelpCommand()
  }
}

module.exports = { TopBarComponent }
