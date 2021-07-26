const { jtree } = require("jtree")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

// prettier-ignore
/*NODE_JS_ONLY*/ const simojiCompiler = jtree.compileGrammarFileAtPathAndReturnRootConstructor(   __dirname + "/../simoji.grammar")

class SimEditorComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class SimEditorComponent
 textarea
  id EditorTextarea`
  }

  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      value: jtree.TreeNode
    })
  }

  get codeMirrorValue() {
    return this.codeMirrorInstance.getValue()
  }

  codeWidgets = []

  _onCodeKeyUp() {
    const { willowBrowser } = this
    const code = this.codeMirrorValue
    const root = this.getRootNode()
    root.pauseCommand()
    // this._updateLocalStorage()

    this.program = new simojiCompiler(code)
    const errs = this.program.getAllErrors()

    willowBrowser.setHtmlOfElementWithIdHack("codeErrorsConsole", `${errs.length} errors`)

    const cursor = this.codeMirrorInstance.getCursor()

    // todo: what if 2 errors?
    this.codeMirrorInstance.operation(() => {
      this.codeWidgets.forEach(widget => this.codeMirrorInstance.removeLineWidget(widget))
      this.codeWidgets.length = 0

      errs
        .filter(err => !err.isBlankLineError())
        .filter(err => !err.isCursorOnWord(cursor.line, cursor.ch))
        .slice(0, 1) // Only show 1 error at a time. Otherwise UX is not fun.
        .forEach(err => {
          const el = err.getCodeMirrorLineWidgetElement(() => {
            this.codeMirrorInstance.setValue(this.program.toString())
            this._onCodeKeyUp()
          })
          this.codeWidgets.push(
            this.codeMirrorInstance.addLineWidget(err.getLineNumber() - 1, el, { coverGutter: false, noHScroll: false })
          )
        })
      const info = this.codeMirrorInstance.getScrollInfo()
      const after = this.codeMirrorInstance.charCoords({ line: cursor.line + 1, ch: 0 }, "local").top
      if (info.top + info.clientHeight < after) this.codeMirrorInstance.scrollTo(null, after - info.clientHeight + 3)
    })

    root.loadNewSim(code)
  }

  get simCode() {
    return this.codeMirrorInstance ? this.codeMirrorValue : this.getNode("value").childrenToString()
  }

  async treeComponentDidMount() {
    this.loadCodeMirror()
    super.treeComponentDidMount()
  }

  async treeComponentDidUpdate() {
    this.loadCodeMirror()
    super.treeComponentDidUpdate()
  }

  setCodeMirrorValue(value) {
    this.codeMirrorInstance.setValue(value)
  }

  loadCodeMirror() {
    this.codeMirrorInstance = new jtree.TreeNotationCodeMirrorMode(
      "custom",
      () => simojiCompiler,
      undefined,
      CodeMirror
    )
      .register()
      .fromTextAreaWithAutocomplete(document.getElementById("EditorTextarea"), {
        lineWrapping: false,
        lineNumbers: false
      })
    this.setCodeMirrorValue(this.getNode("value").childrenToString())
    this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
    this.codeMirrorInstance.setSize(250, jQuery(window).height() - 68)
  }
}

module.exports = { SimEditorComponent }
