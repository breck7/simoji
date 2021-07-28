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
    return new TreeNode(this._populationCounts).toCsv()
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
    this.agents.filter(node => node.force).forEach(node => node.applyForceCommand())
    this.agents.filter(node => node.speed).forEach(node => node.loopMove())

    this.handleCollisions()
    this.handleTouches()

    this.agents.forEach(node => node.onTick())

    this.executeCommands("onTick")

    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())

    this.tick++
    this._populationCounts.push(this.populationCount)
  }

  spawn(subject, command) {
    this.appendLine(`${command.getWord(1)} ${yodash.getRandomLocation(this.rows, this.cols)}`)
  }

  executeCommands(key) {
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
  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

module.exports = { BoardComponent }
