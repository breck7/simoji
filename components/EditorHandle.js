const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class EditorHandleComponent extends AbstractTreeComponent {
  get left() {
    return this.getRootNode().editor.width
  }

  makeDraggable() {
    if (this.isNodeJs()) return

    const root = this.getRootNode()
    jQuery(this.getStumpNode().getShadow().element).draggable({
      axis: "x",
      drag: function(event, ui) {
        if ("ontouchend" in document) return // do not update live on a touch device. otherwise buggy.
        root.resizeEditorCommand(Math.max(ui.offset.left, 5) + "")
      },
      stop: function(event, ui) {
        root.resizeEditorCommand(Math.max(ui.offset.left, 5) + "")
        root.resetAllCommand()
      }
    })
  }

  treeComponentDidMount() {
    this.makeDraggable()
  }

  treeComponentDidUpdate() {
    this.makeDraggable()
  }

  toStumpCode() {
    return `div
 class ${EditorHandleComponent.name}
 style left:${this.left}px;`
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }
}

module.exports = { EditorHandleComponent }
