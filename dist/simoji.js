const yodash = {}



yodash.parseInts = (arr, start) => arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = randomNumberGenerator => {
	const r1 = randomNumberGenerator()
	const r2 = randomNumberGenerator()
	if (r1 > 0.5) return r2 > 0.5 ? "North" : "South"
	return r2 > 0.5 ? "West" : "East"
}

yodash.flipAngle = angle => {
	let newAngle = ""
	if (angle.includes("North")) newAngle += "South"
	else if (angle.includes("South")) newAngle += "North"
	if (angle.includes("East")) newAngle += "West"
	else if (angle.includes("West")) newAngle += "East"
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
	clone.filter(node => node.getNodeTypeId() !== "agentNode").forEach(node => node.destroy())
	clone.agentKeywordMap = {}
	clone.agentTypes.forEach((node, index) => (clone.agentKeywordMap[node.getWord(0)] = `simAgent${index}`))
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
	clone.filter(node => node.getNodeTypeId() === "experimentNode").forEach(node => node.destroy())
	// Append current experiment
	if (experiment) clone.concat(experiment.childrenToString())
	// Build symbol table
	const symbolTable = {}
	clone
		.filter(node => node.getNodeTypeId() === "settingDefinitionNode")
		.forEach(node => {
			symbolTable[node.getWord(0)] = node.getContent()
			node.destroy()
		})
	// Find and replace
	let withVarsReplaced = clone.toString()
	Object.keys(symbolTable).forEach(key => {
		withVarsReplaced = withVarsReplaced.replaceAll(key, symbolTable[key])
	})
	return withVarsReplaced
}

yodash.compileBoardStartState = (program, rows, cols, randomNumberGenerator) => {
	const clone = program.clone()
	const excludeTypes = ["blankLineNode", "settingDefinitionNode", "agentNode"]
	clone.filter(node => excludeTypes.includes(node.getNodeTypeId())).forEach(node => node.destroy())
	clone.occupiedSpots = new Set()
	clone.randomNumberGenerator = randomNumberGenerator
	clone.rows = rows
	clone.cols = cols
	clone.yodash = yodash
	return clone.compile()
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

	if (Math.abs(theta) > 90) angle += "North"
	else angle += "South"
	if (theta < 0) angle += "West"
	else angle += "East"
	return angle
}

yodash.getRandomLocation = (rows, cols, randomNumberGenerator) => {
	const maxRight = cols
	const maxBottom = rows
	const right = Math.round(randomNumberGenerator() * maxRight)
	const down = Math.round(randomNumberGenerator() * maxBottom)
	return { right, down }
}

yodash.getRandomLocationHash = (rows, cols, occupiedSpots, randomNumberGenerator) => {
	const { right, down } = yodash.getRandomLocation(rows, cols, randomNumberGenerator)
	const hash = yodash.makePositionHash({ right, down })
	if (occupiedSpots && occupiedSpots.has(hash))
		return yodash.getRandomLocationHash(rows, cols, occupiedSpots, randomNumberGenerator)
	return hash
}

yodash.fill = (rows, cols, occupiedSpots, emoji) => {
	const board = []
	while (rows >= 0) {
		let col = cols
		while (col >= 0) {
			const hash = yodash.makePositionHash({ right: col, down: rows })
			col--
			if (occupiedSpots.has(hash)) continue
			board.push(`${emoji} ${hash}`)
		}
		rows--
	}
	return board.join("\n")
}

yodash.positionsAdjacentTo = position => {
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

yodash.makePositionHash = position => `${position.down + "⬇️ " + position.right + "➡️"}`

yodash.makeRectangle = (character = "🧱", width = 20, height = 20, startRight = 0, startDown = 0) => {
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
					`${character} ${yodash.makePositionHash({
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

yodash.parsePosition = words => {
	return {
		down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
		right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
	}
}

yodash.updateOccupiedSpots = (board, occupiedSpots) => {
	new TreeNode(board).forEach(line => {
		occupiedSpots.add(yodash.makePositionHash(yodash.parsePosition(line.getWords())))
	})
}

yodash.getAllAvailableSpots = (rows, cols, occupiedSpots, rowStart = 0, colStart = 0) => {
	const availablePositions = []
	let down = rows
	while (down >= rowStart) {
		let right = cols
		while (right >= colStart) {
			const hash = yodash.makePositionHash({ right, down })
			if (!occupiedSpots.has(hash)) availablePositions.push({ right, down, hash })
			right--
		}
		down--
	}
	return availablePositions
}

yodash.parsePercent = str => parseFloat(str.replace("%", "")) / 100

yodash.insertRandomAgents = (randomNumberGenerator, amount, char, rows, cols, occupiedSpots) => {
	const availableSpots = yodash.getAllAvailableSpots(rows, cols, occupiedSpots)
	amount = amount.includes("%") ? yodash.parsePercent(amount) * (rows * cols) : parseInt(amount)
	return sampleFrom(availableSpots, amount, randomNumberGenerator)
		.map(spot => {
			const { hash } = spot
			occupiedSpots.add(hash)
			return `${char} ${hash}`
		})
		.join("\n")
}

yodash.insertClusteredRandomAgents = (
	randomNumberGenerator,
	amount,
	char,
	rows,
	cols,
	occupiedSpots,
	originRow,
	originColumn
) => {
	const availableSpots = yodash.getAllAvailableSpots(rows, cols, occupiedSpots)
	const spots = sampleFrom(availableSpots, amount * 10, randomNumberGenerator)
	const origin = originColumn
		? { down: parseInt(originRow), right: parseInt(originColumn) }
		: yodash.getRandomLocation(rows, cols, randomNumberGenerator)
	const sortedByDistance = lodash.sortBy(spots, spot =>
		math.distance([origin.down, origin.right], [spot.down, spot.right])
	)

	return sortedByDistance
		.slice(0, amount)
		.map(spot => {
			const { hash } = spot
			occupiedSpots.add(hash)
			return `${char} ${hash}`
		})
		.join("\n")
}

yodash.getRandomNumberGenerator = seed => () => {
	const semiRand = Math.sin(seed++) * 10000
	return semiRand - Math.floor(semiRand)
}

const sampleFrom = (collection, howMany, randomNumberGenerator) =>
	shuffleArray(collection, randomNumberGenerator).slice(0, howMany)

const shuffleArray = (array, randomNumberGenerator) => {
	const clonedArr = array.slice()
	for (let index = clonedArr.length - 1; index > 0; index--) {
		const replacerIndex = Math.floor(randomNumberGenerator() * (index + 1))
		;[clonedArr[index], clonedArr[replacerIndex]] = [clonedArr[replacerIndex], clonedArr[index]]
	}
	return clonedArr
}

window.yodash = yodash






class Agent extends jtree.TreeNode {
  get name() {
    return this._name ?? this.icon
  }

  angle = "South"

  getCommandBlocks(eventName) {
    return this.board.simojiProgram.getNode(this.getWord(0)).findNodes(eventName)
  }

  get definitionWithBehaviors() {
    if (!this.behaviors.length) return this.board.simojiProgram.getNode(this.getWord(0))
    return flatten(pick(this.board.simojiProgram, [this.getWord(0), ...this.behaviors]))
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
    this.board.appendLine(`${command.getWord(1)} ${subject.positionHash}`)
  }

  move() {
    if (this.selected) return
    return this._move()
  }

  jitter() {
    this.turnRandomly()
    this.move()
  }
}

window.Agent = Agent




class AgentPaletteComponent extends AbstractTreeComponent {
  toStumpCode() {
    const root = this.getRootNode()
    const { agentToInsert } = root
    const items = root.simojiPrograms[0].agentTypes
      .map(item => item.getWord(0))
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

  changeAgentBrushCommand(x) {
    this.getRootNode().changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.getRootNode().board]
  }
}

window.AgentPaletteComponent = AgentPaletteComponent








let nodeJsPrefix = ""

// prettier-ignore

class BoardErrorNode extends AbstractTreeComponent {
  _isErrorNodeType() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: Board does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

class leftStartPosition extends jtree.TreeNode {
  get width() {
    return parseInt(this.getWord(1))
  }
}

class BoardComponent extends AbstractTreeComponent {
  // override default parser creation.
  _getParser() {
    if (!this._parser)
      this._parser = new jtree.TreeNode.Parser(BoardErrorNode, {
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
    const csv = new TreeNode(this._populationCounts).toCsv()
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

  tick = 0
  boardLoop() {
    this.agents.forEach(node => node.onTick())

    this.resetAgentPositionMap()
    this.handleCollisions()
    this.handleTouches()
    this.handleNeighbors()

    this.executeBoardCommands("onTick")
    this.handleExtinctions()

    this.renderAndGetRenderReport()

    this.tick++
    this._populationCounts.push(this.populationCount)

    if (this.resetAfterLoop) {
      this.resetAfterLoop = false
      this.getRootNode().resetAllCommand()
    }
  }

  renderAndGetRenderReport(stumpNode, index) {
    const isMounted = this.isMounted()
    const report = super.renderAndGetRenderReport(stumpNode, index)
    if (!isMounted) this.appendAgents(this.agents)
    else this.updateAgents()
    return report
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
    return this.getParent()
  }

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get("ticksPerSecond")
    return setTime ? parseInt(setTime) : 10
  }

  handleExtinctions() {
    this.simojiProgram.findNodes("onExtinct").forEach(commands => {
      const emoji = commands.getWord(1)
      if (emoji && this.has(emoji)) return
      commands.forEach(instruction => {
        this[instruction.getWord(0)](instruction)
      })
    })
  }

  executeBoardCommands(key) {
    this.simojiProgram.findNodes(key).forEach(commands => {
      const probability = commands.getWord(1)
      if (probability && this.randomNumberGenerator() > parseFloat(probability)) return
      commands.forEach(instruction => {
        this[instruction.getWord(0)](instruction)
      })
    })
  }

  isSolidAgent(position) {
    if (!this._solidsSet) {
      this._solidsSet = new Set()
      this.getTopDownArray()
        .filter(node => node.solid)
        .forEach(item => {
          this._solidsSet.add(item.positionHash)
        })
    }
    const hash = yodash.makePositionHash(position)
    if (this._solidsSet.has(hash)) return true

    return false
  }

  get agents() {
    return this.getTopDownArray().filter(node => node instanceof Agent)
  }

  get agentPositionMap() {
    if (!this._agentPositionMap) this.resetAgentPositionMap()
    return this._agentPositionMap
  }

  resetAgentPositionMap() {
    this._agentPositionMap = this.makeAgentPositionMap()
  }

  makeAgentPositionMap() {
    const map = new Map()
    this.agents.forEach(node => {
      const { positionHash } = node
      if (!map.has(positionHash)) map.set(positionHash, [])
      map.get(positionHash).push(node)
    })
    return map
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

  agentAt(position) {
    const hits = this.agentPositionMap.get(position)
    return hits ? hits[0] : undefined
  }

  handleCollisions() {
    this.agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap
    this.agents.forEach(node => node.handleTouches(agentPositionMap))
  }

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
    return `div
 style ${this.style}
 class ${this.getCssClassNames().join(" ")}`
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
      `${command.getWord(1)} ${yodash.getRandomLocationHash(
        this.rows,
        this.cols,
        undefined,
        this.randomNumberGenerator
      )}`
    )
  }

  alert(command) {
    const message = command.getContent()
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
    this.root.log(command.getContent())
  }
}

class BoardStyleComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(TreeNode)
  }

  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

window.BoardComponent = BoardComponent








class BottomBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      PlayButtonComponent,
      ReportButtonComponent,
      ResetButtonComponent
    })
  }
}

window.BottomBarComponent = BottomBarComponent




const makeResizableDiv = (element, callback, stopResizeCallback) => {
  // Based off an entertaining read:
  // medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d
  let originalLeft = 0
  let originalMouseX = 0

  element.addEventListener("mousedown", evt => {
    evt.preventDefault()
    originalLeft = element.getBoundingClientRect().left
    originalMouseX = evt.pageX
    window.addEventListener("mousemove", resize)
    window.addEventListener("mouseup", stopResize)
  })

  const resize = evt => {
    const dragAmount = evt.pageX - originalMouseX
    const newLeft = originalLeft + dragAmount
    callback(newLeft)
  }

  const stopResize = () => {
    window.removeEventListener("mousemove", resize)
    window.removeEventListener("mouseup", stopResize)
    stopResizeCallback()
  }
}

class EditorHandleComponent extends AbstractTreeComponent {
  get left() {
    return this.getRootNode().editor.width
  }

  makeDraggable() {
    if (this.isNodeJs()) return
    makeResizableDiv(
      this.getStumpNode().getShadow().element,
      newLeft => this.getRootNode().resizeEditorCommand(Math.max(newLeft, 5) + ""),
      () => this.getRootNode().resetAllCommand()
    )
  }

  treeComponentDidMount() {
    this.makeDraggable()
  }

  treeComponentDidUpdate() {
    this.makeDraggable()
  }

  toStumpCode() {
    return `div
 class EditorHandleComponent
 style left:${this.left}px;`
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }
}

window.EditorHandleComponent = EditorHandleComponent




const ExampleSims = new jtree.TreeNode()

// prettier-ignore

window.ExampleSims = ExampleSims






class ExamplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const sims = ExampleSims.map(item => {
      const name = item.getFirstWord()
      const properName = jtree.Utils.ucfirst(name)
      const icon = item.childrenToString().match(/(\p{Extended_Pictographic}+)/u)[1]
      return ` a ${icon}
  href index.html#example%20${name}
  title ${properName}
  clickCommand loadExampleCommand ${name}`
    }).join("\n")
    return `div
 class ExamplesComponent
${sims}`
  }
}

window.ExamplesComponent = ExamplesComponent





class GridComponent extends AbstractTreeComponent {
  gridClickCommand(down, right) {
    const positionHash = down + " " + right
    const board = this.getParent()
    const root = board.getRootNode()
    const existingObject = board.agentAt(positionHash)
    if (existingObject) return root.toggleSelectCommand(existingObject)
    const { agentToInsert } = root

    if (!agentToInsert) return this

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    board.prependLine(`${agentToInsert} ${positionHash}`)
    board.renderAndGetRenderReport()
    board.resetAgentPositionMap()
  }

  makeBlock(down, right, gridSize) {
    return `\n div
  class block
  style width:${gridSize}px;height:${gridSize}px;top:${down * gridSize}px;left:${right * gridSize}px;
  clickCommand gridClickCommand ${yodash.makePositionHash({ right, down })}`
  }

  toStumpCode() {
    const { cols, rows, gridSize } = this.getParent()
    let blocks = ""
    let rs = rows
    while (rs >= 0) {
      let cs = cols
      while (cs >= 0) {
        blocks = this.makeBlock(rs, cs, gridSize) + blocks
        cs--
      }
      rs--
    }
    return (
      `div
 class GridComponent` + blocks
    )
  }
}

window.GridComponent = GridComponent





class AbstractModalTreeComponent extends AbstractTreeComponent {
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
    return new jtree.TreeNode(`section
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




class PlayButtonComponent extends AbstractTreeComponent {
  get isStarted() {
    return this.getRootNode().isRunning
  }

  toStumpCode() {
    return `span ${this.isStarted ? "&#10074;&#10074;" : "▶︎"}
 class PlayButtonComponent BottomButton
 clickCommand togglePlayAllCommand`
  }
}

window.PlayButtonComponent = PlayButtonComponent




class ReportButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Δ
 title Generate Report
 class ReportButtonComponent BottomButton
 clickCommand openReportInOhayoCommand`
  }
}

window.ReportButtonComponent = ReportButtonComponent




class ResetButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span ≪
 title Clear and reset
 class ResetButtonComponent BottomButton
 clickCommand resetAllCommand`
  }

  resetAllCommand() {
    this.getRootNode().pauseAllCommand()
    this.getRootNode().resetAllCommand()
  }
}

window.ResetButtonComponent = ResetButtonComponent






class RightBarComponent extends AbstractTreeComponent {
	createParser() {
		return new jtree.TreeNode.Parser(undefined, {
			AgentPaletteComponent
		})
	}
}

window.RightBarComponent = RightBarComponent




class ShareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class ShareComponent
 input
  readonly
  title ${this.link}
  value ${this.link}`
  }

  getDependencies() {
    return [this.getRootNode().simojiPrograms[0]]
  }

  get link() {
    const url = new URL(typeof location === "undefined" ? "http://localhost/" : location.href) // todo: TCF should provide shim for this
    url.hash = ""
    return url.toString() + this.getRootNode().urlHash
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

class SimEditorComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class SimEditorComponent
 style width:${this.width}px;
 textarea
  id EditorTextarea
 div &nbsp;
  clickCommand dumpErrorsCommand
  id codeErrorsConsole`
  }

  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      value: jtree.TreeNode
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
    const root = this.getRootNode()
    root.pauseAllCommand()
    // this._updateLocalStorage()

    this.program = new simojiCompiler(code)
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
            this.codeMirrorInstance.addLineWidget(err.getLineNumber() - 1, el, { coverGutter: false, noHScroll: false })
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
    this.getRootNode().loadNewSim(this._code)
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
    this.codeMirrorInstance = new jtree.TreeNotationCodeMirrorMode(
      "custom",
      () => simojiCompiler,
      undefined,
      CodeMirror
    )
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

class githubTriangleComponent extends AbstractTreeComponent {
  githubLink = `https://github.com/publicdomaincompany/simoji`
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

class ErrorNode extends AbstractTreeComponent {
  _isErrorNodeType() {
    return true
  }
  toStumpCode() {
    console.error(`Warning: SimojiApp does not have a node type for "${this.getLine()}"`)
    return `span
 style display: none;`
  }
}

let _defaultSeed = Date.now()
const newSeed = () => {
  _defaultSeed++
  return _defaultSeed
}

class SimojiApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(ErrorNode, {
      TopBarComponent,
      githubTriangleComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent,
      EditorHandleComponent
    })
  }

  resetAllCommand() {
    const restart = this.isRunning
    this.loadNewSim(this.simCode)
    if (restart) this.startAllIntervals()
  }

  makeGrid(simojiProgram, windowWidth, windowHeight) {
    const setSize = simojiProgram.get("size")
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : DEFAULT_GRID_SIZE, MIN_GRID_SIZE), MAX_GRID_SIZE)

    const chromeWidth = this.leftStartPosition + SIZES.RIGHT_BAR_WIDTH + SIZES.BOARD_MARGIN
    const maxAvailableCols = Math.floor((windowWidth - chromeWidth) / gridSize) - 1
    const maxAvailableRows = Math.floor((windowHeight - SIZES.CHROME_HEIGHT) / gridSize) - 1

    const setCols = simojiProgram.get("columns")
    const cols = Math.max(1, setCols ? parseInt(setCols) : Math.max(MIN_GRID_COLUMNS, maxAvailableCols))

    const setRows = simojiProgram.get("rows")
    const rows = Math.max(1, setRows ? parseInt(setRows) : Math.max(MIN_GRID_ROWS, maxAvailableRows))

    return { gridSize, cols, rows }
  }

  verbose = true

  compiledStartState = ""

  appendExperiments() {
    this.simojiPrograms.forEach((program, index) => {
      if (index > 3)
        // currently max out at 4 experiments. just need to update CSS transform code.
        return
      this._appendExperiment(program, index)
    })
  }

  _appendExperiment(program, index) {
    const { windowWidth, windowHeight } = this
    const { gridSize, cols, rows } = this.makeGrid(program, windowWidth, windowHeight)
    const seed = program.has("seed") ? parseInt(program.get("seed")) : newSeed()
    const randomNumberGenerator = yodash.getRandomNumberGenerator(seed)

    this.compiledStartState = ""
    try {
      this.compiledStartState = yodash.compileBoardStartState(program, rows, cols, randomNumberGenerator).trim()
    } catch (err) {
      if (this.verbose) console.error(err)
    }

    const styleNode = program.getNode("style") ?? undefined
    const board = this.appendLineAndChildren(
      `BoardComponent ${gridSize} ${rows} ${cols} ${index}`,
      `leftStartPosition ${this.leftStartPosition}\n${this.compiledStartState.trim()}
GridComponent
${styleNode ? styleNode.toString().replace("style", "BoardStyleComponent") : ""}`.trim()
    )
    board.seed = seed
    board.randomNumberGenerator = randomNumberGenerator
  }

  get leftStartPosition() {
    return this.editor.width
  }

  get editor() {
    return this.getNode("SimEditorComponent")
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
    localStorage.setItem("simoji", simCode)
    console.log("Local storage updated...")
  }

  dumpErrorsCommand() {
    const errs = new simojiCompiler(this.simCode).getAllErrors()
    console.log(new jtree.TreeNode(errs.map(err => err.toObject())).toFormattedTable(200))
  }

  get boards() {
    return this.findNodes("BoardComponent")
  }

  get board() {
    return this.boards[0]
  }

  get mainProgram() {
    return new simojiCompiler(this.simCode)
  }

  get simojiPrograms() {
    if (!this._simojiPrograms) {
      const { mainProgram } = this
      this._simojiPrograms = [yodash.patchExperimentAndReplaceSymbols(mainProgram)]
      mainProgram.findNodes("experiment").forEach(experiment => {
        this._simojiPrograms.push(yodash.patchExperimentAndReplaceSymbols(mainProgram, experiment))
      })
      // Evaluate the variables
      this._simojiPrograms = this._simojiPrograms.map(program => new simojiCompiler(program.toString()))
    }
    return this._simojiPrograms
  }

  startAllIntervals() {
    this.boards.forEach(board => board.startInterval())
  }

  stopAllIntervals() {
    this.boards.forEach(board => board.stopInterval())
  }

  advanceOneTickCommand() {
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
      willowBrowser.getMousetrap().bind(key, function(evt) {
        keyboardShortcuts[key]()
        // todo: handle the below when we need to
        if (evt.preventDefault) evt.preventDefault()
        return false
      })
    })

    this.willowBrowser.setResizeEndHandler(() => {
      console.log("resize")
      this.editor.setSize()
    })
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

  toggleSelectCommand(object) {
    if (this.selection.includes(object)) {
      object.unselect()
      this.selection = this.selection.filter(node => node !== object)
    } else {
      this.selection.push(object)
      object.select()
    }

    this.ensureRender()
    return this
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
    const tree = new jtree.TreeNode()
    tree.appendLineAndChildren("simoji", this.simCode ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }

  get report() {
    const report = this.mainProgram.getNode("report")
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
    this.getNode("BottomBarComponent PlayButtonComponent")
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

  // Save the current random play for reproducibility and shareability
  snapShotCommand() {
    const newCode = new jtree.TreeNode(this.simCode)
    const boards = this.boards
    const board = boards[0]
    console.log(board.seed, board.rows, board.cols)
    newCode.set("seed", board.seed.toString())
    newCode.set("rows", board.rows.toString())
    newCode.set("columns", board.cols.toString())
    newCode.findNodes("experiment").forEach((experiment, index) => {
      const board = boards[index + 1]
      experiment.set("seed", board.seed.toString())
      experiment.set("rows", board.rows.toString())
      experiment.set("columns", board.cols.toString())
    })

    this.editor.setCodeMirrorValue(newCode.toString())
    this.loadNewSim(newCode)
  }

  async toggleHelpCommand() {
    this.toggleAndRender("HelpModalComponent")
  }

  _getKeyboardShortcuts() {
    return {
      space: () => this.togglePlayAllCommand(),
      d: () => this.toggleTreeComponentFrameworkDebuggerCommand(),
      c: () => this.exportDataCommand(),
      o: () => this.openReportInOhayoCommand(),
      r: () => this.resetAllCommand(),
      s: () => this.snapShotCommand(),
      up: () => this.moveSelection("North"),
      down: () => this.moveSelection("South"),
      right: () => this.moveSelection("East"),
      left: () => this.moveSelection("West"),
      "?": () => this.toggleHelpCommand(),
      t: () => this.advanceOneTickCommand(),
      backspace: () => this.deleteSelectionCommand()
    }
  }

  resizeEditorCommand(newSize = "100") {
    this.editor.setWord(1, newSize)
    this.boards.forEach(board => board.set("leftStartPosition", newSize))

    if (!this.isNodeJs()) localStorage.setItem("editorStartWidth", newSize)
    this.renderAndGetRenderReport()
  }
}

const SIZES = {}

SIZES.BOARD_MARGIN = 20
SIZES.TOP_BAR_HEIGHT = 28
SIZES.BOTTOM_BAR_HEIGHT = 40
SIZES.CHROME_HEIGHT = SIZES.TOP_BAR_HEIGHT + SIZES.BOTTOM_BAR_HEIGHT + SIZES.BOARD_MARGIN

SIZES.EDITOR_WIDTH = 250
SIZES.RIGHT_BAR_WIDTH = 30

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const editorStartWidth =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("editorStartWidth") ?? SIZES.EDITOR_WIDTH
      : SIZES.EDITOR_WIDTH
  const startState = new jtree.TreeNode(`githubTriangleComponent
TopBarComponent
 LogoComponent
 ShareComponent
 ExamplesComponent
BottomBarComponent
 ResetButtonComponent
 PlayButtonComponent
 ReportButtonComponent
RightBarComponent
 AgentPaletteComponent
SimEditorComponent ${editorStartWidth} ${SIZES.CHROME_HEIGHT}
 value
  ${simojiCode.replace(/\n/g, "\n  ")}
EditorHandleComponent`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendExperiments()
  return app
}

window.SimojiApp = SimojiApp







class TopBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      LogoComponent,
      ShareComponent,
      ExamplesComponent
    })
  }
}

class LogoComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `a ❔
 href cheatSheet.html
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.getRootNode().toggleHelpCommand()
  }
}

window.TopBarComponent = TopBarComponent


const DEFAULT_SIM = "fire"




class BrowserGlue extends AbstractTreeComponent {
  async fetchAndLoadSimCodeFromUrlCommand(url) {
    const { willowBrowser } = this
    const simCode = await willowBrowser.httpGetUrl(url)
    return simCode
  }

  getFromLocalStorage() {
    return localStorage.getItem("simoji")
  }

  async fetchSimCode() {
    const hash = this.willowBrowser.getHash().substr(1)
    const deepLink = new jtree.TreeNode(decodeURIComponent(hash))
    const example = deepLink.get("example")
    const fromUrl = deepLink.get("url")
    const simojiCode = deepLink.getNode("simoji")

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
    window.simojiCompiler = new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
    ExampleSims.setChildren(theExamples)

    const simCode = await this.fetchSimCode()

    window.app = SimojiApp.setupApp(simCode, window.innerWidth, window.innerHeight)
    window.app.start()
    return window.app
  }
}

window.BrowserGlue = BrowserGlue
