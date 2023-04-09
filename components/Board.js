const { TreeNode } = require("jtree/products/TreeNode.js")
const { yodash } = require("../yodash.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { GridComponent } = require("./Grid.js")
const { Agent } = require("./Agent.js")
const { Keywords, ParserTypes } = require("./Types.js")

let nodeJsPrefix = ""

// prettier-ignore
/*NODE_JS_ONLY*/ nodeJsPrefix = `const { Agent } = require("${__dirname}/Agent.js");`

class BoardErrorParser extends AbstractTreeComponentParser {
  _isErrorParser() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: Board does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class leftStartPosition extends TreeNode {
  get width() {
    return parseInt(this.getWord(1))
  }
}

class BoardComponent extends AbstractTreeComponentParser {
  // override default parser creation.
  _getParser() {
    if (!this._parser)
      this._parser = new TreeNode.ParserCombinator(BoardErrorParser, {
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
    const csv = new TreeNode(this._populationCounts).asCsv
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
          .filter(node => node.doesExtend(ParserTypes.abstractInjectCommandParser))
          .forEach(command => this.runInjectCommand(command))
      )
  }

  insertAgentAtCommand(right, down) {
    const root = this.root
    const board = this
    const positionHash = down + " " + right
    board.resetAgentPositionMap()
    const { agentPositionMap } = board
    const existingObjects = agentPositionMap.get(positionHash) ?? []
    if (existingObjects.length) return root.toggleSelectCommand(existingObjects)
    const { agentToInsert } = root

    if (!agentToInsert) return

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    board.prependLine(`${agentToInsert} ${positionHash}`)
    board.renderAndGetRenderReport()
    board.resetAgentPositionMap()

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

    this.resetAgentPositionMap()
    this.handleOverlaps()
    this.handleTouches()
    this.handleNeighbors()

    this.executeBoardCommands(Keywords.onTick)
    this.handleExtinctions()

    this.tick++
    this._populationCounts.push(this.populationCount)

    if (render) this.renderAndGetRenderReport()

    if (this.resetAfterLoop) {
      this.resetAfterLoop = false
      this.root.resetAllCommand()
    }
  }

  renderAndGetRenderReport(stumpNode, index) {
    const isMounted = this.isMounted()
    const report = super.renderAndGetRenderReport(stumpNode, index)
    if (!isMounted) this.appendAgents(this.agents)
    else this.updateAgents()
    return report
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
    return this.parent
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get(Keywords.ticksPerSecond)
    return setTime ? parseInt(setTime) : 10
  }

  occupiedSpots = new Set()

  runInjectCommand(command) {
    this[command.parserId](command)
  }

  insertClusterParser(commandNode) {
    this.concat(
      yodash.insertClusteredRandomAgents(
        this.randomNumberGenerator,
        parseInt(commandNode.getWord(1)),
        commandNode.getWord(2),
        this.rows,
        this.cols,
        this.occupiedSpots,
        commandNode.getWord(3),
        commandNode.getWord(4)
      )
    )
  }

  insertAtParser(commandNode) {
    this.appendLine(`${commandNode.getWord(1)} ${commandNode.getWord(3)} ${commandNode.getWord(2)}`)
    // TODO: update occupied spots cache?
  }

  rectangleDrawParser(commandNode) {
    const newLines = yodash.makeRectangle(...yodash.parseInts(commandNode.words.slice(1), 1))
    this.concat(newLines)
    // TODO: update occupied spots cache?
  }

  pasteDrawParser(commandNode) {
    const newSpots = new TreeNode(commandNode.childrenToString())
    yodash.updateOccupiedSpots(newSpots, this.occupiedSpots)
    this.concat(newSpots)
  }

  fillParser(commandNode) {
    this.concat(yodash.fill(this.rows, this.cols, this.occupiedSpots, commandNode.getWord(1)))
  }

  drawParser(commandNode) {
    const { occupiedSpots } = this
    const spots = yodash.draw(commandNode.childrenToString())
    yodash.updateOccupiedSpots(spots, occupiedSpots)
    this.concat(spots)
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

  insertParser(commandNode) {
    const { rows, cols, occupiedSpots } = this
    const emoji = commandNode.getWord(2)
    let amount = commandNode.getWord(1)

    const availableSpots = yodash.getAllAvailableSpots(rows, cols, occupiedSpots)
    amount = amount.includes("%") ? yodash.parsePercent(amount) * (rows * cols) : parseInt(amount)
    const newAgents = yodash
      .sampleFrom(availableSpots, amount, this.randomNumberGenerator)
      .map(spot => {
        const { hash } = spot
        occupiedSpots.add(hash)
        return `${emoji} ${hash}`
      })
      .join("\n")
    this.concat(newAgents)
  }

  handleExtinctions() {
    this.simojiProgram.findNodes(Keywords.onExtinct).forEach(commands => {
      const emoji = commands.getWord(1)
      if (emoji && this.has(emoji)) return
      commands.forEach(instruction => {
        this[instruction.firstWord](instruction)
      })
    })
  }

  executeBoardCommands(key) {
    this.simojiProgram.findNodes(key).forEach(commands => {
      const probability = commands.getWord(1)
      if (probability && this.randomNumberGenerator() > parseFloat(probability)) return
      commands.forEach(instruction => {
        this[instruction.firstWord](instruction)
      })
    })
  }

  isSolidAgent(position) {
    if (!this._solidsSet) this.resetAgentPositionMap()
    const hash = yodash.makePositionHash(position)
    if (this._solidsSet.has(hash)) return true

    return false
  }

  get agents() {
    return this.topDownArray.filter(node => node instanceof Agent)
  }

  get agentPositionMap() {
    if (!this._agentPositionMap) this.resetAgentPositionMap()
    return this._agentPositionMap
  }

  resetAgentPositionMap() {
    const map = new Map()
    const solidsSet = new Set()
    this.agents.forEach(agent => {
      const { positionHash } = agent
      if (agent.solid) solidsSet.add(positionHash)
      if (!map.has(positionHash)) map.set(positionHash, [])
      map.get(positionHash).push(agent)
    })
    this._solidsSet = solidsSet
    this._agentPositionMap = map
    this.occupiedSpots = new Set(map.keys())
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

  handleOverlaps() {
    this.agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleOverlaps(nodes))
    })
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap
    this.agents.forEach(node => node.handleTouches(agentPositionMap))
  }

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
    return this.root.mainExperiment.findNodes(Keywords.experiment)[this.boardIndex].content ?? ""
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
    this.appendLine(
      `${command.getWord(1)} ${yodash.getRandomLocationHash(
        this.rows,
        this.cols,
        undefined,
        this.randomNumberGenerator
      )}`
    )
  }

  alert(command) {
    const message = command.content
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
    this.root.log(command.content)
  }
}

class BoardStyleComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(TreeNode)
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
