const { jtree } = require("jtree")
const { yodash } = require("../yodash.js")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { GridComponent } = require("./Grid.js")

class BoardComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, { ...this.getParent().agentMap, GridComponent, BoardStyleComponent })
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

  // todo: cleanup board vs agent commands
  alert(target, command) {
    alert(command.getContent())
  }

  pause() {
    this.getRootNode().pauseCommand()
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
  }

  spawn(subject, command) {
    this.appendLine(`${command.getWord(1)} ${yodash.getRandomLocationHash(this.rows, this.cols)}`)
  }

  handleExtinctions() {
    this.getParent()
      .simojiProgram.findNodes("onExtinct")
      .forEach(commands => {
        const emoji = commands.getWord(1)
        if (emoji && this.has(emoji)) return
        commands.forEach(instruction => {
          this[instruction.getWord(0)](this, instruction)
        })
      })
  }

  executeBoardCommands(key) {
    this.getParent()
      .simojiProgram.findNodes(key)
      .forEach(commands => {
        const probability = commands.getWord(1)
        if (probability && Math.random() > parseFloat(probability)) return
        commands.forEach(instruction => {
          this[instruction.getWord(0)](this, instruction)
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
    const { agentPositionMap } = this
    agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap

    this.agents.forEach(subject => {
      const { touchMap } = subject
      if (!touchMap) return

      for (let pos of yodash.positionsAdjacentTo(subject.position)) {
        const hits = agentPositionMap.get(yodash.makePositionHash(pos)) ?? []
        for (let target of hits) {
          const targetId = target.getWord(0)
          const instructions = touchMap.getNode(targetId)
          if (instructions) {
            instructions.forEach(instruction => {
              subject[instruction.getWord(0)](target, instruction)
            })
            if (subject.getIndex() === -1) return
          }
        }
      }
    })
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
