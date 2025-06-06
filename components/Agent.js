const { yodash } = require("../yodash.js")
const { TreeNode } = require("jtree/products/TreeNode.js")
const { Keywords } = require("./Types.js")

const SelectedClass = "selected"

const classCache = {}
const getClassCache = (program, words) => {
  const key = words.join(" ")
  if (!classCache[key]) classCache[key] = yodash.flatten(yodash.pick(program, words))
  return classCache[key]
}

class Agent extends TreeNode {
  get name() {
    return this._name ?? this.icon
  }

  _direction = { x: 0, y: 1 }

  get direction() {
    if (this.angle) {
      const vectors = {
        north: [0, -1],
        east: [1, 0],
        south: [0, 1],
        west: [-1, 0],
        northeast: [-Math.cos(Math.PI * (5 / 8)), Math.sin((Math.PI * -3) / 4)],
        southeast: [-Math.cos((Math.PI * 3) / 4), Math.sin(Math.PI * (5 / 8))],
        southwest: [Math.cos((Math.PI * 3) / 4), Math.sin(Math.PI / 4)],
        northwest: [Math.cos(Math.PI * (5 / 8)), Math.sin((Math.PI * -3) / 4)]
      }
      const dir = vectors[this.angle.toLowerCase()]
      this._direction = { x: dir[0], y: dir[1] }
      this.angle = ""
    }
    return this._direction
  }

  set direction(newDirection) {
    this._direction = newDirection
  }

  getCommandBlocks(eventName) {
    return this.definitionWithClasses.findNodes(eventName)
  }

  get definitionWithClasses() {
    if (!this.classes.length) return this.board.simojiProgram.getNode(this.firstWord)
    return getClassCache(this.board.simojiProgram, [this.firstWord, ...this.classes])
  }

  skip(probability) {
    return probability !== undefined && this.board.randomNumberGenerator() > parseFloat(probability)
  }

  // if an element hasnt been removed. todo: cleanup
  get stillExists() {
    return !!this.element
  }

  _executeCommand(target, instruction) {
    const commandName = instruction.firstWord
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
    if (!this.stillExists) return
    if (this.tickStack) {
      this._executeCommandBlock(this.tickStack.shift())
      if (!this.tickStack.length) this.tickStack = undefined
    }

    this._executeCommandBlocks(Keywords.onTick)
    if (this.health === 0) this.onDeathCommand()
  }

  onDeathCommand() {
    this._executeCommandBlocks(Keywords.onDeath)
  }

  markDirty() {
    this.setWord(5, Date.now())
  }

  _replaceWith(newObject) {
    this.parent.insertInbounds(newObject, this.x, this.y)
    this.remove()
  }

  _move() {
    if (this.owner) return this

    const { direction, speed } = this

    this.top = this.top + direction.y * speed
    this.left = this.left + direction.x * speed

    if (this.holding) {
      this.holding.forEach(node => {
        node.setPosition({ x: this.x, y: this.y })
      })
    }

    if (this.hitEdge) this._executeCommandBlocks(this.hitEdge)
  }

  speed = 1

  get x() {
    return this.left
  }

  get y() {
    return this.top
  }

  get w() {
    return this.width
  }

  get h() {
    return this.height
  }

  width = 10
  height = 10

  get top() {
    return this._y ?? this.position.y
  }

  set top(value) {
    if (value > this.maxDown) {
      value = this.maxDown
      this.hitEdge = "onBottomEdge"
    }
    if (value < 0) {
      value = 0
      this.hitEdge = "onTopEdge"
    }
    this.setPosition({
      y: value,
      x: this.left
    })
  }

  get board() {
    return this.parent
  }

  setPosition(newPosition) {
    if (!this.board.canGoHere(newPosition.x, newPosition.y, this.width, this.height))
      return this.bouncy ? this.bounce() : this

    this._x = newPosition.x
    this._y = newPosition.y
    // Todo: do we need to update the string?
    return this.setLine([this.firstWord, newPosition.x, newPosition.y].join(" "))
  }

  handleCollisions(targetAgents) {
    if (!this.stillExists) return
    this.getCommandBlocks(Keywords.onHit).forEach(hitMap => {
      if (this.skip(hitMap.getWord(1))) return
      targetAgents.forEach(targetAgent => {
        const targetId = targetAgent.firstWord
        const commandBlock = hitMap.getNode(targetId)
        if (commandBlock) commandBlock.forEach(command => this._executeCommand(targetAgent, command))
      })
    })
  }

  get symbol() {
    return this.firstWord
  }

  get collidingAgents() {
    return this.board.objectsCollidingWith(this.x, this.y, this.width, this.height).filter(node => node !== this)
  }

  get neighorCount() {
    return this.board.getNeighborCount(this)
  }

  get maxRight() {
    return this.board.width - this.width - 1
  }

  get maxDown() {
    return this.board.height - this.height - 1
  }

  set left(value) {
    if (value > this.maxRight) {
      value = this.maxRight
      this.hitEdge = "onRightEdge"
    }

    if (value < 0) {
      value = 0
      this.hitEdge = "onLeftEdge"
    }
    this.setPosition({
      y: this.top,
      x: value
    })
  }

  get left() {
    return this._x ?? this.position.x
  }

  get bounds() {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    }
  }

  get position() {
    return {
      x: parseInt(this.words[1]),
      y: parseInt(this.words[2])
    }
  }

  get gridSize() {
    return 1
  }

  get agentSize() {
    return this.size ?? this.gridSize
  }

  get selected() {
    return this.getWord(4) === SelectedClass
  }

  select() {
    this.setWord(4, SelectedClass)
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
    if (this.element) this.element.remove()
    this.destroy()
  }

  get element() {
    return document.getElementById(this.id)
  }

  _updateHtml() {
    this.element.setAttribute("style", this.inlineStyle)
    if (this.selected) this.element.classList.add(SelectedClass)
    else this.element.classList.remove(SelectedClass)
  }

  get inlineStyle() {
    const { health, width, height } = this
    const opacity = health === undefined ? "" : `opacity:${this.health / this.startHealth};`
    return `top:${this.top}px;left:${this.left}px;font-size:${height}px;line-height:${height}px;${opacity};${
      this.style ?? ""
    }`
  }

  get id() {
    return `agent${this.agentNumber}`
  }

  get agentNumber() {
    return this._getUid()
  }

  toElement() {
    const elem = document.createElement("div")
    elem.setAttribute("id", this.id)
    elem.innerHTML = this.html ?? this.icon
    elem.classList.add("Agent")
    if (this.selected) elem.classList.add(SelectedClass)
    elem.setAttribute("style", this.inlineStyle)
    return elem
  }

  toggleSelectCommand() {
    const { root } = this
    root.selection.includes(this) ? this.unselectCommand() : this.selectCommand()

    root.ensureRender()
    return this
  }

  unselectCommand() {
    this.unselect()
    this.root.selection = this.root.selection.filter(node => node !== this)
  }

  selectCommand() {
    this.root.selection.push(this)
    this.select()
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
    target.direction = this.direction
    target.tickStack = new TreeNode(`1
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
    this.root.log(`${this.firstWord} ${command.content}`)
  }

  shoot() {
    if (!this.holding) return
    this.holding.forEach(agent => {
      this._dropIt(agent)
      this.kickIt(agent)
    })
  }
  bounce() {
    const { x, y } = this.direction
    this.direction = { x: -x, y: -y }
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
    const rng = this.board.randomNumberGenerator
    this.direction = { x: 2 * rng() - 1, y: 2 * rng() - 1 }
    return this
  }

  turnToward(target, instruction) {
    const targetId = instruction.getWord(1)
    const kind = this[targetId] ?? targetId // can define a custom target
    const targets = this.board.agentTypeMap.get(kind)
    if (!targets) return this
    this.target = yodash.getClosest(targets, this)
    this.direction = yodash.unitVector(this, this.target)
    return this
  }

  turnFrom(target, instruction) {
    const targetId = instruction.getWord(1)
    const kind = this[targetId] ?? targetId // can define a custom target
    const targets = this.board.agentTypeMap.get(kind)
    if (!targets) return this
    this.target = yodash.getClosest(targets, this)
    const bestUnitVector = yodash.unitVector(this, this.target)
    this.direction = { x: -bestUnitVector.x, y: -bestUnitVector.y }
    return this
  }

  remove() {
    this.nuke()
  }

  spawn(subject, command) {
    const position = command.getWordsFrom(2).length ? command.getWordsFrom(2).join(" ") : `${subject.x} ${subject.y}`
    this.board.appendLine(`${command.getWord(1)} ${position}`)
  }

  get midpoint() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 }
  }

  emit(subject, command) {
    const { midpoint } = this
    const position = command.getWordsFrom(2).length ? command.getWordsFrom(2).join(" ") : `${midpoint.x} ${midpoint.y}`
    const agent = this.board.appendLine(`${command.getWord(1)} ${position}`)
    agent.direction = this.direction
  }

  move() {
    if (this.selected) return
    return this._move()
  }

  moveToEmptySpot() {
    while (this.collidingAgents.length) {
      this.move()
    }
  }

  grow() {
    this.width++
    this.height++
    this.markDirty()
  }

  shrink() {
    if (!this.width || !this.height) return
    this.width--
    this.height--
    this.markDirty()
  }

  jitter() {
    this.turnRandomly()
    this.move()
  }

  _lastPulse
  pulse() {
    if (this._lastPulse) this.shrink()
    else this.grow()
    this._lastPulse = !this._lastPulse
  }

  learn(target, command) {
    this.classes.push(command.getWord(1))
  }

  unlearn(target, command) {
    const className = command.getWord(1)
    this.classes = this.classes.filter(name => name !== className)
  }
}

module.exports = { Agent }
