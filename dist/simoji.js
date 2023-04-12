const yodash = {}




yodash.compare = (left, operator, right) => {
  if (operator === "=") return left == right
  if (operator === "<") return left < right
  if (operator === ">") return left > right
  if (operator === "<=") return left <= right
  if (operator === ">=") return left >= right

  return false
}

// Todo: why do we do this? Very confusing. Caught me by surprise.
// Is it because sometimes the class name is not valid JS?
yodash.compileAgentClassDeclarationsAndMap = program => {
  const agentKeywordMap = {}
  program.agentKeywordMap = agentKeywordMap // confusing
  const agentDefs = program.filter(node => node.parserId === ParserTypes.agentDefinitionParser)
  agentDefs.forEach((node, index) => (agentKeywordMap[node.firstWord] = `simAgent${index}`))
  const compiled = agentDefs.map(node => node.compile()).join("\n")
  const agentMap = Object.keys(agentKeywordMap)
    .map(key => `"${key}":${agentKeywordMap[key]}`)
    .join(",")
  return `${compiled}
    const map = {${agentMap}};
    map;`
}

yodash.patchExperimentAndReplaceSymbols = (program, experiment) => {
  const clone = program.clone()
  // drop experiment nodes
  clone.filter(node => node.parserId === ParserTypes.experimentParser).forEach(node => node.destroy())
  // Append current experiment
  if (experiment) clone.concat(experiment.childrenToString())
  // Build symbol table
  const symbolTable = {}
  clone
    .filter(node => node.parserId === ParserTypes.settingDefinitionParser)
    .forEach(node => {
      symbolTable[node.firstWord] = node.content
      node.destroy()
    })
  // Find and replace
  let withVarsReplaced = clone.toString()
  Object.keys(symbolTable).forEach(key => {
    withVarsReplaced = withVarsReplaced.replaceAll(key, symbolTable[key])
  })
  return withVarsReplaced
}

yodash.getClosest = (targets, subject) => {
  let closest = Infinity
  let target
  targets.forEach(agent => {
    if (agent === subject) return
    const distance = math.distance([agent.y, agent.x], [subject.y, subject.x])
    if (distance < closest) {
      closest = distance
      target = agent
    }
  })
  return target
}

yodash.unitVector = (objA, objB) => {
  // calculate direction vector (delta)
  const delta = {
    x: objB.x - objA.x,
    y: objB.y - objA.y
  }

  // calculate magnitude of delta (distance between two points)
  const magDelta = Math.sqrt(delta.x * delta.x + delta.y * delta.y)

  // calculate unit vector (normalize direction vector by dividing by magnitude)
  return {
    x: delta.x / magDelta,
    y: delta.y / magDelta
  }
}

yodash.parsePercent = str => parseFloat(str.replace("%", "")) / 100

yodash.getRandomNumberGenerator = seed => () => {
  const semiRand = Math.sin(seed++) * 10000
  return semiRand - Math.floor(semiRand)
}

yodash.sampleFrom = (collection, howMany, randomNumberGenerator) =>
  shuffleArray(collection, randomNumberGenerator).slice(0, howMany)

const shuffleArray = (array, randomNumberGenerator) => {
  const clonedArr = array.slice()
  for (let index = clonedArr.length - 1; index > 0; index--) {
    const replacerIndex = Math.floor(randomNumberGenerator() * (index + 1))
    ;[clonedArr[index], clonedArr[replacerIndex]] = [clonedArr[replacerIndex], clonedArr[index]]
  }
  return clonedArr
}

yodash.pick = (tree, fields) => {
  const newTree = tree.clone()
  const map = Utils.arrayToMap(fields)
  newTree.forEach(node => {
    if (!map[node.firstWord]) node.destroy()
  })

  return newTree
}

yodash.flatten = tree => {
  const newTree = new TreeNode()
  tree.forEach(node => node.forEach(child => newTree.appendNode(child)))
  return newTree
}

window.yodash = yodash





var jQuery

class AbstractContextMenuComponent extends AbstractTreeComponentParser {
  toHakonCode() {
    const theme = this.getTheme()
    return `.AbstractContextMenuComponent
 position fixed
 max-height 100%
 color white
 z-index 221
 background rgb(47,47,51)
 box-shadow 0 1px 3px 0 rgb(47,47,51)
 font-size 14px
 a
  display block
  padding 3px
  font-size 14px
  text-decoration none`
  }

  static closeAllContextMenusOn(treeNode) {
    treeNode.filter(node => node instanceof AbstractContextMenuComponent).forEach(node => node.unmountAndDestroy())
  }

  toStumpCode() {
    return new TreeNode(`div
 class AbstractContextMenuComponent {constructorName}
 {body}`).templateToString({ constructorName: this.constructor.name, body: this.getContextMenuBodyStumpCode() })
  }

  treeComponentDidMount() {
    const container = this.getStumpNode()
    const app = this.root
    const { willowBrowser } = app
    const bodyShadow = willowBrowser.getBodyStumpNode().getShadow()
    const unmountOnClick = function() {
      bodyShadow.offShadowEvent("click", unmountOnClick) // todo: should we move this to before unmount?
      app.closeAllContextMenus()
    }
    setTimeout(() => bodyShadow.onShadowEvent("click", unmountOnClick), 100) // todo: fix this.
    const event = app.getMouseEvent()
    const windowSize = willowBrowser.getWindowSize()
    const position = this._getContextMenuPosition(
      windowSize.width,
      windowSize.height,
      this.left,
      event.clientY,
      container.getShadow()
    )
    jQuery(container.getShadow().element).css(position)
  }

  top = undefined
  get left() {
    return this.root.getMouseEvent().clientX
  }

  _getContextMenuPosition(windowWidth, windowHeight, x, y, shadow) {
    let boxTop = y
    let boxLeft = x
    const boxWidth = shadow.getShadowOuterWidth()
    const boxHeight = shadow.getShadowOuterHeight()
    const boxHeightOverflow = boxHeight + boxTop - windowHeight
    const boxRightOverflow = boxWidth + boxLeft - windowWidth

    // todo: instead of this change orientation
    if (boxHeightOverflow > 0) boxTop -= boxHeightOverflow

    if (boxRightOverflow > 0) boxLeft = x - boxWidth - 5

    if (boxTop < 0) boxTop = 0

    return {
      left: boxLeft,
      top: this.top ?? boxTop
    }
  }
}

window.AbstractContextMenuComponent = AbstractContextMenuComponent






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
        North: [0, -1],
        East: [1, 0],
        South: [0, 1],
        West: [-1, 0],
        Northeast: [Math.cos(Math.PI / 4), Math.sin((Math.PI * 3) / 4)],
        Southeast: [Math.cos((Math.PI * 3) / 4), Math.sin(Math.PI / 4)],
        Southwest: [-Math.cos((Math.PI * 3) / 4), Math.sin(Math.PI * (5 / 8))],
        Northwest: [-Math.cos(Math.PI * (5 / 8)), Math.sin((Math.PI * -3) / 4)]
      }
      this._direction = vectors[this.angle]
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

    this.top = Math.max(this.top + direction.y * speed, 0)
    this.left = Math.max(this.left + direction.x * speed, 0)

    if (this.holding) {
      this.holding.forEach(node => {
        node.setPosition({ x: this.x, y: this.y })
      })
    }
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
    if (value > this.maxDown) value = this.maxDown
    if (value < 0) value = 0
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
    if (value > this.maxRight) value = this.maxRight

    if (value < 0) value = 0
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

window.Agent = Agent




class AgentPaletteComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    const root = this.root
    const { agentToInsert } = root
    const items = this.paletteItems
      .map(item => item.firstWord)
      .map(
        word => ` div ${word}
  class ${agentToInsert === word ? "ActiveAgent" : ""}
  clickCommand changeAgentBrushCommand ${word}`
      )
      .join("\n")
    return `div
 class AgentPaletteComponent
${items}`
  }

  get paletteItems() {
    return this.root.allAgentTypes.filter(item => !item.has("noPalette"))
  }

  changeAgentBrushCommand(x) {
    this.root.changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.root.board]
  }
}

window.AgentPaletteComponent = AgentPaletteComponent










let nodeJsPrefix = ""

// prettier-ignore

class BoardErrorParser extends AbstractTreeComponentParser {
  _isErrorParser() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: Board does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class leftStartPosition extends TreeNode {
  get width() {
    return parseInt(this.getWord(1))
  }
}

class BoardComponent extends AbstractTreeComponentParser {
  // override default parser creation.
  _getParser() {
    if (!this._parser)
      this._parser = new TreeNode.ParserCombinator(BoardErrorParser, {
        ...this.agentMap,
        GridComponent,
        BoardStyleComponent,
        leftStartPosition
      })
    return this._parser
  }

  get simojiProgram() {
    return this.root.simojiPrograms[this.boardIndex]
  }

  get agentMap() {
    if (!this._agentMap) {
      this.compiledCode = yodash.compileAgentClassDeclarationsAndMap(this.simojiProgram)
      let evaled = {}
      try {
        evaled = eval(nodeJsPrefix + this.compiledCode)
      } catch (err) {
        console.log(this.compiledCode)
        console.error(err)
      }
      this._agentMap = evaled
    }
    return this._agentMap
  }

  get gridSize() {
    return 1
  }

  get width() {
    if (this._width === undefined) this._width = parseInt(this.getWord(2))
    return this._width
  }

  get height() {
    if (this._height === undefined) this._height = parseInt(this.getWord(3))
    return this._height
  }

  get populationCsv() {
    const csv = new TreeNode(this._populationCounts).asCsv
    // add 0's for missing values
    return csv
      .split("\n")
      .map(line =>
        line
          .split(",")
          .map(value => (value === "" ? "0" : value))
          .join(",")
      )
      .join("\n")
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

  runAtTimeEvents() {
    const blocks = this.timeMap.get(this.tick)
    if (blocks)
      blocks.forEach(block =>
        block
          .filter(node => node.doesExtend(ParserTypes.abstractInjectCommandParser))
          .forEach(command => this.runInjectCommand(command))
      )
  }

  insertAgentAtCommand(xCenter, yCenter) {
    const root = this.root
    const { agentToInsert } = root
    if (!agentToInsert) return
    this.clearCollisionDetector()

    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentToInsert)

    const x = xCenter - Math.floor(agentWidth / 2)
    const y = yCenter - Math.floor(agentHeight / 2)

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    this.prependLine(`${agentToInsert} ${x} ${y}`)
    this.renderAndGetRenderReport()
    this.clearCollisionDetector()

    const allCode = new TreeNode(root.simCode)
    let targetNode = root.boards.length === 1 ? allCode : allCode.findNodes("experiment")[this.boardIndex]

    if (this.tick) targetNode = targetNode.appendLine(`atTime ${this.tick}`)
    targetNode.appendLine(`insertAt ${agentToInsert} ${x} ${y}`)
    root.onSourceCodeChange(allCode)
  }

  get timeMap() {
    if (this._atTimes) return this._atTimes
    const map = new Map()
    this.simojiProgram.findNodes("atTime").forEach(node => {
      const tick = parseInt(node.getWord(1))
      if (!map.get(tick)) map.set(tick, [])
      map.get(tick).push(node)
    })
    this._atTimes = map
    return map
  }

  tick = 0
  boardLoop(render = true) {
    this.runAtTimeEvents()
    this.agents.forEach(node => node.onTick())

    this.clearCollisionDetector()
    this.handleCollisions()
    this.executeBoardCommands(Keywords.onTick)
    this.handleExtinctions()

    this.tick++
    this._populationCounts.push(this.populationCount)

    if (render) this.renderAndGetRenderReport()

    if (this.resetAfterLoop) {
      this.resetAfterLoop = false
      this.root.resetAllCommand()
    }
  }

  renderAndGetRenderReport(stumpNode, index) {
    const isMounted = this.isMounted()
    const report = super.renderAndGetRenderReport(stumpNode, index)
    if (!isMounted) this.appendAgents(this.agents)
    else this.updateAgents()
    return report
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return
    jQuery(this.getStumpNode().getShadow().element).on("click", ".Agent", function (evt) {
      const agent = evt.target
      const id = parseInt(jQuery(agent).attr("id").replace("agent", ""))
      that.getAgent(id).toggleSelectCommand()
    })
  }

  getAgent(uid) {
    return this.agents.find(agent => agent._getUid() === uid)
  }

  appendAgents(agents) {
    if (!agents.length) return this

    if (this.isNodeJs()) return

    const fragment = document.createDocumentFragment()
    agents.forEach(agent => fragment.appendChild(agent.toElement()))
    this._htmlStumpNode.getShadow().element.prepend(fragment)
    agents.forEach(agent => (agent.painted = true))
  }

  updateAgents() {
    const lastRenderedTime = this._getLastRenderedTime()
    this.agents
      .filter(agent => agent.painted && agent.needsUpdate(lastRenderedTime))
      .forEach(agent => agent._updateHtml())
    this.appendAgents(this.agents.filter(agent => !agent.painted))
  }

  get root() {
    return this.parent
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get(Keywords.ticksPerSecond)
    return setTime ? parseInt(setTime) : 10
  }

  runInjectCommand(command) {
    this[command.parserId](command)
  }

  getAgentHeightAndWidth(agentSymbol) {
    const item = new this.agentMap[agentSymbol]()
    return { agentWidth: item.width, agentHeight: item.height }
  }

  insertInbounds(agentSymbol, x, y) {
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const xOver = x + agentWidth - this.width
    const yOver = y + agentHeight - this.height
    if (xOver > 0) x = x - xOver - 10
    if (yOver > 0) y = y - yOver - 10
    if (x < 0) x = 0
    if (y < 0) y = 0
    this.appendLine(`${agentSymbol} ${x} ${y}`)
  }

  // todo: origin
  insertClusteredRandomAgents(amount, agentSymbol, x = 0, y = 0) {
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const spots = this.collisionDetector.findClusteredNonOverlappingSquares(
      agentWidth,
      agentHeight,
      amount,
      x,
      y,
      (amount * agentWidth) / 4
    )
    return spots.map(spot => `${agentSymbol} ${spot.x} ${spot.y}`).join("\n")
  }

  insertClusterParser(commandNode) {
    this.concat(
      this.insertClusteredRandomAgents(
        parseInt(commandNode.getWord(1)),
        commandNode.getWord(2),
        commandNode.getWord(3),
        commandNode.getWord(4)
      )
    )
    this.clearCollisionDetector()
  }

  insertAtParser(commandNode) {
    this.appendLine(`${commandNode.getWord(1)} ${commandNode.getWord(2)} ${commandNode.getWord(3)}`)
    this.clearCollisionDetector()
  }

  rectangleDrawParser(commandNode) {
    // todo: need a typed words method in jtree
    // rectangle 🙂 width height x y 🙂
    const [command, symbol, width, height, x, y, fillSymbol, spacing] = commandNode.words
    const newLines = this.makeRectangle(
      symbol,
      parseInt(width),
      parseInt(height),
      parseInt(x),
      parseInt(y),
      fillSymbol,
      spacing ? parseInt(spacing) : 0
    )
    this.concat(newLines)
    this.clearCollisionDetector()
  }

  pasteDrawParser(commandNode) {
    const newSpots = new TreeNode(commandNode.childrenToString())
    this.concat(newSpots)
    this.clearCollisionDetector()
  }

  fillParser(commandNode) {
    this.concat(this.fill(commandNode.getWord(1)))
    this.clearCollisionDetector()
  }

  drawParser(commandNode) {
    this.concat(this.draw(commandNode.childrenToString()))
    this.clearCollisionDetector()
  }

  get seed() {
    if (!this._seed)
      this._seed = this.simojiProgram.has(Keywords.seed) ? parseInt(this.simojiProgram.get(Keywords.seed)) : newSeed()
    return this._seed
  }

  get randomNumberGenerator() {
    if (!this._rng) this._rng = yodash.getRandomNumberGenerator(this.seed)
    return this._rng
  }

  insertParser(commandNode) {
    const { width, height } = this
    const agentSymbol = commandNode.getWord(2)
    let amount = commandNode.getWord(1)
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const maxCells = (width * height) / (agentWidth * agentHeight)
    amount = amount.includes("%") ? yodash.parsePercent(amount) * maxCells : parseInt(amount)

    const spots = this.collisionDetector.findNonOverlappingSquares(agentWidth, agentHeight, amount)

    const newAgents = spots.map(spot => `${agentSymbol} ${spot.x + " " + spot.y}`).join("\n")

    this.concat(newAgents)
    this.clearCollisionDetector()
  }

  handleExtinctions() {
    this.simojiProgram.findNodes(Keywords.onExtinct).forEach(commands => {
      const emoji = commands.getWord(1)
      if (emoji && this.has(emoji)) return
      commands.forEach(instruction => {
        this[instruction.firstWord](instruction)
      })
    })
  }

  executeBoardCommands(key) {
    this.simojiProgram.findNodes(key).forEach(commands => {
      const probability = commands.getWord(1)
      if (probability && this.randomNumberGenerator() > parseFloat(probability)) return
      commands.forEach(instruction => {
        this[instruction.firstWord](instruction)
      })
    })
  }

  get agents() {
    return this.topDownArray.filter(node => node instanceof Agent)
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

  clearCollisionDetector() {
    delete this._collisionDetector
    delete this._solidCollisionDetector
  }

  _collisionDetector
  get collisionDetector() {
    if (!this._collisionDetector) this._collisionDetector = new CollisionDetector(this.agents, this.width, this.height)
    return this._collisionDetector
  }

  handleCollisions() {
    const collisions = this.collisionDetector.detectCollisions()
    collisions.forEach(collision => {
      const [agentA, agentB] = collision
      agentA.handleCollisions([agentB])
      agentB.handleCollisions([agentA])
    })
  }

  get boardIndex() {
    return parseInt(this.getWord(4))
  }

  get hasMultipleBoards() {
    return this.root.simojiPrograms.length > 1
  }

  get leftStartPosition() {
    return this.getNode("leftStartPosition")?.width ?? 250
  }

  get multiboardTransforms() {
    if (!this.hasMultipleBoards) return ""

    const positions = {
      0: "top left",
      1: "top right",
      2: "bottom left",
      3: "bottom right"
    }
    const translate = positions[this.boardIndex]
    return `transform:scale(0.5);transform-origin:${translate};`
  }

  get style() {
    return `left:calc(10px + ${this.leftStartPosition}px);${this.multiboardTransforms}`
  }

  toStumpCode() {
    const id = `board{this._getUid()}`
    const tickDuration = 1.0 / this.ticksPerSecond
    return `div
 style ${this.style}
 id ${id}
 styleTag
  bern
   #${id} .Agent {transition: all ${tickDuration}s linear;}
 div ${this.experimentTitle}
  class BoardTitle
 class ${this.getCssClassNames().join(" ")}`
  }

  get experimentTitle() {
    if (!this.hasMultipleBoards) return ""
    return this.root.mainExperiment.findNodes(Keywords.experiment)[this.boardIndex].content ?? ""
  }

  startInterval() {
    this.interval = setInterval(() => this.boardLoop(), 1000 / this.ticksPerSecond)
  }

  stopInterval() {
    clearInterval(this.interval)
    this.interval = undefined
  }

  get isRunning() {
    return !!this.interval
  }

  skipToThisManyTicksIfNotPaused(ticks) {
    this.interval = true
    for (let i = 0; i <= ticks; i++) {
      this.boardLoop(false)
      if (!this.isRunning) break
    }
    this.renderAndGetRenderReport()
  }

  runUntilPause() {
    this.interval = true
    while (this.interval) {
      this.boardLoop()
      if (this.tick % 100 === 0) console.log(`Tick ${this.tick}`)
    }
  }

  // Commands available to users:

  spawn(command) {
    this.appendLine(`${command.getWord(1)} ${this.getRandomLocationHash()}`)
  }

  alert(command) {
    const message = command.content
    if (!this.isNodeJs())
      // todo: willow should shim this
      alert(message)
    else this.root.log(message)
  }

  pause() {
    const { isRunning } = this
    this.stopInterval()
    if (isRunning) this.root.onBoardPause() // ensure playbutton has updated if needed
  }

  reset() {
    this.resetAfterLoop = true
  }

  log(command) {
    this.root.log(command.content)
  }

  isRectOccupied(x, y, width, height) {
    return !this.collisionDetector.isSpotAvailable(x, y, width, height)
  }

  objectsCollidingWith(x, y, width, height) {
    return this.collisionDetector.getCollidingAgents(x, y, width, height)
  }

  _solidCollisionDetector
  get solidCollisionDetector() {
    if (!this._solidCollisionDetector)
      this._solidCollisionDetector = new CollisionDetector(
        this.agents.filter(agent => agent.solid),
        this.width,
        this.height
      )
    return this._solidCollisionDetector
  }

  canGoHere(x, y, width, height) {
    const blockersHere = this.solidCollisionDetector.getCollidingAgents(x, y, width, height)
    if (blockersHere.length) return false

    return true
  }

  get collidingAgents() {
    const agents = this.agents
    const collidingAgents = []
    for (let agent of agents) {
      const { position, agentSize } = agent
      const agentsHere = this.objectsCollidingWith(position.x, position.y, agentSize).filter(a => a !== agent)
      if (agentsHere.length) collidingAgents.push(...agentsHere)
    }
    return collidingAgents
  }

  makePositionHash(positionType) {
    return `${positionType.x + " " + positionType.y}`
  }

  getRandomLocationHash(size = 1) {
    const { x, y } = this.getRandomLocation()
    if (this.isRectOccupied(x, y, size, size)) return this.getRandomLocationHash()
    return this.makePositionHash({ x, y })
  }

  getRandomLocation() {
    const { randomNumberGenerator, height, width } = this
    const maxRight = width
    const maxBottom = height
    const x = Math.round(randomNumberGenerator() * maxRight)
    const y = Math.round(randomNumberGenerator() * maxBottom)
    return { x, y }
  }

  draw(str) {
    const lines = str.split("\n")
    const output = []
    let agentWidth
    let agentHeight
    for (let index = 0; index < lines.length; index++) {
      const words = lines[index].split(" ")
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const agentSymbol = words[wordIndex]
        if (agentSymbol && !agentWidth) {
          // Draw assumes everything being drawn is a square with sides N.
          agentWidth = this.getAgentHeightAndWidth(agentSymbol).agentWidth
          agentHeight = agentWidth
        }

        if (agentSymbol !== "")
          output.push(`${agentSymbol} ${this.makePositionHash({ y: index * agentHeight, x: wordIndex * agentHeight })}`)
      }
    }
    return output.join("\n")
  }

  makeRectangle(agentSymbol = "🧱", width = 20, height = 20, x = 0, y = 0, fillSymbol = false, spacing = 0) {
    if (width < 1 || height < 1) return ""

    if (isNaN(x)) x = 20
    if (isNaN(y)) y = 20

    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const cells = []
    let row = 0
    while (row < height) {
      let col = 0
      while (col < width) {
        const isPerimeter = row === 0 || row === height - 1 || col === 0 || col === width - 1
        if (!fillSymbol && !isPerimeter) {
          col++
          continue
        }

        cells.push(
          `${isPerimeter ? agentSymbol : fillSymbol} ${x + col * (agentWidth + spacing)} ${
            y + row * (agentHeight + spacing)
          }`
        )
        col++
      }
      row++
    }
    return cells.join("\n")
  }

  fill(agentSymbol) {
    let { width, height } = this
    const { agentWidth, agentHeight } = this.getAgentHeightAndWidth(agentSymbol)
    const board = []
    let y = 0
    while (y < height - agentHeight) {
      let x = 0
      while (x < width - agentWidth) {
        if (this.isRectOccupied(x, y, agentWidth, agentHeight)) {
          x += agentWidth
          continue
        }
        board.push(`${agentSymbol} ${x} ${y}`)
        x += agentWidth
      }
      y += agentHeight
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

class BoardStyleComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(TreeNode)
  }

  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

let _defaultSeed = Date.now()
const newSeed = () => {
  _defaultSeed++
  return _defaultSeed
}

window.BoardComponent = BoardComponent








class BottomBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      PlayButtonComponent,
      ReportButtonComponent,
      ResetButtonComponent
    })
  }
}

window.BottomBarComponent = BottomBarComponent


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

window.CollisionDetector = CollisionDetector




class EditorHandleComponent extends AbstractTreeComponentParser {
  get left() {
    return this.root.editor.width
  }

  makeDraggable() {
    if (this.isNodeJs()) return

    const root = this.root
    jQuery(this.getStumpNode().getShadow().element).draggable({
      axis: "x",
      drag: function(event, ui) {
        if ("ontouchend" in document) return // do not update live on a touch device. otherwise buggy.
        root.resizeEditorCommand(Math.max(ui.offset.left, 5) + "")
      },
      stop: function(event, ui) {
        root.resizeEditorCommand(Math.max(ui.offset.left, 5) + "")
        root.resetAllCommand()
      }
    })
  }

  treeComponentDidMount() {
    this.makeDraggable()
  }

  treeComponentDidUpdate() {
    this.makeDraggable()
  }

  toStumpCode() {
    return `div
 class ${EditorHandleComponent.name}
 style left:${this.left}px;`
  }

  getDependencies() {
    return [this.root.editor]
  }
}

window.EditorHandleComponent = EditorHandleComponent




const ExampleSims = new TreeNode()

// prettier-ignore

window.ExampleSims = ExampleSims









const Categories = new TreeNode(`🦠 Epidemiology
 virus
 covid19
🌲 Forests
 fire
 fireAdvanced
⚽️ Sports
 soccer
 pong
 basketball
💰 Business
 startupIdeas
🦋 Biology
 moths
🕹 Games
 zombies`)

class ExampleMenuComponent extends AbstractContextMenuComponent {
  getContextMenuBodyStumpCode() {
    const icon = this.getWord(1)
    const category = Categories.getNode(icon)

    return category
      .map(node => {
        const name = node.firstWord
        const program = ExampleSims.getNode(name)
        const icon = program.childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
        const properName = Utils.ucfirst(name)
        return `a ${icon}  &nbsp; ${properName}
 clickCommand loadExampleCommand ${name}
 class ExampleButton`
      })
      .join("\n")
  }

  // Align these to below and to the left of the clicked button
  top = 28
  get left() {
    const evt = this.root.getMouseEvent()
    return evt.clientX - evt.offsetX
  }
}

class ExamplesComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    const categories = Categories.map(category => {
      const icon = category.firstWord
      const name = category.content
      const firstFile = category.nodeAt(0).firstWord
      return ` a ${icon}
  href index.html#example%20${firstFile}
  title ${name}
  clickCommand openCategoryCommand ${icon}`
    }).join("\n")
    return `div
 class ${ExamplesComponent.name}
${categories}`
  }

  async openCategoryCommand(icon) {
    const root = this.root
    const category = Categories.getNode(icon)
    const firstFile = category.nodeAt(0).firstWord
    this.root.toggleAndRender(`${ExampleMenuComponent.name} ${icon}`)
  }
}

window.ExamplesComponent = ExamplesComponent

window.ExampleMenuComponent = ExampleMenuComponent




class GridComponent extends AbstractTreeComponentParser {
  gridClickCommand(x, y) {
    return this.parent.insertAgentAtCommand(x, y)
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return super.treeComponentDidMount()

    jQuery(`.${GridComponent.name}`).on("click", function (evt) {
      const { offsetX, offsetY } = evt
      const x = offsetX
      const y = offsetY
      that.gridClickCommand(x, y)
    })
  }

  toStumpCode() {
    return `div
 class ${GridComponent.name}`
  }
}

window.GridComponent = GridComponent





class AbstractModalTreeComponent extends AbstractTreeComponentParser {
  toHakonCode() {
    return `.modalBackground
 position fixed
 top 0
 left 0
 width 100%
 height 100%
 z-index 1000
 display flex
 padding-top 50px
 align-items baseline
 justify-content center
 box-sizing border-box
 background rgba(0,0,0,0.4)

.modalContent
 background white
 color black
 box-shadow 0px 0px 2px rgba(0,0,0,0.4)
 padding 20px
 position relative
 min-width 600px
 max-width 800px
 max-height 90%
 white-space nowrap
 text-overflow ellipsis
 overflow-x hidden
 overflow-y scroll

.modalClose
 position absolute
 top 10px
 right 10px
 cursor pointer`
  }

  toStumpCode() {
    return new TreeNode(`section
 clickCommand unmountAndDestroyCommand
 class modalBackground
 section
  clickCommand stopPropagationCommand
  class modalContent
  a X
   id closeModalX
   clickCommand unmountAndDestroyCommand
   class modalClose
  {modelStumpCode}`).templateToString({ modelStumpCode: this.getModalStumpCode() })
  }
}

class HelpModalComponent extends AbstractModalTreeComponent {
  getModalStumpCode() {
    return `iframe
 class helpIframe
 src cheatSheet.html`
  }
}

window.HelpModalComponent = HelpModalComponent




class PlayButtonComponent extends AbstractTreeComponentParser {
  get isStarted() {
    return this.root.isRunning
  }

  toStumpCode() {
    return `span ${this.isStarted ? "&#10074;&#10074;" : "▶︎"}
 class ${PlayButtonComponent.name} BottomButton
 clickCommand togglePlayAllCommand`
  }
}

window.PlayButtonComponent = PlayButtonComponent




class ReportButtonComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `span Δ
 title Generate Report
 class ${ReportButtonComponent.name} BottomButton
 clickCommand openReportInOhayoCommand`
  }
}

window.ReportButtonComponent = ReportButtonComponent




class ResetButtonComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `span ≪
 title Clear and reset
 class ${ResetButtonComponent.name} BottomButton
 clickCommand resetAllCommand`
  }

  resetAllCommand() {
    this.root.pauseAllCommand()
    this.root.resetAllCommand()
  }
}

window.ResetButtonComponent = ResetButtonComponent






class RightBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      AgentPaletteComponent
    })
  }
}

window.RightBarComponent = RightBarComponent




class ShareComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `div
 class ShareComponent
 input
  readonly
  title ${this.link}
  value ${this.link}`
  }

  getDependencies() {
    return [this.root.firstProgram]
  }

  get link() {
    const url = new URL(typeof location === "undefined" ? "http://localhost/" : location.href) // todo: TCF should provide shim for this
    url.hash = ""
    return url.toString() + this.root.urlHash
  }
}

window.ShareComponent = ShareComponent





// prettier-ignore

class CodeMirrorShim {
  setSize() {}
  setValue(value) {
    this.value = value
  }
  getValue() {
    return this.value
  }
}

class SimEditorComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `div
 class ${SimEditorComponent.name}
 style width:${this.width}px;
 textarea
  id EditorTextarea
 div &nbsp;
  clickCommand dumpErrorsCommand
  id codeErrorsConsole`
  }

  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      value: TreeNode
    })
  }

  get codeMirrorValue() {
    return this.codeMirrorInstance.getValue()
  }

  codeWidgets = []

  _onCodeKeyUp() {
    const { willowBrowser } = this
    const code = this.codeMirrorValue
    if (this._code === code) return
    this._code = code
    const root = this.root
    root.pauseAllCommand()
    // this._updateLocalStorage()

    this.program = new simojiParser(code)
    const errs = this.program.getAllErrors()

    const errMessage = errs.length ? `${errs.length} errors` : "&nbsp;"
    willowBrowser.setHtmlOfElementWithIdHack("codeErrorsConsole", errMessage)

    const cursor = this.codeMirrorInstance.getCursor()

    // todo: what if 2 errors?
    this.codeMirrorInstance.operation(() => {
      this.codeWidgets.forEach(widget => this.codeMirrorInstance.removeLineWidget(widget))
      this.codeWidgets.length = 0

      errs
        .filter(err => !err.isBlankLineError())
        .filter(err => !err.isCursorOnWord(cursor.line, cursor.ch))
        .slice(0, 1) // Only show 1 error at a time. Otherwise UX is not fun.
        .forEach(err => {
          const el = err.getCodeMirrorLineWidgetElement(() => {
            this.codeMirrorInstance.setValue(this.program.toString())
            this._onCodeKeyUp()
          })
          this.codeWidgets.push(
            this.codeMirrorInstance.addLineWidget(err.lineNumber - 1, el, { coverGutter: false, noHScroll: false })
          )
        })
      const info = this.codeMirrorInstance.getScrollInfo()
      const after = this.codeMirrorInstance.charCoords({ line: cursor.line + 1, ch: 0 }, "local").top
      if (info.top + info.clientHeight < after) this.codeMirrorInstance.scrollTo(null, after - info.clientHeight + 3)
    })

    clearTimeout(this._timeout)
    this._timeout = setTimeout(() => {
      this.loadFromEditor()
    }, 200)
  }

  loadFromEditor() {
    this.root.loadNewSim(this._code)
  }

  get simCode() {
    return this.codeMirrorInstance ? this.codeMirrorValue : this.getNode("value").childrenToString()
  }

  async treeComponentDidMount() {
    this._initCodeMirror()
    this._updateCodeMirror()
    super.treeComponentDidMount()
  }

  async treeComponentDidUpdate() {
    this._updateCodeMirror()
    super.treeComponentDidUpdate()
  }

  renderAndGetRenderReport(stumpNode, index) {
    if (!this.isMounted()) return super.renderAndGetRenderReport(stumpNode, index)
    this.setSize()
    return ""
  }

  setCodeMirrorValue(value) {
    this.codeMirrorInstance.setValue(value)
    this._code = value
  }

  _initCodeMirror() {
    if (this.isNodeJs()) return (this.codeMirrorInstance = new CodeMirrorShim())
    this.codeMirrorInstance = new GrammarCodeMirrorMode("custom", () => simojiParser, undefined, CodeMirror)
      .register()
      .fromTextAreaWithAutocomplete(document.getElementById("EditorTextarea"), {
        lineWrapping: false,
        lineNumbers: false
      })
    this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
    this.setSize()
  }

  get width() {
    return parseInt(this.getWord(1))
  }

  get chromeHeight() {
    return parseInt(this.getWord(2))
  }

  setSize() {
    if (this.isNodeJs()) return
    this.codeMirrorInstance.setSize(this.width, window.innerHeight - this.chromeHeight)
  }

  _updateCodeMirror() {
    this.setCodeMirrorValue(this.getNode("value").childrenToString())
  }
}

window.SimEditorComponent = SimEditorComponent


// prettier-ignore






















// prettier-ignore

class githubTriangleComponent extends AbstractTreeComponentParser {
  githubLink = `https://github.com/breck7/simoji`
  toHakonCode() {
    return `.AbstractGithubTriangleComponent
 display block
 position absolute
 top 0
 right 0
 z-index 3`
  }
  toStumpCode() {
    return `a
 class AbstractGithubTriangleComponent
 href ${this.githubLink}
 target _blank
 img
  height 40px
  src github-fork.svg`
  }
}

class ErrorParser extends AbstractTreeComponentParser {
  _isErrorParser() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: SimojiApp does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class SimojiApp extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(ErrorParser, {
      TopBarComponent,
      githubTriangleComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent,
      EditorHandleComponent,
      TitleComponent,
      ExampleMenuComponent
    })
  }

  resetAllCommand() {
    const restart = this.isRunning
    this.loadNewSim(this.simCode)
    if (restart) this.startAllIntervals()
  }

  makeGrid(simojiProgram, windowWidth, windowHeight) {
    const chromeWidth = this.leftStartPosition + SIZES.RIGHT_BAR_WIDTH + SIZES.BOARD_MARGIN
    const width = windowWidth - chromeWidth - 1
    const height = windowHeight - SIZES.CHROME_HEIGHT - SIZES.TITLE_HEIGHT - 1

    const setWidth = simojiProgram.get(Keywords.width)
    const setHeight = simojiProgram.get(Keywords.height)
    // todo: use the set values if present

    return { width, height }
  }

  verbose = true

  get firstProgram() {
    return this.simojiPrograms[0]
  }

  get allAgentTypes() {
    return this.firstProgram.agentTypes // todo: this isn't quite correct
  }

  appendExperiments() {
    this.simojiPrograms.forEach((program, index) => {
      if (index > 3)
        // currently max out at 4 experiments. just need to update CSS transform code.
        return
      const board = this._appendExperiment(program, index)

      try {
        program
          .filter(node => node.doesExtend(ParserTypes.abstractInjectCommandParser))
          .forEach(command => board.runInjectCommand(command))
      } catch (err) {
        if (this.verbose) console.error(err)
      }
    })
  }

  closeAllContextMenus() {
    this.filter(node => node instanceof ExampleMenuComponent).forEach(node => node.unmountAndDestroy())
  }

  _onCommandWillRun() {
    this.closeAllContextMenus() // todo: move these to a body handler?
  }

  _appendExperiment(program, index) {
    const { windowWidth, windowHeight } = this
    const { width, height } = this.makeGrid(program, windowWidth, windowHeight)

    const styleNode = program.getNode(Keywords.style) ?? undefined
    const board = this.appendLineAndChildren(
      `${BoardComponent.name} 1 ${width} ${height} ${index}`,
      `leftStartPosition ${this.leftStartPosition}
${GridComponent.name}
${styleNode ? styleNode.toString().replace("style", BoardStyleComponent.name) : ""}`.trim()
    )
    return board
  }

  get leftStartPosition() {
    return this.editor.width
  }

  get editor() {
    return this.getNode(SimEditorComponent.name)
  }

  onSourceCodeChange(newCode) {
    this.editor.setCodeMirrorValue(newCode.toString())
    this.updateLocalStorage(newCode)
  }

  loadExampleCommand(name) {
    const restart = this.isRunning
    const simCode = ExampleSims.getNode(name).childrenToString()
    this.editor.setCodeMirrorValue(simCode)
    this.loadNewSim(simCode)
    if (restart) this.startAllIntervals()
    this.willowBrowser.setHash("")
  }

  get simCode() {
    return this.editor.simCode
  }

  loadNewSim(simCode) {
    this.stopAllIntervals()
    this.boards.forEach(board => board.unmountAndDestroy())

    delete this._simojiPrograms
    this.selection = []

    this.appendExperiments()
    this.renderAndGetRenderReport()
    this.updateLocalStorage(simCode)
  }

  // todo: cleanup
  pasteCodeCommand(simCode) {
    this.editor.setCodeMirrorValue(simCode)
    this.loadNewSim(simCode)
  }

  updateLocalStorage(simCode) {
    if (this.isNodeJs()) return // todo: tcf should shim this
    localStorage.setItem(LocalStorageKeys.simoji, simCode)
    console.log("Local storage updated...")
  }

  dumpErrorsCommand() {
    const errs = new simojiParser(this.simCode).getAllErrors()
    console.log(new TreeNode(errs.map(err => err.toObject())).toFormattedTable(200))
  }

  get boards() {
    return this.findNodes(BoardComponent.name)
  }

  get board() {
    return this.boards[0]
  }

  get mainExperiment() {
    return new simojiParser(this.simCode)
  }

  get simojiPrograms() {
    if (!this._simojiPrograms) {
      const { mainExperiment } = this
      this._simojiPrograms = mainExperiment.has(Keywords.experiment)
        ? []
        : [yodash.patchExperimentAndReplaceSymbols(mainExperiment)]
      mainExperiment.findNodes(Keywords.experiment).forEach(experiment => {
        this._simojiPrograms.push(yodash.patchExperimentAndReplaceSymbols(mainExperiment, experiment))
      })
      // Evaluate the variables
      this._simojiPrograms = this._simojiPrograms.map(program => new simojiParser(program.toString()))
    }
    return this._simojiPrograms
  }

  startAllIntervals() {
    this.boards.forEach(board => board.startInterval())
  }

  stopAllIntervals() {
    this.boards.forEach(board => board.stopInterval())
  }

  get maxTick() {
    return Math.max(...this.boards.map(board => board.tick))
  }

  goBackOneTickCommand() {
    const { maxTick } = this
    const previousTick = maxTick - 2
    this.pauseAllCommand()
    if (previousTick < 0) return
    this.loadNewSim(this.simCode)
    this.boards.forEach(board => board.skipToThisManyTicksIfNotPaused(previousTick))
    console.log(`Running to tick ${previousTick} from ${maxTick}`)
  }

  advanceOneTickCommand() {
    this.pauseAllCommand()
    this.boards.forEach(board => board.boardLoop())
  }

  get isRunning() {
    return this.boards.some(board => board.isRunning)
  }

  async start() {
    const { willowBrowser } = this
    this._bindTreeComponentFrameworkCommandListenersOnBody()
    this.renderAndGetRenderReport(willowBrowser.getBodyStumpNode())

    const keyboardShortcuts = this._getKeyboardShortcuts()
    Object.keys(keyboardShortcuts).forEach(key => {
      willowBrowser.getMousetrap().bind(key, function (evt) {
        keyboardShortcuts[key]()
        // todo: handle the below when we need to
        if (evt.preventDefault) evt.preventDefault()
        return false
      })
    })

    this.willowBrowser.setResizeEndHandler(() => {
      this.editor.setSize()
    })

    this._makeDocumentCopyableAndCuttable()
  }

  _makeDocumentCopyableAndCuttable() {
    const app = this
    this.willowBrowser
      .setCopyHandler(evt => app.copySelectionCommand(evt))
      .setCutHandler(evt => app.cutSelectionCommand(evt))
  }

  async copySelectionCommand(evt) {
    this._copySelection(evt)
  }

  async cutSelectionCommand(evt) {
    this._copySelection(evt)
    this.deleteSelectionCommand()
  }

  _copySelection(evt) {
    const willowBrowser = this.willowBrowser
    if (willowBrowser.someInputHasFocus()) return ""

    if (!this.selection.length) return ""

    const str = this.selection.map(agent => agent.words.slice(0, 3).join(" ")).join("\n")

    evt.preventDefault()
    evt.clipboardData.setData("text/plain", str)
    evt.clipboardData.setData("text/html", str)

    return str
  }

  // todo: fix for boards
  async runUntilPause() {
    await this.start()
    this.boards.forEach(board => board.runUntilPause())
    console.log(`Finished on tick ${this.board.tick}`)
  }

  ensureRender() {
    if (this.isRunning) return this
    this.renderAndGetRenderReport()
  }

  async downloadCsvCommand() {
    let extension = "csv"
    let type = "text/csv"
    let str = this.board.populationCsv
    const filename = "simoji"

    console.log(str)
    this.willowBrowser.downloadFile(str, filename + "." + extension, type)
  }

  log(message) {
    if (this.verbose) console.log(message)
  }

  async openReportInOhayoCommand() {
    this.willowBrowser.openUrl(this.ohayoLink)
  }

  get urlHash() {
    const tree = new TreeNode()
    tree.appendLineAndChildren(UrlKeys.simoji, this.simCode ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }

  get report() {
    const report = this.mainExperiment.getNode(Keywords.report)
    return report ? report.childrenToString() : "roughjs.line"
  }

  get ohayoLink() {
    const program = `data.inline
 ${this.report.replace(/\n/g, "\n ")}
 content
  ${this.board.populationCsv.replace(/\n/g, "\n  ")}`

    const link = this.willowBrowser.toPrettyDeepLink(program, {})
    const parts = link.split("?")
    return "https://ohayo.computer?filename=simoji.ohayo&" + parts[1]
  }

  updatePlayButtonComponentHack() {
    this.getNode(`${BottomBarComponent.name} ${PlayButtonComponent.name}`)
      .setContent(Date.now())
      .renderAndGetRenderReport()
  }

  onBoardPause() {
    this.updatePlayButtonComponentHack()
  }

  togglePlayAllCommand() {
    this.isRunning ? this.stopAllIntervals() : this.startAllIntervals()
    this.updatePlayButtonComponentHack()
  }

  pauseAllCommand() {
    if (this.isRunning) {
      this.stopAllIntervals()
      this.updatePlayButtonComponentHack()
    }
  }

  changeAgentBrushCommand(agent) {
    if (agent === this._agentToInsert) {
      this._agentToInsert = undefined
      return this
    }
    this._agentToInsert = agent
    return this
  }

  get agentToInsert() {
    return this._agentToInsert
  }

  selection = []

  moveSelection(x, y) {
    const { selection } = this
    if (!selection.length) return this
    selection.forEach(node => {
      node.direction = { x, y }
      node._move()
    })

    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.nuke())
    this.selection = []
    // todo: update any state?
  }

  get isSnapshotOn() {
    // technically also needs width and height settings
    return new TreeNode(this.simCode).has(Keywords.seed)
  }

  // Save the current random play for reproducibility and shareability
  snapShotCommand() {
    const newCode = new TreeNode(this.simCode)
    const boards = this.boards

    // todo: buggy. we should rename the board class to experiment, or rename experiment keyword to board.
    const board = boards[0]
    newCode.set(Keywords.seed, board.seed.toString())
    newCode.set(Keywords.height, board.height.toString())
    newCode.set(Keywords.width, board.width.toString())
    newCode.findNodes(Keywords.experiment).forEach((experiment, index) => {
      const board = boards[index]
      experiment.set(Keywords.seed, board.seed.toString())
      experiment.set(Keywords.height, board.height.toString())
      experiment.set(Keywords.width, board.width.toString())
    })

    this.editor.setCodeMirrorValue(newCode.toString())
    this.updateLocalStorage(newCode)
  }

  async toggleHelpCommand() {
    this.toggleAndRender(HelpModalComponent.name)
  }

  clearSelectionCommand() {
    this.selection.forEach(object => object.unselect())
    this.selection = []
    this.ensureRender()
  }

  selectAllCommand() {
    this.selection = []
    this.boards.forEach(board => {
      board.agents.forEach(agent => {
        agent.select()
        this.selection.push(agent)
      })
    })
    this.ensureRender()
  }

  _getKeyboardShortcuts() {
    return {
      space: () => this.togglePlayAllCommand(),
      d: () => this.toggleTreeComponentFrameworkDebuggerCommand(),
      c: () => this.exportDataCommand(),
      o: () => this.openReportInOhayoCommand(),
      r: () => this.resetAllCommand(),
      s: () => this.snapShotCommand(),
      up: () => this.moveSelection(0, -1),
      down: () => this.moveSelection(0, 1),
      right: () => this.moveSelection(1, 0),
      left: () => this.moveSelection(-1, 0),
      escape: () => this.clearSelectionCommand(),
      "command+a": () => this.selectAllCommand(),
      "?": () => this.toggleHelpCommand(),
      ",": () => this.goBackOneTickCommand(),
      ".": () => this.advanceOneTickCommand(),
      backspace: () => this.deleteSelectionCommand()
    }
  }

  resizeEditorCommand(newSize = "100") {
    this.editor.setWord(1, newSize)
    this.boards.forEach(board => board.set("leftStartPosition", newSize))

    if (!this.isNodeJs()) localStorage.setItem(LocalStorageKeys.editorStartWidth, newSize)
    this.renderAndGetRenderReport()
  }
}

const SIZES = {}

SIZES.BOARD_MARGIN = 20
SIZES.TOP_BAR_HEIGHT = 28
SIZES.BOTTOM_BAR_HEIGHT = 40
SIZES.CHROME_HEIGHT = SIZES.TOP_BAR_HEIGHT + SIZES.BOTTOM_BAR_HEIGHT + SIZES.BOARD_MARGIN
SIZES.TITLE_HEIGHT = 20

SIZES.EDITOR_WIDTH = 250
SIZES.RIGHT_BAR_WIDTH = 30

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const editorStartWidth =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LocalStorageKeys.editorStartWidth) ?? SIZES.EDITOR_WIDTH
      : SIZES.EDITOR_WIDTH
  const startState = new TreeNode(`${githubTriangleComponent.name}
${TopBarComponent.name}
 ${LogoComponent.name}
 ${ShareComponent.name}
 ${ExamplesComponent.name}
${BottomBarComponent.name}
 ${ResetButtonComponent.name}
 ${PlayButtonComponent.name}
 ${ReportButtonComponent.name}
${RightBarComponent.name}
 ${AgentPaletteComponent.name}
${SimEditorComponent.name} ${editorStartWidth} ${SIZES.CHROME_HEIGHT}
 value
  ${simojiCode.replace(/\n/g, "\n  ")}
${EditorHandleComponent.name}
${TitleComponent.name}`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendExperiments()
  return app
}

window.SimojiApp = SimojiApp





class TitleComponent extends AbstractTreeComponentParser {
  get question() {
    return this.app.mainExperiment.get(Keywords.question) ?? ""
  }

  get app() {
    return this.root
  }

  getDependencies() {
    return [this.app.firstProgram]
  }

  toStumpCode() {
    return `div 
 class ${TitleComponent.name}
 style left:${this.app.leftStartPosition + 10}px;
 div ${this.question}
  class Question`
  }
}

window.TitleComponent = TitleComponent







class TopBarComponent extends AbstractTreeComponentParser {
  createParserCombinator() {
    return new TreeNode.ParserCombinator(undefined, {
      LogoComponent,
      ShareComponent,
      ExamplesComponent
    })
  }
}

class LogoComponent extends AbstractTreeComponentParser {
  toStumpCode() {
    return `a ❔
 href cheatSheet.html
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.root.toggleHelpCommand()
  }
}

window.TopBarComponent = TopBarComponent

window.LogoComponent = LogoComponent


const Keywords = {}

Keywords.experiment = "experiment"
Keywords.seed = "seed"
Keywords.height = "height"
Keywords.width = "width"
Keywords.report = "report"
Keywords.ticksPerSecond = "ticksPerSecond"
Keywords.style = "style"

Keywords.onHit = "onHit"
Keywords.onTick = "onTick"
Keywords.onDeath = "onDeath"
Keywords.onExtinct = "onExtinct"

Keywords.question = "question"

const LocalStorageKeys = {}

LocalStorageKeys.simoji = "simoji"
LocalStorageKeys.editorStartWidth = "editorStartWidth"

const UrlKeys = {}

UrlKeys.simoji = "simoji"
UrlKeys.example = "example"
UrlKeys.url = "url"

const ParserTypes = {}

ParserTypes.agentDefinitionParser = "agentDefinitionParser"
ParserTypes.experimentParser = "experimentParser"
ParserTypes.settingDefinitionParser = "settingDefinitionParser"
ParserTypes.abstractInjectCommandParser = "abstractInjectCommandParser"

window.Keywords = Keywords

window.LocalStorageKeys = LocalStorageKeys

window.UrlKeys = UrlKeys

window.ParserTypes = ParserTypes


const DEFAULT_SIM = "fire"






class BrowserGlue extends AbstractTreeComponentParser {
  async fetchAndLoadSimCodeFromUrlCommand(url) {
    const simCode = await this.fetchText(url)
    return simCode
  }

  async fetchText(url) {
    const result = await fetch(url)
    const text = await result.text()
    return text
  }

  getFromLocalStorage() {
    return localStorage.getItem(LocalStorageKeys.simoji)
  }

  async fetchSimCode() {
    const hash = this.willowBrowser.getHash().substr(1)
    const deepLink = new TreeNode(decodeURIComponent(hash))
    const example = deepLink.get(UrlKeys.example)
    const fromUrl = deepLink.get(UrlKeys.url)
    const simojiCode = deepLink.getNode(UrlKeys.simoji)

    if (fromUrl) return this.fetchAndLoadSimCodeFromUrlCommand(fromUrl)
    if (example) return this.getExample(example)
    if (simojiCode) return simojiCode.childrenToString()

    const localStorageCode = this.getFromLocalStorage()
    if (localStorageCode) return localStorageCode

    return this.getExample(DEFAULT_SIM)
  }

  getExample(id) {
    return ExampleSims.has(id) ? ExampleSims.getNode(id).childrenToString() : `comment Example '${id}' not found.`
  }

  async fetchSimGrammarAndExamplesAndInit() {
    const grammar = await fetch("dist/simoji.grammar")
    const grammarCode = await grammar.text()

    const result = await fetch("examples")
    return this.init(grammarCode, await result.text())
  }

  async init(grammarCode, theExamples) {
    window.simojiParser = new HandGrammarProgram(grammarCode).compileAndReturnRootParser()
    ExampleSims.setChildren(theExamples)

    const simCode = await this.fetchSimCode()

    window.app = SimojiApp.setupApp(simCode, window.innerWidth, window.innerHeight)
    window.app.start()
    return window.app
  }
}

window.BrowserGlue = BrowserGlue
