const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

const makeResizableDiv = (element, callback, stopResizeCallback) => {
  // Based off an entertaining read:
  // medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d
  let originalLeft = 0
  let originalMouseX = 0

  element.addEventListener("mousedown", evt => {
    evt.preventDefault()
    originalLeft = element.getBoundingClientRect().left
    originalMouseX = evt.pageX
    window.addEventListener("mousemove", resize)
    window.addEventListener("mouseup", stopResize)
  })

  const resize = evt => {
    const dragAmount = evt.pageX - originalMouseX
    const newLeft = originalLeft + dragAmount
    callback(newLeft)
  }

  const stopResize = () => {
    window.removeEventListener("mousemove", resize)
    window.removeEventListener("mouseup", stopResize)
    stopResizeCallback()
  }
}

class EditorHandleComponent extends AbstractTreeComponent {
  get left() {
    return this.getRootNode().editor.width
  }

  makeDraggable() {
    if (this.isNodeJs()) return
    makeResizableDiv(
      this.getStumpNode().getShadow().element,
      newLeft => this.getRootNode().resizeEditorCommand(Math.max(newLeft, 5) + ""),
      () => this.getRootNode().resetAllCommand()
    )
  }

  treeComponentDidMount() {
    this.makeDraggable()
  }

  treeComponentDidUpdate() {
    this.makeDraggable()
  }

  toStumpCode() {
    return `div
 class EditorHandleComponent
 style left:${this.left}px;`
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }
}

module.exports = { EditorHandleComponent }
