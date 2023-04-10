class Bounds {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  contains(agent) {
    return (
      agent.x >= this.x &&
      agent.y >= this.y &&
      agent.x + agent.shape.width <= this.x + this.w &&
      agent.y + agent.shape.height <= this.y + this.h
    )
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
  constructor(bounds, capacity) {
    this.bounds = new Bounds(bounds.x, bounds.y, bounds.w, bounds.h)
    this.capacity = capacity
    this.agents = []
    this.divided = false
  }

  insert(agent) {
    if (!this.bounds.contains(agent)) return

    if (this.agents.length < this.capacity && !this.divided) {
      this.agents.push(agent)
    } else {
      if (!this.divided) this.subdivide()
      for (const child of this.children) child.insert(agent)
    }
  }

  subdivide() {
    const { x, y, w, h } = this.bounds
    const capacity = this.capacity

    this.children = [
      new Quadtree({ x, y, w: w / 2, h: h / 2 }, capacity),
      new Quadtree({ x: x + w / 2, y, w: w / 2, h: h / 2 }, capacity),
      new Quadtree({ x, y: y + h / 2, w: w / 2, h: h / 2 }, capacity),
      new Quadtree({ x: x + w / 2, y: y + h / 2, w: w / 2, h: h / 2 }, capacity)
    ]

    this.divided = true
    for (const agent of this.agents) this.insert(agent)
    this.agents = []
  }

  query(range, found = []) {
    if (!this.bounds.intersects(range)) return found

    if (!this.divided) {
      for (const agent of this.agents) if (range.contains(agent)) found.push(agent)
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
      if (
        x < agent.x + agent.shape.width &&
        x + width > agent.x &&
        y < agent.y + agent.shape.height &&
        y + height > agent.y
      ) {
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

  findClosestAvailableSpot(x, y, width, height, maxDistance = 100, step = 1) {
    for (let dist = 0; dist <= maxDistance; dist += step) {
      for (let angle = 0; angle < 360; angle += step) {
        const newX = x + dist * Math.cos(angle * (Math.PI / 180))
        const newY = y + dist * Math.sin(angle * (Math.PI / 180))

        if (this.isSpotAvailable(newX, newY, width, height)) {
          return { x: newX, y: newY }
        }
      }
    }
    return null
  }

  getCollidingAgents(x, y, width, height) {
    const bounds = new Bounds(x, y, width, height)
    const collidingAgents = []
    const nearbyAgents = this.quadtree.query(bounds)

    for (const agent of nearbyAgents) {
      if (
        bounds.x < agent.x + agent.shape.width &&
        bounds.x + bounds.w > agent.x &&
        bounds.y < agent.y + agent.shape.height &&
        bounds.y + bounds.h > agent.y
      ) {
        collidingAgents.push(agent)
      }
    }

    return collidingAgents
  }

  detectCollisions() {
    let collissions = []

    for (const agentA of this.agents) {
      const searchBounds = new Bounds(
        agentA.x - agentA.shape.width,
        agentA.y - agentA.shape.height,
        agentA.shape.width * 2,
        agentA.shape.height * 2
      )
      const nearbyAgents = this.quadtree.query(searchBounds)
      for (const agentB of nearbyAgents) {
        if (agentA !== agentB && this.checkCollision(agentA, agentB)) collissions.push([agentA, agentB])
      }
    }
    return collissions
  }

  checkCollision(a, b) {
    return (
      a.x < b.x + b.shape.width && a.x + a.shape.width > b.x && a.y < b.y + b.shape.height && a.y + a.shape.height > b.y
    )
  }
}

module.exports = { CollisionDetector }
