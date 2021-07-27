const { jtree } = require("jtree")
const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class BoardComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, this.getParent().agentMap)
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

    this.agents.filter(node => node.speed).forEach(node => node.turnCommand().loopMove())
    const { agentPositionMap } = this
    agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
    this.handleTouches()
    this.agents.forEach(node => node.onTick())

    const spawnNode = this.getRootNode().simojiProgram.getNode("spawn")
    if (spawnNode) yodash.spawnFunction(spawnNode, this, yodash.getRandomLocation(this.rows, this.cols))

    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())

    this.tick++
    this._populationCounts.push(this.populationCount)
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

  agentAt(position) {
    const hits = this.agentPositionMap.get(position)
    return hits ? hits[0] : undefined
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
}

class BoardStyleComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

module.exports = { BoardStyleComponent, BoardComponent }
