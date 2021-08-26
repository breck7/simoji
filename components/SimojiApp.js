// prettier-ignore
/*NODE_JS_ONLY*/ const { AbstractTreeComponent, TreeComponentFrameworkDebuggerComponent } = require("jtree/products/TreeComponentFramework.node.js")

const { jtree } = require("jtree")
const { yodash } = require("../yodash")

const { ExampleSims } = require("./ExampleSims.js")
const { TopBarComponent } = require("./TopBar.js")
const { SimEditorComponent } = require("./SimEditor.js")
const { HelpModalComponent } = require("./HelpModal.js")
const { BoardComponent } = require("./Board.js")
const { BottomBarComponent } = require("./BottomBar.js")
const { RightBarComponent } = require("./RightBar.js")
const { EditorHandleComponent } = require("./EditorHandle.js")
const { Keywords, LocalStorageKeys, UrlKeys, Directions } = require("./Types.js")

const MIN_GRID_SIZE = 10
const MAX_GRID_SIZE = 200
const DEFAULT_GRID_SIZE = 20
const MIN_GRID_COLUMNS = 10
const MIN_GRID_ROWS = 10

// prettier-ignore
/*NODE_JS_ONLY*/ const simojiCompiler = jtree.compileGrammarFileAtPathAndReturnRootConstructor(   __dirname + "/../simoji.grammar")

class githubTriangleComponent extends AbstractTreeComponent {
  githubLink = `https://github.com/publicdomaincompany/simoji`
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

class ErrorNode extends AbstractTreeComponent {
  _isErrorNodeType() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: SimojiApp does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

let _defaultSeed = Date.now()
const newSeed = () => {
  _defaultSeed++
  return _defaultSeed
}

class SimojiApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(ErrorNode, {
      TopBarComponent,
      githubTriangleComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent,
      EditorHandleComponent
    })
  }

  resetAllCommand() {
    const restart = this.isRunning
    this.loadNewSim(this.simCode)
    if (restart) this.startAllIntervals()
  }

  makeGrid(simojiProgram, windowWidth, windowHeight) {
    const setSize = simojiProgram.get(Keywords.size)
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : DEFAULT_GRID_SIZE, MIN_GRID_SIZE), MAX_GRID_SIZE)

    const chromeWidth = this.leftStartPosition + SIZES.RIGHT_BAR_WIDTH + SIZES.BOARD_MARGIN
    const maxAvailableCols = Math.floor((windowWidth - chromeWidth) / gridSize) - 1
    const maxAvailableRows = Math.floor((windowHeight - SIZES.CHROME_HEIGHT) / gridSize) - 1

    const setCols = simojiProgram.get(Keywords.columns)
    const cols = Math.max(1, setCols ? parseInt(setCols) : Math.max(MIN_GRID_COLUMNS, maxAvailableCols))

    const setRows = simojiProgram.get(Keywords.rows)
    const rows = Math.max(1, setRows ? parseInt(setRows) : Math.max(MIN_GRID_ROWS, maxAvailableRows))

    return { gridSize, cols, rows }
  }

  verbose = true

  compiledStartState = ""

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
      this._appendExperiment(program, index)
    })
  }

  _appendExperiment(program, index) {
    const { windowWidth, windowHeight } = this
    const { gridSize, cols, rows } = this.makeGrid(program, windowWidth, windowHeight)
    const seed = program.has(Keywords.seed) ? parseInt(program.get(Keywords.seed)) : newSeed()
    const randomNumberGenerator = yodash.getRandomNumberGenerator(seed)

    this.compiledStartState = ""
    try {
      this.compiledStartState = yodash.compileBoardStartState(program, rows, cols, randomNumberGenerator).trim()
    } catch (err) {
      if (this.verbose) console.error(err)
    }

    const styleNode = program.getNode(Keywords.style) ?? undefined
    const board = this.appendLineAndChildren(
      `BoardComponent ${gridSize} ${rows} ${cols} ${index}`,
      `leftStartPosition ${this.leftStartPosition}\n${this.compiledStartState.trim()}
GridComponent
${styleNode ? styleNode.toString().replace("style", "BoardStyleComponent") : ""}`.trim()
    )
    board.seed = seed
    board.randomNumberGenerator = randomNumberGenerator
  }

  get leftStartPosition() {
    return this.editor.width
  }

  get editor() {
    return this.getNode("SimEditorComponent")
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
    const errs = new simojiCompiler(this.simCode).getAllErrors()
    console.log(new jtree.TreeNode(errs.map(err => err.toObject())).toFormattedTable(200))
  }

  get boards() {
    return this.findNodes("BoardComponent")
  }

  get board() {
    return this.boards[0]
  }

  get mainExperiment() {
    return new simojiCompiler(this.simCode)
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
      this._simojiPrograms = this._simojiPrograms.map(program => new simojiCompiler(program.toString()))
    }
    return this._simojiPrograms
  }

  startAllIntervals() {
    this.boards.forEach(board => board.startInterval())
  }

  stopAllIntervals() {
    this.boards.forEach(board => board.stopInterval())
  }

  advanceOneTickCommand() {
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
      willowBrowser.getMousetrap().bind(key, function(evt) {
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

    const str = this.selection
      .map(agent =>
        agent
          .getWords()
          .slice(0, 3)
          .join(" ")
      )
      .join("\n")

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

  toggleSelectCommand(objects) {
    objects.forEach(object => {
      this.selection.includes(object) ? this.unselectCommand(object) : this.selectCommand(object)
    })

    this.ensureRender()
    return this
  }

  unselectCommand(object) {
    object.unselect()
    this.selection = this.selection.filter(node => node !== object)
  }

  selectCommand(object) {
    this.selection.push(object)
    object.select()
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
    const tree = new jtree.TreeNode()
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
    this.getNode("BottomBarComponent PlayButtonComponent")
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

  moveSelection(direction) {
    const { selection } = this
    if (!selection.length) return this
    selection.forEach(node => {
      node.angle = direction
      node._move()
    })

    this.boards.forEach(board => board.resetAgentPositionMap())

    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.nuke())
    this.selection = []
    this.boards.forEach(board => board.resetAgentPositionMap())
  }

  // Save the current random play for reproducibility and shareability
  snapShotCommand() {
    const newCode = new jtree.TreeNode(this.simCode)
    const boards = this.boards
    const board = boards[0]
    console.log(board.seed, board.rows, board.cols)
    newCode.set(Keywords.seed, board.seed.toString())
    newCode.set(Keywords.rows, board.rows.toString())
    newCode.set(Keywords.columns, board.cols.toString())
    newCode.findNodes(Keywords.experiment).forEach((experiment, index) => {
      const board = boards[index + 1]
      experiment.set(Keywords.seed, board.seed.toString())
      experiment.set(Keywords.rows, board.rows.toString())
      experiment.set(Keywords.columns, board.cols.toString())
    })

    this.editor.setCodeMirrorValue(newCode.toString())
    this.loadNewSim(newCode)
  }

  async toggleHelpCommand() {
    this.toggleAndRender("HelpModalComponent")
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
      up: () => this.moveSelection(Directions.North),
      down: () => this.moveSelection(Directions.South),
      right: () => this.moveSelection(Directions.East),
      left: () => this.moveSelection(Directions.West),
      escape: () => this.clearSelectionCommand(),
      "command+a": () => this.selectAllCommand(),
      "?": () => this.toggleHelpCommand(),
      t: () => this.advanceOneTickCommand(),
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

SIZES.EDITOR_WIDTH = 250
SIZES.RIGHT_BAR_WIDTH = 30

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const editorStartWidth =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LocalStorageKeys.editorStartWidth) ?? SIZES.EDITOR_WIDTH
      : SIZES.EDITOR_WIDTH
  const startState = new jtree.TreeNode(`githubTriangleComponent
TopBarComponent
 LogoComponent
 ShareComponent
 ExamplesComponent
BottomBarComponent
 ResetButtonComponent
 PlayButtonComponent
 ReportButtonComponent
RightBarComponent
 AgentPaletteComponent
SimEditorComponent ${editorStartWidth} ${SIZES.CHROME_HEIGHT}
 value
  ${simojiCode.replace(/\n/g, "\n  ")}
EditorHandleComponent`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendExperiments()
  return app
}

module.exports = { SimojiApp }
