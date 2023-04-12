const { TreeNode } = require("jtree/products/TreeNode.js")
const { yodash } = require("../yodash.js")
const { AbstractTreeComponentParser } = require("jtree/products/TreeComponentFramework.node.js")
const { GridComponent } = require("./Grid.js")
const { CollisionDetector } = require("./CollisionDetector.js")
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
    return 1
  }

  get width() {
    if (this._width === undefined) this._width = parseInt(this.getWord(2))
    return this._width
  }

  get height() {
    if (this._height === undefined) this._height = parseInt(this.getWord(3))
    return this._height
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

  insertAgentAtCommand(xCenter, yCenter) {
    const root = this.root
    const { agentToInsert } = root
    if (!agentToInsert) return
    this.clearCollisionDetector()

    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentToInsert)

    const x = xCenter - Math.floor(agentWidth / 2)
    const y = yCenter - Math.floor(agentHeight / 2)

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    this.prependLine(`${agentToInsert} ${x} ${y}`)
    this.renderAndGetRenderReport()
    this.clearCollisionDetector()

    const allCode = new TreeNode(root.simCode)
    let targetNode = root.boards.length === 1 ? allCode : allCode.findNodes("experiment")[this.boardIndex]

    if (this.tick) targetNode = targetNode.appendLine(`atTime ${this.tick}`)
    targetNode.appendLine(`insertAt ${agentToInsert} ${x} ${y}`)
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

    this.clearCollisionDetector()
    this.handleCollisions()
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

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return
    jQuery(this.getStumpNode().getShadow().element).on("click", ".Agent", function (evt) {
      const agent = evt.target
      const id = parseInt(jQuery(agent).attr("id").replace("agent", ""))
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
    return this.parent
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get(Keywords.ticksPerSecond)
    return setTime ? parseInt(setTime) : 10
  }

  runInjectCommand(command) {
    this[command.parserId](command)
  }

  getAgentHeightAndWidth(agentSymbol) {
    const item = new this.agentMap[agentSymbol]()
    return { agentWidth: item.width, agentHeight: item.height }
  }

  insertInbounds(agentSymbol, x, y) {
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const xOver = x + agentWidth - this.width
    const yOver = y + agentHeight - this.height
    if (xOver > 0) x = x - xOver - 10
    if (yOver > 0) y = y - yOver - 10
    if (x < 0) x = 0
    if (y < 0) y = 0
    this.appendLine(`${agentSymbol} ${x} ${y}`)
  }

  // todo: origin
  insertClusteredRandomAgents(amount, agentSymbol, x = 0, y = 0) {
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const spots = this.collisionDetector.findClusteredNonOverlappingSquares(
      agentWidth,
      agentHeight,
      amount,
      x,
      y,
      (amount * agentWidth) / 4
    )
    return spots.map(spot => `${agentSymbol} ${spot.x} ${spot.y}`).join("\n")
  }

  insertClusterParser(commandNode) {
    this.concat(
      this.insertClusteredRandomAgents(
        parseInt(commandNode.getWord(1)),
        commandNode.getWord(2),
        commandNode.getWord(3),
        commandNode.getWord(4)
      )
    )
    this.clearCollisionDetector()
  }

  insertAtParser(commandNode) {
    this.appendLine(`${commandNode.getWord(1)} ${commandNode.getWord(2)} ${commandNode.getWord(3)}`)
    this.clearCollisionDetector()
  }

  rectangleDrawParser(commandNode) {
    // todo: need a typed words method in jtree
    // rectangle 🙂 width height x y 🙂
    const [command, agentSymbol, width, height, x, y, fillSymbol, spacing] = commandNode.words

    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)

    const options = {
      agentSymbol,
      width: parseInt(width),
      height: parseInt(height),
      x: x ? parseInt(x) : 0,
      y: y ? parseInt(y) : 0,
      fillSymbol,
      spacing: spacing || 0,
      agentHeight,
      agentWidth
    }

    const newLines = this.makeRectangle(options)
    this.concat(newLines)
    this.clearCollisionDetector()
  }

  pasteDrawParser(commandNode) {
    const newSpots = new TreeNode(commandNode.childrenToString())
    this.concat(newSpots)
    this.clearCollisionDetector()
  }

  fillParser(commandNode) {
    this.concat(this.fill(commandNode.getWord(1)))
    this.clearCollisionDetector()
  }

  drawParser(commandNode) {
    this.concat(this.draw(commandNode.childrenToString()))
    this.clearCollisionDetector()
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
    const { width, height } = this
    const agentSymbol = commandNode.getWord(2)
    let amount = commandNode.getWord(1)
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const maxCells = (width * height) / (agentWidth * agentHeight)
    amount = amount.includes("%") ? yodash.parsePercent(amount) * maxCells : parseInt(amount)

    const spots = this.collisionDetector.findNonOverlappingSquares(agentWidth, agentHeight, amount)

    const newAgents = spots.map(spot => `${agentSymbol} ${spot.x + " " + spot.y}`).join("\n")

    this.concat(newAgents)
    this.clearCollisionDetector()
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

  get agents() {
    return this.topDownArray.filter(node => node instanceof Agent)
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

  clearCollisionDetector() {
    delete this._collisionDetector
    delete this._solidCollisionDetector
  }

  _collisionDetector
  get collisionDetector() {
    if (!this._collisionDetector) this._collisionDetector = new CollisionDetector(this.agents, this.width, this.height)
    return this._collisionDetector
  }

  handleCollisions() {
    const collisions = this.collisionDetector.detectCollisions()
    collisions.forEach(collision => {
      const [agentA, agentB] = collision
      agentA.handleCollisions([agentB])
      agentB.handleCollisions([agentA])
    })
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
    this.appendLine(`${command.getWord(1)} ${this.getRandomLocationHash()}`)
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

  isRectOccupied(x, y, width, height) {
    return !this.collisionDetector.isSpotAvailable(x, y, width, height)
  }

  objectsCollidingWith(x, y, width, height) {
    return this.collisionDetector.getCollidingAgents(x, y, width, height)
  }

  _solidCollisionDetector
  get solidCollisionDetector() {
    if (!this._solidCollisionDetector)
      this._solidCollisionDetector = new CollisionDetector(
        this.agents.filter(agent => agent.solid),
        this.width,
        this.height
      )
    return this._solidCollisionDetector
  }

  canGoHere(x, y, width, height) {
    const blockersHere = this.solidCollisionDetector.getCollidingAgents(x, y, width, height)
    if (blockersHere.length) return false

    return true
  }

  get collidingAgents() {
    const agents = this.agents
    const collidingAgents = []
    for (let agent of agents) {
      const { position, agentSize } = agent
      const agentsHere = this.objectsCollidingWith(position.x, position.y, agentSize).filter(a => a !== agent)
      if (agentsHere.length) collidingAgents.push(...agentsHere)
    }
    return collidingAgents
  }

  makePositionHash(positionType) {
    return `${positionType.x + " " + positionType.y}`
  }

  getRandomLocationHash(size = 1) {
    const { x, y } = this.getRandomLocation()
    if (this.isRectOccupied(x, y, size, size)) return this.getRandomLocationHash()
    return this.makePositionHash({ x, y })
  }

  getRandomLocation() {
    const { randomNumberGenerator, height, width } = this
    const maxRight = width
    const maxBottom = height
    const x = Math.round(randomNumberGenerator() * maxRight)
    const y = Math.round(randomNumberGenerator() * maxBottom)
    return { x, y }
  }

  draw(str) {
    const lines = str.split("\n")
    const output = []
    let agentWidth
    let agentHeight
    for (let index = 0; index < lines.length; index++) {
      const words = lines[index].split(" ")
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const agentSymbol = words[wordIndex]
        if (agentSymbol && !agentWidth) {
          // Draw assumes everything being drawn is a square with sides N.
          agentWidth = this.getAgentHeightAndWidth(agentSymbol).agentWidth
          agentHeight = agentWidth
        }

        if (agentSymbol !== "")
          output.push(`${agentSymbol} ${this.makePositionHash({ y: index * agentHeight, x: wordIndex * agentHeight })}`)
      }
    }
    return output.join("\n")
  }

  makeRectangle(options) {
    const { width, height, agentSymbol, x, y, fillSymbol, spacing, agentHeight, agentWidth } = options

    if (width < 1 || height < 1) return ""

    if (isNaN(x)) x = 20
    if (isNaN(y)) y = 20

    const cells = []
    let row = 0
    while (row < height) {
      let col = 0
      while (col < width) {
        const isPerimeter = row === 0 || row === height - 1 || col === 0 || col === width - 1
        if (!fillSymbol && !isPerimeter) {
          col++
          continue
        }

        cells.push(
          `${isPerimeter ? agentSymbol : fillSymbol} ${x + col * (agentWidth + spacing)} ${
            y + row * (agentHeight + spacing)
          }`
        )
        col++
      }
      row++
    }
    return cells.join("\n")
  }

  fill(agentSymbol) {
    let { width, height } = this
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const board = []
    let y = 0
    while (y < height - agentHeight) {
      let x = 0
      while (x < width - agentWidth) {
        if (this.isRectOccupied(x, y, agentWidth, agentHeight)) {
          x += agentWidth
          continue
        }
        board.push(`${agentSymbol} ${x} ${y}`)
        x += agentWidth
      }
      y += agentHeight
    }
    return board.join("\n")
  }

  getNeighborCount(rect) {
    const { position, agentSize } = rect
    const neighborCounts = {}
    this.positionsAdjacentToRect(position.right, position.down, agentSize).forEach(pos => {
      const agents = this.objectsCollidingWith(pos.right, pos.down, agentSize)
      agents.forEach(agent => {
        if (!neighborCounts[agent.name]) neighborCounts[agent.name] = 0
        neighborCounts[agent.name]++
      })
    })
    return neighborCounts
  }

  positionsAdjacentToRect(x, y, size) {
    const positions = []
    for (let row = y - size; row <= y + size; row++) {
      for (let col = x - size; col <= x + size; col++) {
        if (row === y && col === x) continue
        positions.push({ right: col, down: row })
      }
    }
    return positions
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
