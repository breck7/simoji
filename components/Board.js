const { jtree } = require("jtree")
const { yodash } = require("../yodash.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { GridComponent } = require("./Grid.js")
const { Agent } = require("./Agent.js")
const { Keywords, NodeTypes } = require("./Types.js")
const { WorldMap } = require("./WorldMap.js")

let nodeJsPrefix = ""

// prettier-ignore
/*NODE_JS_ONLY*/ nodeJsPrefix = `const { Agent } = require("${__dirname}/Agent.js");`

class BoardErrorNode extends AbstractTreeComponent {
  _isErrorNodeType() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: Board does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class leftStartPosition extends jtree.TreeNode {
  get width() {
    return parseInt(this.getWord(1))
  }
}

class BoardComponent extends AbstractTreeComponent {
  // override default parser creation.
  _getParser() {
    if (!this._parser)
      this._parser = new jtree.TreeNode.Parser(BoardErrorNode, {
        ...this.agentMap,
        GridComponent,
        BoardStyleComponent,
        leftStartPosition
      })
    return this._parser
  }

  get simojiProgram() {
    return this.root.simojiPrograms[this.boardIndex]
  }

  get agentMap() {
    if (!this._agentMap) {
      this.compiledCode = yodash.compileAgentClassDeclarationsAndMap(this.simojiProgram)
      let evaled = {}
      try {
        evaled = eval(nodeJsPrefix + this.compiledCode)
      } catch (err) {
        console.log(this.compiledCode)
        console.error(err)
      }
      this._agentMap = evaled
    }
    return this._agentMap
  }

  get gridSize() {
    return parseInt(this.getWord(1))
  }

  get rows() {
    return parseInt(this.getWord(2))
  }

  get cols() {
    return parseInt(this.getWord(3))
  }

  get populationCsv() {
    const csv = new TreeNode(this._populationCounts).toCsv()
    // add 0's for missing values
    return csv
      .split("\n")
      .map(line =>
        line
          .split(",")
          .map(value => (value === "" ? "0" : value))
          .join(",")
      )
      .join("\n")
  }

  get populationCount() {
    const counts = {}
    this.agents.forEach(node => {
      const id = node.name
      const count = (counts[id] ?? 0) + 1
      counts[id] = count
    })
    return counts
  }

  _populationCounts = []

  runAtTimeEvents() {
    const blocks = this.timeMap.get(this.tick)
    if (blocks)
      blocks.forEach(block =>
        block
          .filter(node => node.doesExtend(NodeTypes.abstractInjectCommandNode))
          .forEach(command => this.runInjectCommand(command))
      )
  }

  insertAgentAtCommand(right, down) {
    const root = this.root
    const positionHash = down + " " + right
    this.resetWorldMap()
    const { agentToInsert } = root

    if (!agentToInsert) return

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    this.prependLine(`${agentToInsert} ${positionHash}`)
    this.renderAndGetRenderReport()
    this.resetWorldMap()

    if (!root.isSnapshotOn) root.snapShotCommand()

    const allCode = new TreeNode(root.simCode)
    let targetNode = root.boards.length === 1 ? allCode : allCode.findNodes("experiment")[this.boardIndex]

    if (this.tick) targetNode = targetNode.appendLine(`atTime ${this.tick}`)
    targetNode.appendLine(`insertAt ${agentToInsert} ${down} ${right}`)
    root.onSourceCodeChange(allCode)
  }

  get timeMap() {
    if (this._atTimes) return this._atTimes
    const map = new Map()
    this.simojiProgram.findNodes("atTime").forEach(node => {
      const tick = parseInt(node.getWord(1))
      if (!map.get(tick)) map.set(tick, [])
      map.get(tick).push(node)
    })
    this._atTimes = map
    return map
  }

  tick = 0
  boardLoop(render = true) {
    this.runAtTimeEvents()

    this.agents.forEach(node => node.onTick())

    this.resetWorldMap()
    this.handleCollisions()
    this.handleTouches()
    this.handleNeighbors()

    this.executeBoardCommands(Keywords.onTick)
    this.handleExtinctions()

    this.tick++
    this._populationCounts.push(this.populationCount)

    if (render) this.renderAndGetRenderReport()

    if (this.resetAfterLoop) {
      this.resetAfterLoop = false
      this.getRootNode().resetAllCommand()
    }
  }

  renderAndGetRenderReport(stumpNode, index) {
    const isMounted = this.isMounted()
    const report = super.renderAndGetRenderReport(stumpNode, index)
    if (!isMounted) this.appendAgents(this.agents)
    else this.updateAgents()
    return report
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return
    jQuery(this.getStumpNode().getShadow().element).on("click", ".Agent", function(evt) {
      const agent = evt.target
      const id = parseInt(
        jQuery(agent)
          .attr("id")
          .replace("agent", "")
      )
      that.getAgent(id).toggleSelectCommand()
    })
  }

  getAgent(uid) {
    return this.agents.find(agent => agent._getUid() === uid)
  }

  appendAgents(agents) {
    if (!agents.length) return this

    if (this.isNodeJs()) return

    const fragment = document.createDocumentFragment()
    agents.forEach(agent => fragment.appendChild(agent.toElement()))
    this._htmlStumpNode.getShadow().element.prepend(fragment)
    agents.forEach(agent => (agent.painted = true))
  }

  updateAgents() {
    const lastRenderedTime = this._getLastRenderedTime()
    this.agents
      .filter(agent => agent.painted && agent.needsUpdate(lastRenderedTime))
      .forEach(agent => agent._updateHtml())
    this.appendAgents(this.agents.filter(agent => !agent.painted))
  }

  get root() {
    return this.getParent()
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get(Keywords.ticksPerSecond)
    return setTime ? parseInt(setTime) : 10
  }

  runInjectCommand(command) {
    this[command.getNodeTypeId()](command)
  }

  insertClusterNode(commandNode) {
    this.concat(
      this.worldMap.insertClusteredRandomAgents(
        parseInt(commandNode.getWord(1)),
        commandNode.getWord(2),
        commandNode.getWord(3),
        commandNode.getWord(4)
      )
    )
    this.resetWorldMap()
  }

  insertAtNode(commandNode) {
    this.appendLine(`${commandNode.getWord(1)} ${commandNode.getWord(3)} ${commandNode.getWord(2)}`)
    this.resetWorldMap()
  }

  rectangleDrawNode(commandNode) {
    const newLines = this.worldMap.makeRectangle(...yodash.parseInts(commandNode.getWords().slice(1), 1))
    this.concat(newLines)
    this.resetWorldMap()
  }

  pasteDrawNode(commandNode) {
    const newSpots = new TreeNode(commandNode.childrenToString())
    this.concat(newSpots)
    this.resetWorldMap()
  }

  fillNode(commandNode) {
    this.concat(this.worldMap.fill(commandNode.getWord(1)))
    this.resetWorldMap()
  }

  drawNode(commandNode) {
    this.concat(this.worldMap.draw(commandNode.childrenToString()))
    this.resetWorldMap()
  }

  get seed() {
    if (!this._seed)
      this._seed = this.simojiProgram.has(Keywords.seed) ? parseInt(this.simojiProgram.get(Keywords.seed)) : newSeed()
    return this._seed
  }

  get randomNumberGenerator() {
    if (!this._rng) this._rng = yodash.getRandomNumberGenerator(this.seed)
    return this._rng
  }

  insertNode(commandNode) {
    const { rows, cols, worldMap } = this
    const emoji = commandNode.getWord(2)
    let amount = commandNode.getWord(1)

    const availableSpots = this.worldMap.getAllAvailableSpots()
    amount = amount.includes("%") ? yodash.parsePercent(amount) * (rows * cols) : parseInt(amount)
    const newAgents = yodash
      .sampleFrom(availableSpots, amount, this.randomNumberGenerator)
      .map(spot => `${emoji} ${spot.hash}`)
      .join("\n")
    this.concat(newAgents)
    this.resetWorldMap()
  }

  handleExtinctions() {
    this.simojiProgram.findNodes(Keywords.onExtinct).forEach(commands => {
      const emoji = commands.getWord(1)
      if (emoji && this.has(emoji)) return
      commands.forEach(instruction => {
        this[instruction.getWord(0)](instruction)
      })
    })
  }

  executeBoardCommands(key) {
    this.simojiProgram.findNodes(key).forEach(commands => {
      const probability = commands.getWord(1)
      if (probability && this.randomNumberGenerator() > parseFloat(probability)) return
      commands.forEach(instruction => {
        this[instruction.getWord(0)](instruction)
      })
    })
  }

  get agents() {
    return this.getTopDownArray().filter(node => node instanceof Agent)
  }

  get agentTypeMap() {
    const map = new Map()
    this.agents.forEach(node => {
      const { name } = node
      if (!map.has(name)) map.set(name, [])
      map.get(name).push(node)
    })
    return map
  }

  get worldMap() {
    if (!this._worldMap) this.resetWorldMap()
    return this._worldMap
  }

  resetWorldMap() {
    this._worldMap = new WorldMap(this)
  }

  // YY
  handleCollisions() {
    this.worldMap.collidingAgents.forEach(agents => agents.forEach(agent => agent.handleCollisions(agents)))
  }

  // YY
  handleTouches() {
    this.agents.forEach(node => node.handleTouches())
  }

  // YY
  handleNeighbors() {
    this.agents.forEach(node => node.handleNeighbors())
  }

  get boardIndex() {
    return parseInt(this.getWord(4))
  }

  get hasMultipleBoards() {
    return this.root.simojiPrograms.length > 1
  }

  get leftStartPosition() {
    return this.getNode("leftStartPosition")?.width ?? 250
  }

  get multiboardTransforms() {
    if (!this.hasMultipleBoards) return ""

    const positions = {
      0: "top left",
      1: "top right",
      2: "bottom left",
      3: "bottom right"
    }
    const translate = positions[this.boardIndex]
    return `transform:scale(0.5);transform-origin:${translate};`
  }

  get style() {
    return `left:calc(10px + ${this.leftStartPosition}px);${this.multiboardTransforms}`
  }

  toStumpCode() {
    const id = `board{this._getUid()}`
    const tickDuration = 1.0 / this.ticksPerSecond
    return `div
 style ${this.style}
 id ${id}
 styleTag
  bern
   #${id} .Agent {transition: all ${tickDuration}s linear;}
 div ${this.experimentTitle}
  class BoardTitle
 class ${this.getCssClassNames().join(" ")}`
  }

  get experimentTitle() {
    if (!this.hasMultipleBoards) return ""
    return this.root.mainExperiment.findNodes(Keywords.experiment)[this.boardIndex].getContent() ?? ""
  }

  startInterval() {
    this.interval = setInterval(() => this.boardLoop(), 1000 / this.ticksPerSecond)
  }

  stopInterval() {
    clearInterval(this.interval)
    this.interval = undefined
  }

  get isRunning() {
    return !!this.interval
  }

  skipToThisManyTicksIfNotPaused(ticks) {
    this.interval = true
    for (let i = 0; i <= ticks; i++) {
      this.boardLoop(false)
      if (!this.isRunning) break
    }
    this.renderAndGetRenderReport()
  }

  runUntilPause() {
    this.interval = true
    while (this.interval) {
      this.boardLoop()
      if (this.tick % 100 === 0) console.log(`Tick ${this.tick}`)
    }
  }

  // Commands available to users:

  spawn(command) {
    this.appendLine(`${command.getWord(1)} ${this.worldMap.getRandomLocationHash()}`)
  }

  alert(command) {
    const message = command.getContent()
    if (!this.isNodeJs())
      // todo: willow should shim this
      alert(message)
    else this.root.log(message)
  }

  pause() {
    const { isRunning } = this
    this.stopInterval()
    if (isRunning) this.root.onBoardPause() // ensure playbutton has updated if needed
  }

  reset() {
    this.resetAfterLoop = true
  }

  log(command) {
    this.root.log(command.getContent())
  }
}

class BoardStyleComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(TreeNode)
  }

  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

let _defaultSeed = Date.now()
const newSeed = () => {
  _defaultSeed++
  return _defaultSeed
}

module.exports = { BoardComponent }
