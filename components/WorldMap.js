const { yodash } = require("../yodash.js")

const PositionHashType = "10⬇️ 10➡️"

class PositionType {
  down = 10
  right = 10
}

class RectType {
  positionHash = PositionHashType
  position = new PositionType()
  agentSize = 10
}

class BoardType {
  agents = [new RectType()]
  randomNumberGenerator = yodash.getRandomNumberGenerator()
  rows = 10
  cols = 10
}

class WorldMap {
  board = new BoardType()

  constructor(boardType) {
    this.board = boardType
  }

  get rows() {
    return this.board.rows
  }

  get cols() {
    return this.board.cols
  }

  get randomNumberGenerator() {
    return this.board.randomNumberGenerator
  }

  isRectOccupied(right, down, size) {
    return this.objectsCollidingWith(right, down, size).length > 0
  }

  objectsCollidingWith(right, down, size) {
    return this.board.agents.filter(agent => {
      const { position, agentSize } = agent
      const { right: agentRight, down: agentDown } = position

      return (
        agentRight + agentSize > right &&
        agentDown + agentSize > down &&
        agentRight < right + size &&
        agentDown < down + size
      )
    })
  }

  // ZZZ
  objectsTouching(rect) {
    const { position, agentSize } = rect
    const targets = []
    for (let pos of this.positionsAdjacentToRect(position.right, position.down, agentSize)) {
      this.objectsCollidingWith(pos.right, pos.down, agentSize).forEach(item => targets.push(item))
    }
    return targets
  }

  // ZZZ
  canGoHere(size, right, down) {
    const agentsHere = this.objectsCollidingWith(right, down, size)
    if (agentsHere && agentsHere.some(agent => agent.solid)) return false

    return true
  }

  // ZZZ
  get collidingAgents() {
    const agents = this.board.agents
    const collidingAgents = []
    for (let agent of agents) {
      const { position, agentSize } = agent
      const agentsHere = this.objectsCollidingWith(position.right, position.down, agentSize).filter(a => a !== agent)
      if (agentsHere.length) collidingAgents.push(...agentsHere)
    }
    return collidingAgents
  }

  makePositionHash(positionType) {
    return `${positionType.down + "⬇️ " + positionType.right + "➡️"}`
  }

  getRandomLocationHash(size = 1) {
    const { right, down } = this.getRandomLocation()
    if (this.isRectOccupied(right, down, size)) return this.getRandomLocationHash()
    return this.makePositionHash({ right, down })
  }

  parsePosition(words) {
    return {
      down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
      right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
    }
  }

  insertClusteredRandomAgents(amount, char, originRow, originColumn) {
    const availableSpots = this.getAllAvailableSpots()
    const spots = yodash.sampleFrom(availableSpots, amount * 10, this.randomNumberGenerator)
    const origin = originColumn
      ? { down: parseInt(originRow), right: parseInt(originColumn) }
      : this.getRandomLocation()
    const sortedByDistance = lodash.sortBy(spots, spot =>
      math.distance([origin.down, origin.right], [spot.down, spot.right])
    )

    return sortedByDistance
      .slice(0, amount)
      .map(spot => `${char} ${spot.hash}`)
      .join("\n")
  }

  getAllAvailableSpots(size = 1, rowStart = 0, colStart = 0) {
    const { rows, cols } = this
    const availablePositions = []
    let down = rows
    while (down >= rowStart) {
      let right = cols
      while (right >= colStart) {
        if (!this.isRectOccupied(right, down, size))
          availablePositions.push({ right, down, hash: this.makePositionHash({ right, down }) })
        right--
      }
      down--
    }
    return availablePositions
  }

  getRandomLocation() {
    const { randomNumberGenerator, rows, cols } = this
    const maxRight = cols
    const maxBottom = rows
    const right = Math.round(randomNumberGenerator() * maxRight)
    const down = Math.round(randomNumberGenerator() * maxBottom)
    return { right, down }
  }

  draw(str) {
    const lines = str.split("\n")
    const output = []
    for (let index = 0; index < lines.length; index++) {
      const words = lines[index].split(" ")
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex]
        if (word !== "") output.push(`${word} ${this.makePositionHash({ down: index, right: wordIndex })}`)
      }
    }
    return output.join("\n")
  }

  makeRectangle(character = "🧱", width = 20, height = 20, startRight = 0, startDown = 0) {
    if (width < 1 || height < 1) {
      return ""
    }
    const cells = []
    let row = 0
    while (row < height) {
      let col = 0
      while (col < width) {
        const isPerimeter = row === 0 || row === height - 1 || col === 0 || col === width - 1
        if (isPerimeter)
          cells.push(
            `${character} ${this.makePositionHash({
              down: startDown + row,
              right: startRight + col
            })}`
          )
        col++
      }
      row++
    }
    return cells.join("\n")
  }

  fill(emoji, size = 1) {
    let { rows, cols } = this
    const board = []
    while (rows >= 0) {
      let col = cols
      while (col >= 0) {
        col--
        if (this.isRectOccupied(col, rows, size)) continue
        const hash = this.makePositionHash({ right: col, down: rows })
        board.push(`${emoji} ${hash}`)
      }
      rows--
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

module.exports = { WorldMap, BoardType }
