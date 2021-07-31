const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")

class Agent extends AbstractTreeComponent {
  get icon() {
    return this.agentDefinition.getWord(0)
  }

  get name() {
    return this._name ?? this.icon
  }

  get angle() {
    return this._angle ?? this.agentDefinition.get("angle") ?? "South"
  }

  set angle(value) {
    this._angle = value
  }

  get agentDefinition() {
    return this.root.simojiProgram.getNode(this.getWord(0))
  }

  replaceWith(target, command) {
    return this._replaceWith(command.getWord(1))
  }

  _replaceWith(newObject) {
    this.getParent().appendLine(`${newObject} ${this.positionHash}`)
    this.unmountAndDestroy()
  }

  javascript(target, command) {
    eval(command.childrenToString())
  }

  kickIt(target) {
    target.angle = this.angle
    target.tickStack = new jtree.TreeNode(`1
 move
 move
 move
2
 move
 move
3
 move
4
 move`)
    target._move()
  }

  pickItUp(target) {
    target.owner = this
    if (!this.holding) this.holding = []
    this.holding.push(target)
  }

  bounce() {
    this.angle = yodash.flipAngle(this.angle)
  }

  alert(target, command) {
    alert(command.getContent())
  }

  reset() {
    this.getRootNode().resetCommand()
  }

  log(target, command) {
    console.log(command.getContent())
  }

  decrease(target, command) {
    const property = command.getWord(1)
    if (target[property] === undefined) target[property] = 0
    target[property]--
  }

  increase(target, command) {
    const property = command.getWord(1)
    if (target[property] === undefined) target[property] = 0
    target[property]++
  }

  pause() {
    this.root.pauseCommand()
  }

  get touchMap() {
    return this.agentDefinition.getNode("onTouch")
  }

  handleCollisions(targets) {
    const commandMap = this.agentDefinition.getNode("onHit")
    if (!commandMap) return

    return yodash.applyCommandMap(commandMap, targets, this)
  }

  turnRandomly() {
    this.angle = yodash.getRandomAngle()
    return this
  }

  turnToward(target, instruction) {
    const targets = this.board.agentTypeMap.get(instruction.getWord(1))
    if (targets) this.angle = yodash.getBestAngle(targets, this.position)
    return this
  }

  turnFrom(target, instruction) {
    const targets = this.board.agentTypeMap.get(instruction.getWord(1))
    if (targets) this.angle = yodash.flipAngle(yodash.getBestAngle(targets, this.position))
    return this
  }

  executeCommands(key) {
    this.agentDefinition.findNodes(key).forEach(commands => this.executeCommandSequence(commands))
  }

  executeCommandSequence(commandSequence) {
    const probability = commandSequence.getWord(1)
    if (probability && Math.random() > parseFloat(probability)) return
    commandSequence.forEach(instruction => {
      this[instruction.getWord(0)](this, instruction)
    })
  }

  onTick() {
    if (this.tickStack) {
      const next = this.tickStack.shift()
      this.executeCommandSequence(next)
      if (!this.tickStack.length) this.tickStack = undefined
    }

    this.executeCommands("onTick")
    if (this.health === 0) this.onDeathCommand()
  }

  remove() {
    this.unmountAndDestroy()
  }

  get neighorCount() {
    const { agentPositionMap } = this.board
    const neighborCounts = {}
    yodash.positionsAdjacentTo(this.position).forEach(pos => {
      const agents = agentPositionMap.get(yodash.makePositionHash(pos)) ?? []
      agents.forEach(agent => {
        if (!neighborCounts[agent.name]) neighborCounts[agent.name] = 0
        neighborCounts[agent.name]++
      })
    })
    return neighborCounts
  }

  onDeathCommand() {
    this.executeCommands("onDeath")
  }

  markDirty() {
    this.setWord(5, Date.now())
  }

  spawn(subject, command) {
    this.board.appendLine(`${command.getWord(1)} ${subject.positionHash}`)
  }

  move() {
    if (this.selected) return
    return this._move()
  }

  _move() {
    if (this.owner) return this

    const { angle } = this
    if (angle.includes("North")) this.moveNorthCommand()
    else if (angle.includes("South")) this.moveSouthCommand()
    if (angle.includes("East")) this.moveEastCommand()
    else if (angle.includes("West")) this.moveWestCommand()

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
    return yodash.parsePosition(this.getWords())
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

  get startHealth() {
    return parseInt(this.agentDefinition.get("health"))
  }

  toStumpCode() {
    const { gridSize, health } = this
    const opacity = health === undefined ? "" : `opacity:${this.health / this.startHealth};`
    return `div ${this.html ?? this.icon}
 class Agent ${this.selected ? "selected" : ""}
 style top:${this.top * gridSize}px;left:${this.left *
      gridSize}px;font-size:${gridSize}px;line-height: ${gridSize}px;${opacity};${this.style ?? ""}`
  }
}

module.exports = { Agent }
