class Bounds {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  intersects(range) {
    return !(
      range.x >= this.x + this.w ||
      range.y >= this.y + this.h ||
      range.x + range.w <= this.x ||
      range.y + range.h <= this.y
    )
  }
}

class Quadtree {
  constructor(bounds, capacity, maxDepth = 10) {
    this.bounds = new Bounds(bounds.x, bounds.y, bounds.w, bounds.h)
    this.capacity = capacity
    this.maxDepth = maxDepth
    this.agents = []
  }

  get agentCount() {
    let count = 0

    if (this.isLeaf()) {
      count += this.agents.length
    } else {
      for (const child of this.children) {
        count += child.agentCount
      }
    }

    return count
  }

  insert(agent, depth = 0) {
    if (!this.bounds.intersects(agent)) return false

    if (!this.divided && (this.agents.length < this.capacity || depth >= this.maxDepth)) {
      this.agents.push(agent)
      return true
    } else {
      if (!this.divided) this.divide()
      for (const child of this.children) {
        if (child.insert(agent, depth + 1)) return true
      }
    }
    return false
  }

  isLeaf() {
    return !this.divided
  }

  get northWest() {
    return this.children[0]
  }

  get northEast() {
    return this.children[1]
  }

  get southWest() {
    return this.children[2]
  }

  get southEast() {
    return this.children[3]
  }

  prettyPrint(depth = 0) {
    let output = ""

    if (this.isLeaf()) {
      output += "-".repeat(depth - 1)
      output += `[${this.bounds.x}, ${this.bounds.y}, ${this.bounds.w}, ${this.bounds.h}]: `
      output += this.agents.map(agent => agent.id).join(", ")
      output += "\n"
    } else {
      output += this.northWest.prettyPrint(depth + 1)
      output += this.northEast.prettyPrint(depth + 1)
      output += this.southWest.prettyPrint(depth + 1)
      output += this.southEast.prettyPrint(depth + 1)
    }

    return output
  }

  get divided() {
    return !!this.children
  }

  divide() {
    const { x, y } = this.bounds
    const { bounds, capacity } = this
    const w = bounds.w / 2
    const h = bounds.h / 2

    this.children = [
      new Quadtree({ x, y, w, h }, capacity),
      new Quadtree({ x: x + w, y, w, h }, capacity),
      new Quadtree({ x, y: y + h, w, h }, capacity),
      new Quadtree({ x: x + w, y: y + h, w, h }, capacity)
    ]

    for (const agent of this.agents) this.insert(agent)
    delete this.agents
  }

  query(range, found = []) {
    if (!this.bounds.intersects(range)) return found

    if (!this.divided) {
      for (const agent of this.agents) if (range.intersects(agent)) found.push(agent)
    } else {
      for (const child of this.children) child.query(range, found)
    }

    return found
  }
}

class CollisionDetector {
  constructor(agents, worldWidth, worldHeight) {
    this.agents = agents
    this.width = worldWidth
    this.height = worldHeight
    this.quadtree = new Quadtree({ x: 0, y: 0, w: worldWidth, h: worldHeight }, 4)
    for (const agent of this.agents) this.addAgent(agent)
  }

  addAgent(agent) {
    this.quadtree.insert(agent)
    return this
  }

  isSpotAvailable(x, y, width, height) {
    const searchBounds = new Bounds(x, y, width, height)

    const nearbyAgents = this.quadtree.query(searchBounds)

    for (const agent of nearbyAgents) {
      if (x < agent.x + agent.width && x + width > agent.x && y < agent.y + agent.height && y + height > agent.y) {
        return false
      }
    }
    return true
  }

  findNonOverlappingSquares(width, height, N) {
    const nonOverlappingSquares = []
    const availableCells = []

    // Divide the world into cells
    for (let x = 0; x < this.width - width; x += width) {
      for (let y = 0; y < this.height - height; y += height) {
        if (this.isSpotAvailable(x, y, width, height)) availableCells.push({ x, y })
      }
    }

    // Randomly select non-overlapping cells
    while (nonOverlappingSquares.length < N && availableCells.length) {
      const randomIndex = Math.floor(Math.random() * availableCells.length)
      nonOverlappingSquares.push(availableCells[randomIndex])
      availableCells.splice(randomIndex, 1)
    }
    return nonOverlappingSquares
  }

  findClusteredNonOverlappingSquares(width, height, N, centerX, centerY, clusterRadius) {
    const nonOverlappingSquares = []
    const availableCells = []

    // Divide the world into cells and filter by clusterRadius
    for (let x = 0; x < this.width - width; x += width) {
      for (let y = 0; y < this.height - height; y += height) {
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= clusterRadius && this.isSpotAvailable(x, y, width, height)) {
          availableCells.push({ x: x, y: y })
        }
      }
    }

    // Randomly select non-overlapping cells
    while (nonOverlappingSquares.length < N && availableCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCells.length)
      nonOverlappingSquares.push(availableCells[randomIndex])
      availableCells.splice(randomIndex, 1)
    }

    return nonOverlappingSquares
  }

  getCollidingAgents(x, y, width, height) {
    const collidingAgents = []
    const queryBounds = new Bounds(x, y, width, height)
    const nearbyAgents = this.quadtree.query(queryBounds)

    for (const agent of nearbyAgents) {
      if (queryBounds.intersects(agent)) collidingAgents.push(agent)
    }

    return collidingAgents
  }

  detectCollisions() {
    let collissions = []

    for (const agentA of this.agents) {
      const searchBounds = new Bounds(
        agentA.x - agentA.width,
        agentA.y - agentA.height,
        agentA.width * 2,
        agentA.height * 2
      )
      const nearbyAgents = this.quadtree.query(searchBounds)
      for (const agentB of nearbyAgents) {
        if (agentA !== agentB && this.checkCollision(agentA, agentB)) collissions.push([agentA, agentB])
      }
    }
    return collissions
  }

  checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }
}

module.exports = { CollisionDetector }
