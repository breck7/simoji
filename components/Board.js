const { jtree } = require("jtree")
const { yodash } = require("../yodash.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { GridComponent } = require("./Grid.js")
const { Agent } = require("./Agent.js")

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

class BoardComponent extends AbstractTreeComponent {
  // override default parser creation.
  _getParser() {
    if (!this._parser)
      this._parser = new jtree.TreeNode.Parser(BoardErrorNode, { ...this.agentMap, GridComponent, BoardStyleComponent })
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

  tick = 0
  boardLoop() {
    this.agents.forEach(node => node.onTick())

    this._agentPositionMap = this.makeAgentPositionMap()
    this.handleCollisions()
    this.handleTouches()

    this.executeBoardCommands("onTick")
    this.handleExtinctions()

    this.renderAndGetRenderReport()

    this.tick++
    this._populationCounts.push(this.populationCount)

    if (this.resetAfterLoop) {
      this.resetAfterLoop = false
      this.getRootNode().resetAllCommand()
    }
  }

  get root() {
    return this.getParent()
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get("ticksPerSecond")
    return setTime ? parseInt(setTime) : 10
  }

  handleExtinctions() {
    this.simojiProgram.findNodes("onExtinct").forEach(commands => {
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

  isSolidAgent(position) {
    if (!this._solidsSet) {
      this._solidsSet = new Set()
      this.getTopDownArray()
        .filter(node => node.solid)
        .forEach(item => {
          this._solidsSet.add(item.positionHash)
        })
    }
    const hash = yodash.makePositionHash(position)
    if (this._solidsSet.has(hash)) return true

    return false
  }

  get agents() {
    return this.getTopDownArray().filter(node => node instanceof Agent)
  }

  get agentPositionMap() {
    if (!this._agentPositionMap) this._agentPositionMap = this.makeAgentPositionMap()
    return this._agentPositionMap
  }

  makeAgentPositionMap() {
    const map = new Map()
    this.agents.forEach(node => {
      const { positionHash } = node
      if (!map.has(positionHash)) map.set(positionHash, [])
      map.get(positionHash).push(node)
    })
    return map
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

  agentAt(position) {
    const hits = this.agentPositionMap.get(position)
    return hits ? hits[0] : undefined
  }

  handleCollisions() {
    this.agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap
    this.agents.forEach(node => node.handleTouches(agentPositionMap))
  }

  get boardIndex() {
    return parseInt(this.getWord(4))
  }

  get hasMultipleBoards() {
    return this.root.simojiPrograms.length > 1
  }

  toStumpCode() {
    if (!this.hasMultipleBoards) return super.toStumpCode()

    const positions = {
      0: "top left",
      1: "top right",
      2: "bottom left",
      3: "bottom right"
    }
    const translate = positions[this.boardIndex]
    return `div
 style transform:scale(0.5);transform-origin: ${translate};
 class ${this.getCssClassNames().join(" ")}`
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
    const message = command.getContent()
    if (typeof alert !== "undefined")
      // todo: willow should shim this
      alert(message)
    else this.root.log(message)
  }

  pause() {
    this.stopInterval()
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

module.exports = { BoardComponent }
