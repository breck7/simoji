const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { ShareComponent } = require("./Share.js")
const { OpenMenuButtonComponent } = require("./OpenMenu.js")
const { TreeNode } = require("jtree/products/TreeNode.js")

class TopBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      LogoComponent,
      ShareComponent,
      OpenMenuButtonComponent
    })
  }
}

class LogoComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `a ❔
 href cheatSheet.html
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.root.toggleHelpCommand()
  }
}

module.exports = { TopBarComponent, LogoComponent }
