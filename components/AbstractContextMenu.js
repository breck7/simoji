const { TreeNode } = require("jtree/products/TreeNode.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")

var jQuery

class AbstractContextMenuComponent extends AbstractTreeComponentParser {
  toHakonCode() {
    const theme = this.getTheme()
    return `.AbstractContextMenuComponent
 position fixed
 max-height 100%
 color white
 z-index 221
 background rgb(47,47,51)
 box-shadow 0 1px 3px 0 rgb(47,47,51)
 font-size 14px
 a
  display block
  padding 3px
  font-size 14px
  text-decoration none`
  }

  static closeAllContextMenusOn(treeNode) {
    treeNode.filter(node => node instanceof AbstractContextMenuComponent).forEach(node => node.unmountAndDestroy())
  }

  toStumpCode() {
    return new TreeNode(`div
 class AbstractContextMenuComponent {constructorName}
 {body}`).templateToString({ constructorName: this.constructor.name, body: this.getContextMenuBodyStumpCode() })
  }

  treeComponentDidMount() {
    const container = this.getStumpNode()
    const app = this.root
    const { willowBrowser } = app
    const bodyShadow = willowBrowser.getBodyStumpNode().getShadow()
    const unmountOnClick = function() {
      bodyShadow.offShadowEvent("click", unmountOnClick) // todo: should we move this to before unmount?
      app.closeAllContextMenus()
    }
    setTimeout(() => bodyShadow.onShadowEvent("click", unmountOnClick), 100) // todo: fix this.
    const event = app.getMouseEvent()
    const windowSize = willowBrowser.getWindowSize()
    const position = this._getContextMenuPosition(
      windowSize.width,
      windowSize.height,
      this.left,
      event.clientY,
      container.getShadow()
    )
    jQuery(container.getShadow().element).css(position)
  }

  top = undefined
  get left() {
    return this.root.getMouseEvent().clientX
  }

  _getContextMenuPosition(windowWidth, windowHeight, x, y, shadow) {
    let boxTop = y
    let boxLeft = x
    const boxWidth = shadow.getShadowOuterWidth()
    const boxHeight = shadow.getShadowOuterHeight()
    const boxHeightOverflow = boxHeight + boxTop - windowHeight
    const boxRightOverflow = boxWidth + boxLeft - windowWidth

    // todo: instead of this change orientation
    if (boxHeightOverflow > 0) boxTop -= boxHeightOverflow

    if (boxRightOverflow > 0) boxLeft = x - boxWidth - 5

    if (boxTop < 0) boxTop = 0

    return {
      left: boxLeft,
      top: this.top ?? boxTop
    }
  }
}

module.exports = { AbstractContextMenuComponent }
