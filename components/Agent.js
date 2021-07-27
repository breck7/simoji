const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class Agent extends AbstractTreeComponent {
  get solid() {
    return this.agentDefinition.has("solid")
  }

  get bouncy() {
    return this.agentDefinition.has("bouncy")
  }

  get hasRoutines() {
    return this.agentDefinition.has("spawns")
  }

  get icon() {
    return this.agentDefinition.getWord(0)
  }

  get name() {
    return this._name ?? this.icon
  }

  get mass() {
    return this.agentDefinition.get("mass") ?? 1
  }

  get turnInstruction() {
    return this._turnInstruction ?? this.agentDefinition.has("turnRandomly") ? "turnRandomly" : undefined
  }

  set turnInstruction(value) {
    this._turnInstruction = value
  }

  get force() {
    if (this._force !== undefined) return this._force
    return this.agentDefinition.get("force") ?? 0
  }

  set force(value) {
    this._force = value
  }

  get acceleration() {
    return this.force / this.mass
  }

  get speed() {
    if (this._speed !== undefined) return this._speed
    const speed = this.agentDefinition.get("speed")
    return speed ? parseInt(speed) : 0
  }

  set speed(value) {
    this._speed = value
  }

  get diameter() {
    return this.agentDefinition.get("diameter") ?? 1
  }

  get angle() {
    return this._angle ?? this.agentDefinition.get("angle") ?? "South"
  }

  set angle(value) {
    this._angle = value
  }

  get health() {
    if (this._health !== undefined) return this._health
    const health = this.agentDefinition.get("health")
    return health ? parseInt(health) : Infinity
  }

  set health(value) {
    this._health = value
  }

  get agentDefinition() {
    return this.root.simojiProgram.getNode(this.getWord(0))
  }

  replaceWith(target, newObject) {
    this.getParent().appendLine(`${newObject} ${this.positionHash}`)
    this.unmountAndDestroy()
  }

  kickIt(target) {
    target.speed = 1
    target.turnInstruction = false
    target.angle = this.angle
    target.moveCommand()
  }

  pickItUp(target) {
    target.owner = this
    if (!this.holding) this.holding = []
    this.holding.push(target)
  }

  bounce() {
    this.angle = yodash.flipAngle(this.angle)
  }

  alert(target, message) {
    alert(message)
  }

  pause(target, message) {
    this.root.pauseCommand()
  }

  get touchMap() {
    return this.agentDefinition.getNode("ifTouches")
  }

  handleCollisions(targets) {
    const commandMap = this.agentDefinition.getNode("ifHits")
    if (!commandMap) return

    return yodash.applyCommandMap(commandMap, targets, this)
  }

  turnCommand() {
    if (this.turnInstruction === "turnRandomly") this.angle = yodash.getRandomAngle()
    return this
  }

  loopMove() {
    if (this.selected) return
    return this.moveCommand()
  }

  loopRoutine() {
    if (this.hasRoutines) this.spawnCommand()

    if (this.health !== Infinity) {
      if (!this._startHealth) this._startHealth = this.health
      this.health--
      this.markDirty()
      if (!this.health) this.unmountAndDestroy()
    }
  }

  markDirty() {
    this.setWord(5, Date.now())
  }

  spawnCommand() {
    yodash.spawnFunction(this.agentDefinition.getNode("spawns"), this.getParent(), this.positionHash)
  }

  applyForceCommand() {
    if (this.force) {
      this.speed += this.acceleration
      this.force = 0
    }
  }

  moveCommand() {
    if (this.owner) return this

    let moves = this.speed
    while (moves) {
      const { angle } = this
      if (angle.includes("North")) this.moveNorthCommand()
      else if (angle.includes("South")) this.moveSouthCommand()
      if (angle.includes("East")) this.moveEastCommand()
      else if (angle.includes("West")) this.moveWestCommand()
      moves--
    }

    if (this.holding) {
      this.holding.forEach(node => {
        node.position = { right: this.left, down: this.top }
      })
    }
  }

  moveSouthCommand() {
    this.top++
  }

  moveNorthCommand() {
    this.top--
  }

  moveWestCommand() {
    this.left--
  }

  moveEastCommand() {
    this.left++
  }

  get top() {
    return this.position.down
  }

  set top(value) {
    if (value > this.maxDown) value = this.maxDown
    if (value < 0) value = 0
    this.position = {
      down: value,
      right: this.left
    }
  }

  get root() {
    return this.getRootNode()
  }

  set position(value) {
    if (this.board.isSolidAgent(value)) return this.bouncy ? this.bounce() : this
    const newLine = this.getLine()
      .split(" ")
      .map(part => (part.includes("⬇️") ? value.down + "⬇️" : part.includes("➡️") ? value.right + "➡️" : part))
      .join(" ")
    return this.setLine(newLine)
  }

  get board() {
    return this.getParent()
  }

  get maxRight() {
    return this.board.cols
  }

  get maxDown() {
    return this.board.rows
  }

  set left(value) {
    if (value > this.maxRight) value = this.maxRight

    if (value < 0) value = 0
    this.position = {
      down: this.top,
      right: value
    }
  }

  get left() {
    return this.position.right
  }

  get position() {
    const words = this.getWords()
    return {
      down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
      right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
    }
  }

  get positionHash() {
    return yodash.makePositionHash(this.position)
  }

  get gridSize() {
    return this.getParent().gridSize
  }

  get selected() {
    return this.getWord(4) === "selected"
  }

  select() {
    this.setWord(4, "selected")
  }

  unselect() {
    this.setWord(4, "")
  }

  toStumpCode() {
    const { gridSize, health } = this
    const opacity = health === Infinity ? "" : `opacity:${this.health / (this._startHealth ?? this.health)};`
    return `div ${this.icon}
 class Agent ${this.selected ? "selected" : ""}
 style top:${this.top * gridSize}px;left:${this.left *
      gridSize}px;font-size:${gridSize}px;line-height: ${gridSize}px;${opacity}`
  }
}

module.exports = { Agent }
