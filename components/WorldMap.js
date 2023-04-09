const { yodash } = require("../yodash.js")

class WorldMap {
  constructor(agents) {
    const map = new Map()
    agents.forEach(agent => {
      const { positionHash, agentSize } = agent
      if (!map.has(positionHash, agentSize)) map.set(positionHash, [])
      map.get(positionHash).push(agent)
    })
    this._map = map
  }

  get occupiedSpots() {
    return new Set(this._map.keys())
  }

  objectsAtPosition(positionHash) {
    return this._map.get(positionHash) ?? []
  }

  makePositionHash(position) {
    return `${position.down + "⬇️ " + position.right + "➡️"}`
  }

  getRandomLocationHash(rows, cols, randomNumberGenerator) {
    const { right, down } = this.getRandomLocation(rows, cols, randomNumberGenerator)
    const hash = this.makePositionHash({ right, down })
    if (this.occupiedSpots.has(hash)) return this.getRandomLocationHash(rows, cols, randomNumberGenerator)
    return hash
  }

  parsePosition(words) {
    return {
      down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
      right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
    }
  }

  canGoHere(position, size) {
    const hash = this.makePositionHash(position)
    const agentsHere = this._map.get(hash)
    if (agentsHere && agentsHere.some(agent => agent.solid)) return false

    return true
  }

  get overlappingAgents() {
    let overlaps = []
    this._map.forEach(nodes => {
      if (nodes.length > 1) overlaps.push(nodes)
    })
    return overlaps
  }

  insertClusteredRandomAgents(randomNumberGenerator, amount, char, rows, cols, originRow, originColumn) {
    const availableSpots = this.getAllAvailableSpots(rows, cols)
    const spots = yodash.sampleFrom(availableSpots, amount * 10, randomNumberGenerator)
    const origin = originColumn
      ? { down: parseInt(originRow), right: parseInt(originColumn) }
      : this.getRandomLocation(rows, cols, randomNumberGenerator)
    const sortedByDistance = lodash.sortBy(spots, spot =>
      math.distance([origin.down, origin.right], [spot.down, spot.right])
    )

    return sortedByDistance
      .slice(0, amount)
      .map(spot => `${char} ${spot.hash}`)
      .join("\n")
  }

  getAllAvailableSpots(rows, cols, rowStart = 0, colStart = 0) {
    const { occupiedSpots } = this
    const availablePositions = []
    let down = rows
    while (down >= rowStart) {
      let right = cols
      while (right >= colStart) {
        const hash = this.makePositionHash({ right, down })
        if (!occupiedSpots.has(hash)) availablePositions.push({ right, down, hash })
        right--
      }
      down--
    }
    return availablePositions
  }

  getRandomLocation(rows, cols, randomNumberGenerator) {
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

  fill(rows, cols, emoji) {
    const { occupiedSpots } = this
    const board = []
    while (rows >= 0) {
      let col = cols
      while (col >= 0) {
        const hash = this.makePositionHash({ right: col, down: rows })
        col--
        if (occupiedSpots.has(hash)) continue
        board.push(`${emoji} ${hash}`)
      }
      rows--
    }
    return board.join("\n")
  }

  getNeighborCount(position) {
    const neighborCounts = {}
    this.positionsAdjacentTo(position).forEach(pos => {
      const agents = this.objectsAtPosition(this.makePositionHash(pos))
      agents.forEach(agent => {
        if (!neighborCounts[agent.name]) neighborCounts[agent.name] = 0
        neighborCounts[agent.name]++
      })
    })
    return neighborCounts
  }

  positionsAdjacentTo(position) {
    let { right, down } = position
    const positions = []
    down--
    positions.push({ down, right })
    right--
    positions.push({ down, right })
    right++
    right++
    positions.push({ down, right })
    down++
    positions.push({ down, right })
    right--
    right--
    positions.push({ down, right })
    down++
    positions.push({ down, right })
    right++
    positions.push({ down, right })
    right++
    positions.push({ down, right })
    return positions
  }
}

module.exports = { WorldMap }
