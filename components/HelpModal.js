const { TreeNode } = require("jtree/products/TreeNode.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

class AbstractModalTreeComponent extends AbstractTreeComponentParser {
  toHakonCode() {
    return `.modalBackground
 position fixed
 top 0
 left 0
 width 100%
 height 100%
 z-index 1000
 display flex
 padding-top 50px
 align-items baseline
 justify-content center
 box-sizing border-box
 background rgba(0,0,0,0.4)

.modalContent
 background white
 color black
 box-shadow 0px 0px 2px rgba(0,0,0,0.4)
 padding 20px
 position relative
 min-width 600px
 max-width 800px
 max-height 90%
 white-space nowrap
 text-overflow ellipsis
 overflow-x hidden
 overflow-y scroll

.modalClose
 position absolute
 top 10px
 right 10px
 cursor pointer`
  }

  toStumpCode() {
    return new TreeNode(`section
 clickCommand unmountAndDestroyCommand
 class modalBackground
 section
  clickCommand stopPropagationCommand
  class modalContent
  a X
   id closeModalX
   clickCommand unmountAndDestroyCommand
   class modalClose
  {modelStumpCode}`).templateToString({ modelStumpCode: this.getModalStumpCode() })
  }
}

class HelpModalComponent extends AbstractModalTreeComponent {
  getModalStumpCode() {
    return `iframe
 class helpIframe
 src cheatSheet.html`
  }
}

module.exports = { HelpModalComponent }
