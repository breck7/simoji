const { AbstractTreeComponent } = require("jtree/products/TreeComponentFramework.node.js")
const { yodash } = require("../yodash.js")
const { jtree } = require("jtree")

class Agent extends jtree.TreeNode {
  get name() {
    return this._name ?? this.icon
  }

  angle = "South"

  getCommandBlocks(eventName) {
    return this.definitionWithBehaviors.findNodes(eventName)
  }

  get definitionWithBehaviors() {
    if (!this.behaviors.length) return this.board.simojiProgram.getNode(this.getWord(0))
    const behaviors = yodash.flatten(yodash.pick(this.board.simojiProgram, [this.getWord(0), ...this.behaviors]))
    return behaviors
  }

  skip(probability) {
    return probability !== undefined && this.board.randomNumberGenerator() > parseFloat(probability)
  }

  handleNeighbors() {
    this.getCommandBlocks("onNeighbors").forEach(neighborConditions => {
      if (this.skip(neighborConditions.getWord(1))) return

      const { neighorCount } = this

      neighborConditions.forEach(conditionAndCommandsBlock => {
        const [emoji, operator, count] = conditionAndCommandsBlock.getWords()
        const actual = neighorCount[emoji]
        if (!yodash.compare(actual ?? 0, operator, count)) return
        conditionAndCommandsBlock.forEach(command => this._executeCommand(this, command))

        if (this.getIndex() === -1) return {}
      })
    })
  }

  handleTouches(agentPositionMap) {
    this.getCommandBlocks("onTouch").forEach(touchMap => {
      if (this.skip(touchMap.getWord(1))) return

      for (let pos of yodash.positionsAdjacentTo(this.position)) {
        const hits = agentPositionMap.get(yodash.makePositionHash(pos)) ?? []
        for (let target of hits) {
          const targetId = target.getWord(0)
          const commandBlock = touchMap.getNode(targetId)
          if (commandBlock) {
            commandBlock.forEach(command => this._executeCommand(target, command))
            if (this.getIndex() === -1) return
          }
        }
      }
    })
  }

  handleCollisions(targets) {
    this.getCommandBlocks("onHit").forEach(hitMap => {
      if (this.skip(hitMap.getWord(1))) return
      targets.forEach(target => {
        const targetId = target.getWord(0)
        const commandBlock = hitMap.getNode(targetId)
        if (commandBlock) commandBlock.forEach(command => this._executeCommand(target, command))
      })
    })
  }

  _executeCommand(target, instruction) {
    const commandName = instruction.getWord(0)
    if (this[commandName]) this[commandName](target, instruction)
    // board commands
    else this.board[commandName](instruction)
  }

  _executeCommandBlocks(key) {
    this.getCommandBlocks(key).forEach(commandBlock => this._executeCommandBlock(commandBlock))
  }

  _executeCommandBlock(commandBlock) {
    if (this.skip(commandBlock.getWord(1))) return
    commandBlock.forEach(instruction => this._executeCommand(this, instruction))
  }

  onTick() {
    if (this.tickStack) {
      this._executeCommandBlock(this.tickStack.shift())
      if (!this.tickStack.length) this.tickStack = undefined
    }

    this._executeCommandBlocks("onTick")
    if (this.health === 0) this.onDeathCommand()
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
    this._executeCommandBlocks("onDeath")
  }

  markDirty() {
    this.setWord(5, Date.now())
  }

  _replaceWith(newObject) {
    this.getParent().appendLine(`${newObject} ${this.positionHash}`)

    this.remove()
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

  _startHealth
  get startHealth() {
    if (this._startHealth === undefined) this._startHealth = this.health
    return this._startHealth
  }

  // DOM operations

  nuke() {
    this.element.remove()
    this.destroy()
  }

  get element() {
    return document.getElementById(`agent${this._getUid()}`)
  }

  _updateHtml() {
    this.element.setAttribute("style", this.inlineStyle)
    if (this.selected) this.element.classList.add("selected")
    else this.element.classList.remove("selected")
  }

  get inlineStyle() {
    const { gridSize, health } = this
    const opacity = health === undefined ? "" : `opacity:${this.health / this.startHealth};`
    return `top:${this.top * gridSize}px;left:${this.left *
      gridSize}px;font-size:${gridSize}px;line-height: ${gridSize}px;${opacity};${this.style ?? ""}`
  }

  toElement() {
    const elem = document.createElement("div")
    elem.setAttribute("id", `agent${this._getUid()}`)
    elem.innerHTML = this.html ?? this.icon
    elem.classList.add("Agent")
    if (this.selected) elem.classList.add("selected")
    elem.setAttribute("style", this.inlineStyle)
    return elem
  }

  toStumpCode() {
    return `div ${this.html ?? this.icon}
 id agent${this._getUid()}
 class Agent ${this.selected ? "selected" : ""}
 style ${this.inlineStyle}`
  }

  needsUpdate(lastRenderedTime = 0) {
    return this.getLineModifiedTime() - lastRenderedTime > 0
  }

  // Commands available to users:

  replaceWith(target, command) {
    return this._replaceWith(command.getWord(1))
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
    if (target.owner === this) return
    if (target.owner) target.owner._dropIt(target)

    target.owner = this
    if (!this.holding) this.holding = []
    this.holding.push(target)
  }

  _dropIt(target) {
    target.owner = undefined
    this.holding = this.holding.filter(item => item !== target)
  }

  dropIt(target) {
    this._dropIt(target)
  }

  narrate(subject, command) {
    this.root.log(`${this.getWord(0)} ${command.getContent()}`)
  }

  shoot() {
    if (!this.holding) return
    this.holding.forEach(agent => {
      this._dropIt(agent)
      this.kickIt(agent)
    })
  }
  bounce() {
    this.angle = yodash.flipAngle(this.angle)
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

  turnRandomly() {
    this.angle = yodash.getRandomAngle(this.board.randomNumberGenerator)
    return this
  }

  turnToward(target, instruction) {
    const targetId = instruction.getWord(1)
    const kind = this[targetId] ?? targetId // can define a custom target
    const targets = this.board.agentTypeMap.get(kind)
    if (targets) this.angle = yodash.getBestAngle(targets, this.position)
    return this
  }

  turnFrom(target, instruction) {
    const targetId = instruction.getWord(1)
    const kind = this[targetId] ?? targetId // can define a custom target
    const targets = this.board.agentTypeMap.get(kind)
    if (targets) this.angle = yodash.flipAngle(yodash.getBestAngle(targets, this.position))
    return this
  }

  remove() {
    this.nuke()
  }

  spawn(subject, command) {
    const position = command.getWordsFrom(2).length ? command.getWordsFrom(2).join(" ") : subject.positionHash
    this.board.appendLine(`${command.getWord(1)} ${position}`)
  }

  move() {
    if (this.selected) return
    return this._move()
  }

  jitter() {
    this.turnRandomly()
    this.move()
  }

  learn(target, command) {
    this.behaviors.push(command.getWord(1))
  }

  unlearn(target, command) {
    const behaviorName = command.getWord(1)
    this.behaviors = this.behaviors.filter(name => name !== behaviorName)
  }
}

module.exports = { Agent }
