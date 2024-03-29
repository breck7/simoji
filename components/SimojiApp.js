// prettier-ignore
/*NODE_JS_ONLY*/ const { AbstractTreeComponentParser, TreeComponentFrameworkDebuggerComponent } = require("jtree/products/TreeComponentFramework.node.js")

const { TreeNode } = require("jtree/products/TreeNode.js")
const { yodash } = require("../yodash")

const { ExampleSims } = require("./ExampleSims.js")
const { TopBarComponent, LogoComponent } = require("./TopBar.js")
const { ShareComponent } = require("./Share.js")
const { ResetButtonComponent } = require("./ResetButton.js")
const { PlayButtonComponent } = require("./PlayButton.js")
const { ReportButtonComponent } = require("./ReportButton.js")
const { AgentPaletteComponent } = require("./AgentPalette.js")
const { GridComponent } = require("./Grid.js")
const { SimEditorComponent } = require("./SimEditor.js")
const { HelpModalComponent } = require("./HelpModal.js")
const { ExampleMenuComponent, ExamplesComponent } = require("./Examples.js")
const { BoardComponent } = require("./Board.js")
const { BottomBarComponent } = require("./BottomBar.js")
const { RightBarComponent } = require("./RightBar.js")
const { EditorHandleComponent } = require("./EditorHandle.js")
const { TitleComponent } = require("./Title.js")
const { Keywords, LocalStorageKeys, UrlKeys, ParserTypes } = require("./Types.js")

// prettier-ignore
/*NODE_JS_ONLY*/ const simojiParser = require("jtree/products/GrammarCompiler.js").GrammarCompiler.compileGrammarFileAtPathAndReturnRootParser(   __dirname + "/../dist/simoji.grammar")

class githubTriangleComponent extends AbstractTreeComponentParser {
  githubLink = `https://github.com/breck7/simoji`
  toHakonCode() {
    return `.AbstractGithubTriangleComponent
 display block
 position absolute
 top 0
 right 0
 z-index 3`
  }
  toStumpCode() {
    return `a
 class AbstractGithubTriangleComponent
 href ${this.githubLink}
 target _blank
 img
  height 40px
  src github-fork.svg`
  }
}

class ErrorParser extends AbstractTreeComponentParser {
  _isErrorParser() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: SimojiApp does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class SimojiApp extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(ErrorParser, {
      TopBarComponent,
      githubTriangleComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent,
      EditorHandleComponent,
      TitleComponent,
      ExampleMenuComponent
    })
  }

  resetAllCommand() {
    const restart = this.isRunning
    this.loadNewSim(this.simCode)
    if (restart) this.startAllIntervals()
  }

  makeGrid(simojiProgram, windowWidth, windowHeight) {
    const chromeWidth = this.leftStartPosition + SIZES.RIGHT_BAR_WIDTH + SIZES.BOARD_MARGIN
    const width = windowWidth - chromeWidth - 1
    const height = windowHeight - SIZES.CHROME_HEIGHT - SIZES.TITLE_HEIGHT - 1

    const setWidth = simojiProgram.get(Keywords.width)
    const setHeight = simojiProgram.get(Keywords.height)
    // todo: use the set values if present

    return { width, height }
  }

  verbose = true

  get firstProgram() {
    return this.simojiPrograms[0]
  }

  get allAgentTypes() {
    return this.firstProgram.agentTypes // todo: this isn't quite correct
  }

  appendExperiments() {
    this.simojiPrograms.forEach((program, index) => {
      if (index > 3)
        // currently max out at 4 experiments. just need to update CSS transform code.
        return
      const board = this._appendExperiment(program, index)

      try {
        program
          .filter(node => node.doesExtend(ParserTypes.abstractInjectCommandParser))
          .forEach(command => board.runInjectCommand(command))
      } catch (err) {
        if (this.verbose) console.error(err)
      }
    })
  }

  closeAllContextMenus() {
    this.filter(node => node instanceof ExampleMenuComponent).forEach(node => node.unmountAndDestroy())
  }

  _onCommandWillRun() {
    this.closeAllContextMenus() // todo: move these to a body handler?
  }

  _appendExperiment(program, index) {
    const { windowWidth, windowHeight } = this
    const { width, height } = this.makeGrid(program, windowWidth, windowHeight)

    const styleNode = program.getNode(Keywords.style) ?? undefined
    const board = this.appendLineAndChildren(
      `${BoardComponent.name} 1 ${width} ${height} ${index}`,
      `leftStartPosition ${this.leftStartPosition}
${GridComponent.name}
${styleNode ? styleNode.toString().replace("style", BoardStyleComponent.name) : ""}`.trim()
    )
    return board
  }

  get leftStartPosition() {
    return this.editor.width
  }

  get editor() {
    return this.getNode(SimEditorComponent.name)
  }

  onSourceCodeChange(newCode) {
    this.editor.setCodeMirrorValue(newCode.toString())
    this.updateLocalStorage(newCode)
  }

  loadExampleCommand(name) {
    const restart = this.isRunning
    const simCode = ExampleSims.getNode(name).childrenToString()
    this.editor.setCodeMirrorValue(simCode)
    this.loadNewSim(simCode)
    if (restart) this.startAllIntervals()
    this.willowBrowser.setHash("")
  }

  get simCode() {
    return this.editor.simCode
  }

  loadNewSim(simCode) {
    this.stopAllIntervals()
    this.boards.forEach(board => board.unmountAndDestroy())

    delete this._simojiPrograms
    this.selection = []

    this.appendExperiments()
    this.renderAndGetRenderReport()
    this.updateLocalStorage(simCode)
  }

  // todo: cleanup
  pasteCodeCommand(simCode) {
    this.editor.setCodeMirrorValue(simCode)
    this.loadNewSim(simCode)
  }

  updateLocalStorage(simCode) {
    if (this.isNodeJs()) return // todo: tcf should shim this
    localStorage.setItem(LocalStorageKeys.simoji, simCode)
    console.log("Local storage updated...")
  }

  dumpErrorsCommand() {
    const errs = new simojiParser(this.simCode).getAllErrors()
    console.log(new TreeNode(errs.map(err => err.toObject())).toFormattedTable(200))
  }

  get boards() {
    return this.findNodes(BoardComponent.name)
  }

  get board() {
    return this.boards[0]
  }

  get mainExperiment() {
    return new simojiParser(this.simCode)
  }

  get simojiPrograms() {
    if (!this._simojiPrograms) {
      const { mainExperiment } = this
      this._simojiPrograms = mainExperiment.has(Keywords.experiment)
        ? []
        : [yodash.patchExperimentAndReplaceSymbols(mainExperiment)]
      mainExperiment.findNodes(Keywords.experiment).forEach(experiment => {
        this._simojiPrograms.push(yodash.patchExperimentAndReplaceSymbols(mainExperiment, experiment))
      })
      // Evaluate the variables
      this._simojiPrograms = this._simojiPrograms.map(program => new simojiParser(program.toString()))
    }
    return this._simojiPrograms
  }

  startAllIntervals() {
    this.boards.forEach(board => board.startInterval())
  }

  stopAllIntervals() {
    this.boards.forEach(board => board.stopInterval())
  }

  get maxTick() {
    return Math.max(...this.boards.map(board => board.tick))
  }

  goBackOneTickCommand() {
    const { maxTick } = this
    const previousTick = maxTick - 2
    this.pauseAllCommand()
    if (previousTick < 0) return
    this.loadNewSim(this.simCode)
    this.boards.forEach(board => board.skipToThisManyTicksIfNotPaused(previousTick))
    console.log(`Running to tick ${previousTick} from ${maxTick}`)
  }

  advanceOneTickCommand() {
    this.pauseAllCommand()
    this.boards.forEach(board => board.boardLoop())
  }

  get isRunning() {
    return this.boards.some(board => board.isRunning)
  }

  async start() {
    const { willowBrowser } = this
    this._bindTreeComponentFrameworkCommandListenersOnBody()
    this.renderAndGetRenderReport(willowBrowser.getBodyStumpNode())

    const keyboardShortcuts = this._getKeyboardShortcuts()
    Object.keys(keyboardShortcuts).forEach(key => {
      willowBrowser.getMousetrap().bind(key, function (evt) {
        keyboardShortcuts[key]()
        // todo: handle the below when we need to
        if (evt.preventDefault) evt.preventDefault()
        return false
      })
    })

    this.willowBrowser.setResizeEndHandler(() => {
      this.editor.setSize()
    })

    this._makeDocumentCopyableAndCuttable()
  }

  _makeDocumentCopyableAndCuttable() {
    const app = this
    this.willowBrowser
      .setCopyHandler(evt => app.copySelectionCommand(evt))
      .setCutHandler(evt => app.cutSelectionCommand(evt))
  }

  async copySelectionCommand(evt) {
    this._copySelection(evt)
  }

  async cutSelectionCommand(evt) {
    this._copySelection(evt)
    this.deleteSelectionCommand()
  }

  _copySelection(evt) {
    const willowBrowser = this.willowBrowser
    if (willowBrowser.someInputHasFocus()) return ""

    if (!this.selection.length) return ""

    const str = this.selection.map(agent => agent.words.slice(0, 3).join(" ")).join("\n")

    evt.preventDefault()
    evt.clipboardData.setData("text/plain", str)
    evt.clipboardData.setData("text/html", str)

    return str
  }

  // todo: fix for boards
  async runUntilPause() {
    await this.start()
    this.boards.forEach(board => board.runUntilPause())
    console.log(`Finished on tick ${this.board.tick}`)
  }

  ensureRender() {
    if (this.isRunning) return this
    this.renderAndGetRenderReport()
  }

  async downloadCsvCommand() {
    let extension = "csv"
    let type = "text/csv"
    let str = this.board.populationCsv
    const filename = "simoji"

    console.log(str)
    this.willowBrowser.downloadFile(str, filename + "." + extension, type)
  }

  log(message) {
    if (this.verbose) console.log(message)
  }

  async openReportInOhayoCommand() {
    this.willowBrowser.openUrl(this.ohayoLink)
  }

  get urlHash() {
    const tree = new TreeNode()
    tree.appendLineAndChildren(UrlKeys.simoji, this.simCode ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }

  get report() {
    const report = this.mainExperiment.getNode(Keywords.report)
    return report ? report.childrenToString() : "roughjs.line"
  }

  get ohayoLink() {
    const program = `data.inline
 ${this.report.replace(/\n/g, "\n ")}
 content
  ${this.board.populationCsv.replace(/\n/g, "\n  ")}`

    const link = this.willowBrowser.toPrettyDeepLink(program, {})
    const parts = link.split("?")
    return "https://ohayo.computer?filename=simoji.ohayo&" + parts[1]
  }

  updatePlayButtonComponentHack() {
    this.getNode(`${BottomBarComponent.name} ${PlayButtonComponent.name}`)
      .setContent(Date.now())
      .renderAndGetRenderReport()
  }

  onBoardPause() {
    this.updatePlayButtonComponentHack()
  }

  togglePlayAllCommand() {
    this.isRunning ? this.stopAllIntervals() : this.startAllIntervals()
    this.updatePlayButtonComponentHack()
  }

  pauseAllCommand() {
    if (this.isRunning) {
      this.stopAllIntervals()
      this.updatePlayButtonComponentHack()
    }
  }

  changeAgentBrushCommand(agent) {
    if (agent === this._agentToInsert) {
      this._agentToInsert = undefined
      return this
    }
    this._agentToInsert = agent
    return this
  }

  get agentToInsert() {
    return this._agentToInsert
  }

  selection = []

  moveSelection(x, y) {
    const { selection } = this
    if (!selection.length) return this
    selection.forEach(node => {
      node.direction = { x, y }
      node._move()
    })

    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.nuke())
    this.selection = []
    // todo: update any state?
  }

  get isSnapshotOn() {
    // technically also needs width and height settings
    return new TreeNode(this.simCode).has(Keywords.seed)
  }

  // Save the current random play for reproducibility and shareability
  snapShotCommand() {
    const newCode = new TreeNode(this.simCode)
    const boards = this.boards

    // todo: buggy. we should rename the board class to experiment, or rename experiment keyword to board.
    const board = boards[0]
    newCode.set(Keywords.seed, board.seed.toString())
    newCode.set(Keywords.height, board.height.toString())
    newCode.set(Keywords.width, board.width.toString())
    newCode.findNodes(Keywords.experiment).forEach((experiment, index) => {
      const board = boards[index]
      experiment.set(Keywords.seed, board.seed.toString())
      experiment.set(Keywords.height, board.height.toString())
      experiment.set(Keywords.width, board.width.toString())
    })

    this.editor.setCodeMirrorValue(newCode.toString())
    this.updateLocalStorage(newCode)
  }

  async toggleHelpCommand() {
    this.toggleAndRender(HelpModalComponent.name)
  }

  clearSelectionCommand() {
    this.selection.forEach(object => object.unselect())
    this.selection = []
    this.ensureRender()
  }

  selectAllCommand() {
    this.selection = []
    this.boards.forEach(board => {
      board.agents.forEach(agent => {
        agent.select()
        this.selection.push(agent)
      })
    })
    this.ensureRender()
  }

  _getKeyboardShortcuts() {
    return {
      space: () => this.togglePlayAllCommand(),
      d: () => this.toggleTreeComponentFrameworkDebuggerCommand(),
      c: () => this.exportDataCommand(),
      o: () => this.openReportInOhayoCommand(),
      r: () => this.resetAllCommand(),
      s: () => this.snapShotCommand(),
      up: () => this.moveSelection(0, -1),
      down: () => this.moveSelection(0, 1),
      right: () => this.moveSelection(1, 0),
      left: () => this.moveSelection(-1, 0),
      escape: () => this.clearSelectionCommand(),
      "command+a": () => this.selectAllCommand(),
      "?": () => this.toggleHelpCommand(),
      ",": () => this.goBackOneTickCommand(),
      ".": () => this.advanceOneTickCommand(),
      backspace: () => this.deleteSelectionCommand()
    }
  }

  resizeEditorCommand(newSize = "100") {
    this.editor.setWord(1, newSize)
    this.boards.forEach(board => board.set("leftStartPosition", newSize))

    if (!this.isNodeJs()) localStorage.setItem(LocalStorageKeys.editorStartWidth, newSize)
    this.renderAndGetRenderReport()
  }
}

const SIZES = {}

SIZES.BOARD_MARGIN = 20
SIZES.TOP_BAR_HEIGHT = 28
SIZES.BOTTOM_BAR_HEIGHT = 40
SIZES.CHROME_HEIGHT = SIZES.TOP_BAR_HEIGHT + SIZES.BOTTOM_BAR_HEIGHT + SIZES.BOARD_MARGIN
SIZES.TITLE_HEIGHT = 20

SIZES.EDITOR_WIDTH = 250
SIZES.RIGHT_BAR_WIDTH = 30

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const editorStartWidth =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LocalStorageKeys.editorStartWidth) ?? SIZES.EDITOR_WIDTH
      : SIZES.EDITOR_WIDTH
  const startState = new TreeNode(`${githubTriangleComponent.name}
${TopBarComponent.name}
 ${LogoComponent.name}
 ${ShareComponent.name}
 ${ExamplesComponent.name}
${BottomBarComponent.name}
 ${ResetButtonComponent.name}
 ${PlayButtonComponent.name}
 ${ReportButtonComponent.name}
${RightBarComponent.name}
 ${AgentPaletteComponent.name}
${SimEditorComponent.name} ${editorStartWidth} ${SIZES.CHROME_HEIGHT}
 value
  ${simojiCode.replace(/\n/g, "\n  ")}
${EditorHandleComponent.name}
${TitleComponent.name}`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendExperiments()
  return app
}

module.exports = { SimojiApp }
