const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { jtree } = require("jtree")
const { yodash } = require("../yodash")

class SimojiApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      TopBarComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent
    })
  }

  get agentMap() {
    if (!this._agentMap) {
      this.compiledCode = this.simojiProgram.compileObjectClassDeclarationsAndMap()
      this._agentMap = eval(this.compiledCode)
    }
    return this._agentMap
  }

  appendBoard() {
    const { simojiProgram, windowWidth, windowHeight } = this
    const setSize = simojiProgram.get("size")
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : 20, 10), 200)
    const cols = Math.floor((windowWidth - 287) / gridSize) - 1
    const rows = Math.floor(windowHeight / gridSize) - 10

    const compiledStartState = simojiProgram.compileSetup(rows, cols).trim()
    const styleNode = simojiProgram.getNode("style") ?? undefined
    this.appendLineAndChildren(
      `BoardComponent ${gridSize} ${rows} ${cols}`,
      `${compiledStartState.trim()}
GridComponent
${styleNode ? styleNode.toString().replace("style", "BoardStyleComponent") : ""}`.trim()
    )
  }

  get editor() {
    return this.getNode("SimEditorComponent")
  }

  loadNewSim(simCode) {
    clearInterval(this.interval)
    delete this._agentMap
    delete this._simojiProgram
    delete this.compiledCode
    delete this._solidsSet
    TreeNode._parsers.delete(BoardComponent) // clear parser
    this.editor.getNode("value").setChildren(simCode)
    this.editor.setWord(1, Date.now())

    this.board.unmountAndDestroy()
    this.appendBoard()
    this.startInterval()
    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
    localStorage.setItem("simoji", simCode)
    console.log("Local storage updated...")
  }

  get board() {
    return this.getNode("BoardComponent")
  }

  get simojiProgram() {
    if (!this._simojiProgram)
      this._simojiProgram = new simojiCompiler(this.getNode("SimEditorComponent value").childrenToString())
    return this._simojiProgram
  }

  startInterval() {
    this.interval = setInterval(() => {
      this.simLoop()
    }, this.stepTime)
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

    this.startInterval()
  }

  interval = undefined

  get stepTime() {
    const setTime = this.simojiProgram.get("stepTime")
    return setTime ? parseInt(setTime) : 100
  }

  isStarted = false
  simLoop(running = this.isStarted) {
    if (!running) return true

    this.agents.filter(node => node.force).forEach(node => node.applyForceCommand())

    this.agents.filter(node => node.speed).forEach(node => node.spinCommand().loopMove())
    const { agentPositionMap } = this
    agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
    this.handleTouches()
    this.agents.forEach(node => node.loopRoutine())

    const spawnNode = this.simojiProgram.getNode("spawns")
    if (spawnNode)
      yodash.spawnFunction(spawnNode, this.board, yodash.getRandomLocation(this.board.rows, this.board.cols))

    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap

    this.agents.forEach(node => {
      const { touchMap } = node
      if (touchMap) {
        const hits = yodash
          .positionsAdjacentTo(node.position)
          .map(pos => agentPositionMap.get(yodash.makePositionHash(pos)))
          .map(items => items && items[0])
          .filter(item => item)

        yodash.applyCommandMap(touchMap, hits, node)
      }
    })
  }

  ensureRender() {
    if (this.isStarted) return this
    const renderReport = this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
  }

  get agents() {
    return this.board.getTopDownArray().filter(node => node instanceof Agent)
  }

  get agentPositionMap() {
    const map = new Map()
    this.agents.forEach(node => {
      const { positionHash } = node
      if (!map.has(positionHash)) map.set(positionHash, [])
      map.get(positionHash).push(node)
    })
    return map
  }

  agentAt(position) {
    const hits = this.agentPositionMap.get(position)
    return hits ? hits[0] : undefined
  }

  isSolidAgent(position) {
    if (!this._solidsSet) {
      this._solidsSet = new Set()
      this.getRootNode()
        .getTopDownArray()
        .filter(node => node.solid)
        .forEach(item => {
          this._solidsSet.add(item.positionHash)
        })
    }
    const hash = yodash.makePositionHash(position)
    if (this._solidsSet.has(hash)) return true
    return false
  }

  toggleSelectCommand(object) {
    if (this.selection.includes(object)) {
      object.unselect()
      this.selection = this.selection.filter(node => node !== object)
    } else {
      this.selection.push(object)
      object.select()
    }

    this.ensureRender()
    return this
  }

  updatePlayButtonComponentHack() {
    this.getNode("TopBarComponent PlayButtonComponent")
      .setContent(this.isStarted)
      .renderAndGetRenderReport()
  }

  togglePlayCommand() {
    this.isStarted = !this.isStarted
    this.updatePlayButtonComponentHack()
  }

  changeAgentBrushCommand(object) {
    if (object === this._agentToInsert) {
      this._agentToInsert = undefined
      return this
    }
    this._agentToInsert = object
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
      const speed = node.speed
      node.angle = direction
      node.spin = 0
      node.speed = 1
      node.moveCommand()
      node.speed = speed
    })

    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.unmountAndDestroy())
  }

  async toggleHelpCommand() {
    this.toggleAndRender("HelpModalComponent")
  }

  _getKeyboardShortcuts() {
    return {
      space: () => this.togglePlayCommand(),
      d: () => {
        this.toggleTreeComponentFrameworkDebuggerCommand()
      },
      up: () => this.moveSelection("North"),
      down: () => this.moveSelection("South"),
      right: () => this.moveSelection("East"),
      left: () => this.moveSelection("West"),
      "?": () => this.toggleHelpCommand(),
      backspace: () => this.deleteSelectionCommand()
    }
  }
}

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const startState = new jtree.TreeNode(`TopBarComponent
 LogoComponent
 ShareComponent
 PlayButtonComponent
 ExamplesComponent
BottomBarComponent
RightBarComponent
 AgentPaletteComponent
SimEditorComponent
 value
  ${simojiCode.replace(/\n/g, "\n  ")}`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendBoard()
  return app
}

module.exports = { SimojiApp }
