const yodash = {}




yodash.parseInts = (arr, start) => arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = randomNumberGenerator => {
  const r1 = randomNumberGenerator()
  const r2 = randomNumberGenerator()
  if (r1 > 0.5) return r2 > 0.5 ? Directions.North : Directions.South
  return r2 > 0.5 ? Directions.West : Directions.East
}

yodash.flipAngle = angle => {
  let newAngle = ""
  if (angle.includes(Directions.North)) newAngle += Directions.South
  else if (angle.includes(Directions.South)) newAngle += Directions.North
  if (angle.includes(Directions.East)) newAngle += Directions.West
  else if (angle.includes(Directions.West)) newAngle += Directions.East
  return newAngle
}

yodash.compare = (left, operator, right) => {
  if (operator === "=") return left == right
  if (operator === "<") return left < right
  if (operator === ">") return left > right
  if (operator === "<=") return left <= right
  if (operator === ">=") return left >= right

  return false
}

yodash.compileAgentClassDeclarationsAndMap = program => {
  const clone = program.clone()
  clone.filter(node => node.parserId !== ParserTypes.agentDefinitionParser).forEach(node => node.destroy())
  clone.agentKeywordMap = {}
  clone.agentTypes.forEach((node, index) => (clone.agentKeywordMap[node.firstWord] = `simAgent${index}`))
  const compiled = clone.compile()
  const agentMap = Object.keys(clone.agentKeywordMap)
    .map(key => `"${key}":${clone.agentKeywordMap[key]}`)
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

yodash.getBestAngle = (targets, position) => {
  let closest = Infinity
  let target
  targets.forEach(candidate => {
    const pos = candidate.position
    const distance = math.distance([pos.down, pos.right], [position.down, position.right])
    if (distance < closest) {
      closest = distance
      target = candidate
    }
  })
  const heading = target.position
  return yodash.angle(position.down, position.right, heading.down, heading.right)
}

yodash.angle = (cx, cy, ex, ey) => {
  const dy = ey - cy
  const dx = ex - cx
  let theta = Math.atan2(dy, dx) // range (-PI, PI]
  theta *= 180 / Math.PI // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  let angle = ""

  if (Math.abs(theta) > 90) angle += Directions.North
  else angle += Directions.South
  if (theta < 0) angle += Directions.West
  else angle += Directions.East
  return angle
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

class Agent extends TreeNode {
  get name() {
    return this._name ?? this.icon
  }

  angle = Directions.South

  getCommandBlocks(eventName) {
    return this.definitionWithBehaviors.findNodes(eventName)
  }

  get definitionWithBehaviors() {
    if (!this.behaviors.length) return this.board.simojiProgram.getNode(this.firstWord)
    const behaviors = yodash.flatten(yodash.pick(this.board.simojiProgram, [this.firstWord, ...this.behaviors]))
    return behaviors
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
    this.parent.appendLine(`${newObject} ${this.positionHash}`)

    this.remove()
  }

  _move() {
    if (this.owner) return this

    const { angle } = this
    if (angle.includes(Directions.North)) this.moveNorth()
    else if (angle.includes(Directions.South)) this.moveSouth()
    if (angle.includes(Directions.East)) this.moveEast()
    else if (angle.includes(Directions.West)) this.moveWest()

    if (this.holding) {
      this.holding.forEach(node => {
        node.setPosition({ right: this.left, down: this.top })
      })
    }
  }

  moveSouth() {
    this.top++
  }

  moveNorth() {
    this.top--
  }

  moveWest() {
    this.left--
  }

  moveEast() {
    this.left++
  }

  get top() {
    return this.position.down
  }

  set top(value) {
    if (value > this.maxDown) value = this.maxDown
    if (value < 0) value = 0
    this.setPosition({
      down: value,
      right: this.left
    })
  }

  get board() {
    return this.parent
  }

  // ZZZZ
  setPosition(newPosition) {
    if (!this.worldMap.canGoHere(newPosition, this.agentSize)) return this.bouncy ? this.bounce() : this
    const newLine = this.getLine()
      .split(" ")
      .map(part =>
        part.includes("⬇️") ? newPosition.down + "⬇️" : part.includes("➡️") ? newPosition.right + "➡️" : part
      )
      .join(" ")
    return this.setLine(newLine)
  }

  handleNeighbors() {
    if (!this.stillExists) return

    this.getCommandBlocks(Keywords.onNeighbors).forEach(neighborConditions => {
      if (this.skip(neighborConditions.getWord(1))) return

      const { neighorCount } = this

      neighborConditions.forEach(conditionAndCommandsBlock => {
        const [emoji, operator, count] = conditionAndCommandsBlock.words
        const actual = neighorCount[emoji]
        if (!yodash.compare(actual ?? 0, operator, count)) return
        conditionAndCommandsBlock.forEach(command => this._executeCommand(this, command))

        if (this.getIndex() === -1) return {}
      })
    })
  }

  // ZZZZ
  handleTouches() {
    if (!this.stillExists) return
    const { worldMap } = this
    this.getCommandBlocks(Keywords.onTouch).forEach(touchMap => {
      if (this.skip(touchMap.getWord(1))) return

      for (let pos of worldMap.positionsAdjacentTo(this.position)) {
        const hits = worldMap.objectsAtPosition(worldMap.makePositionHash(pos))
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

  // ZZZZ
  handleOverlaps(targets) {
    if (!this.stillExists) return
    this.getCommandBlocks(Keywords.onHit).forEach(hitMap => {
      if (this.skip(hitMap.getWord(1))) return
      targets.forEach(target => {
        const targetId = target.getWord(0)
        const commandBlock = hitMap.getNode(targetId)
        if (commandBlock) commandBlock.forEach(command => this._executeCommand(target, command))
      })
    })
  }

  // ZZZZ
  get overlappingAgents() {
    return this.worldMap.objectsAtPosition(this.positionHash).filter(node => node !== this)
  }

  get neighorCount() {
    return this.worldMap.getNeighborCount(this.position)
  }

  // ZZZZ minus size?
  get maxRight() {
    return this.board.cols
  }

  get maxDown() {
    return this.board.rows
  }

  set left(value) {
    if (value > this.maxRight) value = this.maxRight

    if (value < 0) value = 0
    this.setPosition({
      down: this.top,
      right: value
    })
  }

  get left() {
    return this.position.right
  }

  get position() {
    return this.worldMap.parsePosition(this.words)
  }

  get positionHash() {
    return this.worldMap.makePositionHash(this.position)
  }

  get gridSize() {
    return this.parent.gridSize
  }

  get worldMap() {
    return this.board.worldMap
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
    this.element.remove()
    this.destroy()
  }

  get element() {
    return document.getElementById(`agent${this._getUid()}`)
  }

  _updateHtml() {
    this.element.setAttribute("style", this.inlineStyle)
    if (this.selected) this.element.classList.add(SelectedClass)
    else this.element.classList.remove(SelectedClass)
  }

  get inlineStyle() {
    const { gridSize, health, agentSize } = this
    const opacity = health === undefined ? "" : `opacity:${this.health / this.startHealth};`
    return `top:${this.top * gridSize}px;left:${
      this.left * gridSize
    }px;font-size:${agentSize}px;line-height:${agentSize}px;${opacity};${this.style ?? ""}`
  }

  toElement() {
    const elem = document.createElement("div")
    elem.setAttribute("id", `agent${this._getUid()}`)
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
    target.angle = this.angle
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

  moveToEmptySpot() {
    while (this.overlappingAgents.length) {
      this.move()
    }
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
    return parseInt(this.getWord(1))
  }

  get rows() {
    return parseInt(this.getWord(2))
  }

  get cols() {
    return parseInt(this.getWord(3))
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

  /// ZZZZZ
  insertAgentAtCommand(right, down) {
    const root = this.root
    const positionHash = down + " " + right
    this.resetWorldMap()
    const { agentToInsert } = root

    if (!agentToInsert) return

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    this.prependLine(`${agentToInsert} ${positionHash}`)
    this.renderAndGetRenderReport()
    this.resetWorldMap()

    if (!root.isSnapshotOn) root.snapShotCommand()

    const allCode = new TreeNode(root.simCode)
    let targetNode = root.boards.length === 1 ? allCode : allCode.findNodes("experiment")[this.boardIndex]

    if (this.tick) targetNode = targetNode.appendLine(`atTime ${this.tick}`)
    targetNode.appendLine(`insertAt ${agentToInsert} ${down} ${right}`)
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

    this.resetWorldMap()
    this.handleOverlaps()
    this.handleTouches()
    this.handleNeighbors()

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

  insertClusterParser(commandNode) {
    this.concat(
      this.worldMap.insertClusteredRandomAgents(
        this.randomNumberGenerator,
        parseInt(commandNode.getWord(1)),
        commandNode.getWord(2),
        this.rows,
        this.cols,
        commandNode.getWord(3),
        commandNode.getWord(4)
      )
    )
    this.resetWorldMap()
  }

  insertAtParser(commandNode) {
    this.appendLine(`${commandNode.getWord(1)} ${commandNode.getWord(3)} ${commandNode.getWord(2)}`)
    this.resetWorldMap()
  }

  rectangleDrawParser(commandNode) {
    const newLines = this.worldMap.makeRectangle(...yodash.parseInts(commandNode.words.slice(1), 1))
    this.concat(newLines)
    this.resetWorldMap()
  }

  pasteDrawParser(commandNode) {
    const newSpots = new TreeNode(commandNode.childrenToString())
    this.concat(newSpots)
    this.resetWorldMap()
  }

  fillParser(commandNode) {
    this.concat(this.worldMap.fill(this.rows, this.cols, commandNode.getWord(1)))
    this.resetWorldMap()
  }

  drawParser(commandNode) {
    this.concat(this.worldMap.draw(commandNode.childrenToString()))
    this.resetWorldMap()
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
    const { rows, cols, worldMap } = this
    const emoji = commandNode.getWord(2)
    let amount = commandNode.getWord(1)

    const availableSpots = this.worldMap.getAllAvailableSpots(rows, cols)
    amount = amount.includes("%") ? yodash.parsePercent(amount) * (rows * cols) : parseInt(amount)
    const newAgents = yodash
      .sampleFrom(availableSpots, amount, this.randomNumberGenerator)
      .map(spot => {
        const { hash } = spot
        worldMap.occupiedSpots.add(hash)
        return `${emoji} ${hash}`
      })
      .join("\n")
    this.concat(newAgents)
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

  get worldMap() {
    if (!this._worldMap) this.resetWorldMap()
    return this._worldMap
  }

  resetWorldMap() {
    this._worldMap = new WorldMap(this.agents)
  }

  // YY
  handleOverlaps() {
    this.worldMap.overlappingAgents.forEach(nodes => nodes.forEach(node => node.handleOverlaps(nodes)))
  }

  // YY
  handleTouches() {
    this.agents.forEach(node => node.handleTouches())
  }

  // YY
  handleNeighbors() {
    this.agents.forEach(node => node.handleNeighbors())
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
    this.appendLine(
      `${command.getWord(1)} ${this.worldMap.getRandomLocationHash(this.rows, this.cols, this.randomNumberGenerator)}`
    )
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
👾 Game of Life
 gameOfLife
 gospersGliderGun
 gameOfLifeAdvanced
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
  gridClickCommand(right, down) {
    return this.parent.insertAgentAtCommand(right + "➡️", down + "⬇️")
  }

  evtToRightDown(evt) {
    if (this.isNodeJs()) return { right: 1, down: 1 }

    const { offsetX, offsetY } = evt
    const el = jQuery(evt.target)
    const height = el.height()
    const width = el.width()
    const { cols, rows, gridSize } = this.parent

    const right = Math.round((offsetX / width) * cols)
    const down = Math.round((offsetY / height) * rows)

    return { right, down }
  }

  treeComponentDidMount() {
    const that = this
    if (this.isNodeJs()) return super.treeComponentDidMount()

    jQuery(`.${GridComponent.name}`).on("click", function (evt) {
      const { right, down } = that.evtToRightDown(evt)
      that.gridClickCommand(right, down)
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






















const MIN_GRID_SIZE = 10
const MAX_GRID_SIZE = 200
const DEFAULT_GRID_SIZE = 20
const MIN_GRID_COLUMNS = 10
const MIN_GRID_ROWS = 10

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
    const setSize = simojiProgram.get(Keywords.size)
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : DEFAULT_GRID_SIZE, MIN_GRID_SIZE), MAX_GRID_SIZE)

    const chromeWidth = this.leftStartPosition + SIZES.RIGHT_BAR_WIDTH + SIZES.BOARD_MARGIN
    const maxAvailableCols = Math.floor((windowWidth - chromeWidth) / gridSize) - 1
    const maxAvailableRows = Math.floor((windowHeight - SIZES.CHROME_HEIGHT - SIZES.TITLE_HEIGHT) / gridSize) - 1

    const setCols = simojiProgram.get(Keywords.columns)
    const cols = Math.max(1, setCols ? parseInt(setCols) : Math.max(MIN_GRID_COLUMNS, maxAvailableCols))

    const setRows = simojiProgram.get(Keywords.rows)
    const rows = Math.max(1, setRows ? parseInt(setRows) : Math.max(MIN_GRID_ROWS, maxAvailableRows))

    return { gridSize, cols, rows }
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
    const { gridSize, cols, rows } = this.makeGrid(program, windowWidth, windowHeight)

    const styleNode = program.getNode(Keywords.style) ?? undefined
    const board = this.appendLineAndChildren(
      `${BoardComponent.name} ${gridSize} ${rows} ${cols} ${index}`,
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
    if (!this.isSnapshotOn) this.snapShotCommand()
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

  moveSelection(direction) {
    const { selection } = this
    if (!selection.length) return this
    selection.forEach(node => {
      node.angle = direction
      node._move()
    })


    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.nuke())
    this.selection = []
    this.boards.forEach(board => board.resetAgentPositionMap())
  }

  get isSnapshotOn() {
    // technically also needs rows and column settings
    return new TreeNode(this.simCode).has(Keywords.seed)
  }

  // Save the current random play for reproducibility and shareability
  snapShotCommand() {
    const newCode = new TreeNode(this.simCode)
    const boards = this.boards

    // todo: buggy. we should rename the board class to experiment, or rename experiment keyword to board.
    const board = boards[0]
    newCode.set(Keywords.seed, board.seed.toString())
    newCode.set(Keywords.rows, board.rows.toString())
    newCode.set(Keywords.columns, board.cols.toString())
    newCode.findNodes(Keywords.experiment).forEach((experiment, index) => {
      const board = boards[index]
      experiment.set(Keywords.seed, board.seed.toString())
      experiment.set(Keywords.rows, board.rows.toString())
      experiment.set(Keywords.columns, board.cols.toString())
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
      up: () => this.moveSelection(Directions.North),
      down: () => this.moveSelection(Directions.South),
      right: () => this.moveSelection(Directions.East),
      left: () => this.moveSelection(Directions.West),
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
Keywords.size = "size"
Keywords.rows = "rows"
Keywords.columns = "columns"
Keywords.report = "report"
Keywords.ticksPerSecond = "ticksPerSecond"
Keywords.style = "style"

Keywords.onNeighbors = "onNeighbors"
Keywords.onTouch = "onTouch"
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

const Directions = {}

Directions.North = "North"
Directions.East = "East"
Directions.South = "South"
Directions.West = "West"

const ParserTypes = {}

ParserTypes.agentDefinitionParser = "agentDefinitionParser"
ParserTypes.experimentParser = "experimentParser"
ParserTypes.settingDefinitionParser = "settingDefinitionParser"
ParserTypes.abstractInjectCommandParser = "abstractInjectCommandParser"

window.Keywords = Keywords

window.LocalStorageKeys = LocalStorageKeys

window.UrlKeys = UrlKeys

window.Directions = Directions

window.ParserTypes = ParserTypes




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

window.WorldMap = WorldMap


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
    const grammar = await fetch("simoji.grammar")
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
