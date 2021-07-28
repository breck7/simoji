const yodash = {}

yodash.parseInts = (arr, start) => arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = () => {
	const r1 = Math.random()
	const r2 = Math.random()
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

yodash.spawnFunction = (def, board, positionHash) => {
	const probability = parseFloat(def.getWord(2) ?? 1)
	if (Math.random() > probability) return false

	const newObject = def.getWord(1)
	return board.appendLine(`${newObject} ${positionHash}`)
}

yodash.getRandomLocation = (rows, cols, positionSet) => {
	const maxRight = cols
	const maxBottom = rows
	const right = Math.round(Math.random() * maxRight)
	const down = Math.round(Math.random() * maxBottom)
	const hash = yodash.makePositionHash({ right, down })
	if (positionSet && positionSet.has(hash)) return yodash.getRandomLocation(rows, cols, positionSet)
	return hash
}

yodash.applyCommandMap = (commandMap, targets, subject) => {
	targets.forEach(target => {
		const targetId = target.getWord(0)
		const instructions = commandMap.getNode(targetId)
		if (instructions) {
			instructions.forEach(instruction => {
				subject[instruction.getWord(0)](target, instruction)
			})
		}
	})
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

window.yodash = yodash




class Agent extends AbstractTreeComponent {
  get icon() {
    return this.agentDefinition.getWord(0)
  }

  get name() {
    return this._name ?? this.icon
  }

  get mass() {
    return this.agentDefinition.get("mass") ?? 1
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

  get diameter() {
    return this.agentDefinition.get("diameter") ?? 1
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
    const newObject = command.getWord(1)
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

  alert(target, command) {
    alert(command.getContent())
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

  loopMove() {
    if (this.selected) return
    return this.moveCommand()
  }

  executeCommands(key) {
    this.agentDefinition.findNodes(key).forEach(commands => {
      const probability = commands.getWord(1)
      if (probability && Math.random() > parseFloat(probability)) return
      commands.forEach(instruction => {
        this[instruction.getWord(0)](this, instruction)
      })
    })
  }

  onTick() {
    this.executeCommands("onTick")
    if (this.health === 0) this.onDeathCommand()
  }

  remove() {
    this.unmountAndDestroy()
  }

  onDeathCommand() {
    this.executeCommands("onDeath")
  }

  markDirty() {
    this.setWord(5, Date.now())
  }

  spawn(subject, command) {
    yodash.spawnFunction(command, subject.getParent(), subject.positionHash)
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

  get startHealth() {
    return parseInt(this.agentDefinition.get("health") ?? 100)
  }

  toStumpCode() {
    const { gridSize, health } = this
    const opacity = health === undefined ? "" : `opacity:${this.health / (this.startHealth ?? this.health)};`
    return `div ${this.icon}
 class Agent ${this.selected ? "selected" : ""}
 style top:${this.top * gridSize}px;left:${this.left *
      gridSize}px;font-size:${gridSize}px;line-height: ${gridSize}px;${opacity}`
  }
}

window.Agent = Agent




class AgentPaletteComponent extends AbstractTreeComponent {
  toStumpCode() {
    const root = this.getRootNode()
    const activeObject = root.agentToInsert
    const items = root.simojiProgram.agentTypes
      .map(item => item.getWord(0))
      .map(
        word => ` div ${word}
  class ${activeObject === word ? "ActiveObject" : ""}
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





class BoardComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, this.getParent().agentMap)
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
    return new TreeNode(this._populationCounts).toCsv()
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
    this.agents.filter(node => node.force).forEach(node => node.applyForceCommand())
    this.agents.filter(node => node.speed).forEach(node => node.loopMove())

    this.handleCollisions()
    this.handleTouches()

    this.agents.forEach(node => node.onTick())

    this.rootOnTick()

    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())

    this.tick++
    this._populationCounts.push(this.populationCount)
  }

  rootOnTick() {
    const spawnNode = this.getRootNode().simojiProgram.getNode("spawn")
    if (spawnNode) yodash.spawnFunction(spawnNode, this, yodash.getRandomLocation(this.rows, this.cols))
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
    const map = new Map()
    this.agents.forEach(node => {
      const { positionHash } = node
      if (!map.has(positionHash)) map.set(positionHash, [])
      map.get(positionHash).push(node)
    })
    return map
  }

  agentAt(position) {
    const hits = this.agentPositionMap.get(position)
    return hits ? hits[0] : undefined
  }

  handleCollisions() {
    const { agentPositionMap } = this
    agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap

    this.agents.forEach(subject => {
      const { touchMap } = subject
      if (!touchMap) return

      for (let pos of yodash.positionsAdjacentTo(subject.position)) {
        const hits = agentPositionMap.get(yodash.makePositionHash(pos)) ?? []
        for (let target of hits) {
          const targetId = target.getWord(0)
          const instructions = touchMap.getNode(targetId)
          if (instructions) {
            instructions.forEach(instruction => {
              subject[instruction.getWord(0)](target, instruction)
            })
            if (subject.getIndex() === -1) return
          }
        }
      }
    })
  }
}

class BoardStyleComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `styleTag
 bern
  ${this.childrenToString().replace(/\n/g, "\n  ")}`
  }
}

window.BoardStyleComponent = BoardStyleComponent

window.BoardComponent = BoardComponent





class BottomBarComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class BottomBarComponent
 span
  clickCommand dumpErrorsCommand
  id codeErrorsConsole`
  }
}

window.BottomBarComponent = BottomBarComponent




class ExamplesComponent extends AbstractTreeComponent {
  toStumpCode() {
    const sims = exampleSims
      .getFirstWords()
      .map(
        item => ` a ${item}
  href index.html#example%20${item}
  clickCommand loadExampleCommand ${item}`
      )
      .join("\n")
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
    board.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
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
    return `span ${this.isStarted ? "⏸" : "▶️"}
 class TopBarComponentButton
 clickCommand togglePlayCommand`
  }
}

window.PlayButtonComponent = PlayButtonComponent






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
 style display: inline;
 input
  readonly
  value ${this.link}`
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }

  get link() {
    const url = new URL(location.href)
    url.hash = ""
    return url.toString() + this.getRootNode().urlHash
  }
}

window.ShareComponent = ShareComponent





// prettier-ignore

class SimEditorComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 class SimEditorComponent
 textarea
  id EditorTextarea`
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
    const root = this.getRootNode()
    root.pauseCommand()
    // this._updateLocalStorage()

    this.program = new simojiCompiler(code)
    const errs = this.program.getAllErrors()

    willowBrowser.setHtmlOfElementWithIdHack("codeErrorsConsole", `${errs.length} errors`)

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

    root.loadNewSim(code)
  }

  get simCode() {
    return this.codeMirrorInstance ? this.codeMirrorValue : this.getNode("value").childrenToString()
  }

  async treeComponentDidMount() {
    this.loadCodeMirror()
    super.treeComponentDidMount()
  }

  async treeComponentDidUpdate() {
    this.loadCodeMirror()
    super.treeComponentDidUpdate()
  }

  setCodeMirrorValue(value) {
    this.codeMirrorInstance.setValue(value)
  }

  loadCodeMirror() {
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
    this.setCodeMirrorValue(this.getNode("value").childrenToString())
    this.codeMirrorInstance.on("keyup", () => this._onCodeKeyUp())
    this.codeMirrorInstance.setSize(250, window.innerHeight - 68)
  }
}

window.SimEditorComponent = SimEditorComponent


// prettier-ignore












// prettier-ignore

const boardMargin = 20
const chromeHeight = 48 + boardMargin
const chromeWidth = 280 + boardMargin

class SimojiApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      TopBarComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent,
      BottomBarComponent,
      RightBarComponent
    })
  }

  get agentMap() {
    if (!this._agentMap) {
      this.compiledCode = this.simojiProgram.compileAgentClassDeclarationsAndMap()
      //console.log(this.compiledCode)
      let evaled = {}
      try {
        evaled = eval(this.compiledCode)
      } catch {}
      this._agentMap = { ...evaled, GridComponent, BoardStyleComponent }
    }
    return this._agentMap
  }

  appendBoard() {
    const { simojiProgram, windowWidth, windowHeight } = this
    const setSize = simojiProgram.get("size")
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : 20, 10), 200)
    const cols = Math.floor((windowWidth - chromeWidth) / gridSize) - 1
    const rows = Math.floor((windowHeight - chromeHeight) / gridSize) - 1

    const compiledStartState = simojiProgram.compileSetup(rows, cols).trim()
    const styleNode = simojiProgram.getNode("style") ?? undefined
    this.appendLineAndChildren(
      `BoardComponent ${gridSize} ${rows} ${cols}`,
      `${compiledStartState.trim()}
GridComponent
${styleNode ? styleNode.toString().replace("style", "BoardStyleComponent") : ""}`.trim()
    )
  }

  get editor() {
    return this.getNode("SimEditorComponent")
  }

  loadExampleCommand(name) {
    const restart = this.isRunning
    const simCode = exampleSims.getNode(name).childrenToString()
    this.editor.setCodeMirrorValue(simCode)
    this.loadNewSim(simCode)
    if (restart) this.startInterval()
    location.hash = ""
  }

  get simCode() {
    return this.editor.simCode
  }

  loadNewSim(simCode) {
    this.stopInterval()
    delete this._agentMap
    delete this._simojiProgram
    delete this.compiledCode
    TreeNode._parsers.delete(BoardComponent) // clear parser

    this.board.unmountAndDestroy()
    this.appendBoard()
    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
    this.updateLocalStorage(simCode)
  }

  updateLocalStorage(simCode) {
    localStorage.setItem("simoji", simCode)
    console.log("Local storage updated...")
  }

  dumpErrorsCommand() {
    const errs = this._simojiProgram.getAllErrors()
    console.log(new jtree.TreeNode(errs.map(err => err.toObject())).toFormattedTable(200))
  }

  get board() {
    return this.getNode("BoardComponent")
  }

  get simojiProgram() {
    if (!this._simojiProgram) this._simojiProgram = new simojiCompiler(this.simCode)
    return this._simojiProgram
  }

  startInterval() {
    this.interval = setInterval(() => {
      this.board.boardLoop()
    }, 1000 / this.ticksPerSecond)
  }

  stopInterval() {
    clearInterval(this.interval)
    delete this.interval
  }

  get isRunning() {
    return !!this.interval
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
  }

  interval = undefined

  get ticksPerSecond() {
    const setTime = this.simojiProgram.get("ticksPerSecond")
    return setTime ? parseInt(setTime) : 10
  }

  ensureRender() {
    if (this.interval) return this
    const renderReport = this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
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

  async openInOhayoCommand() {
    this.willowBrowser.openUrl(this.ohayoLink)
  }

  get urlHash() {
    const tree = new jtree.TreeNode()
    tree.appendLineAndChildren("simoji", this.simojiProgram?.childrenToString() ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }

  get ohayoLink() {
    const program = `data.inline
 roughjs.line
 content
  ${this.board.populationCsv.replace(/\n/g, "\n  ")}`

    const link = this.willowBrowser.toPrettyDeepLink(program, {})
    const parts = link.split("?")
    return "https://ohayo.computer?filename=simoji.ohayo&" + parts[1]
  }

  updatePlayButtonComponentHack() {
    this.getNode("TopBarComponent PlayButtonComponent")
      .setContent(this.interval)
      .renderAndGetRenderReport()
  }

  togglePlayCommand() {
    this.isRunning ? this.stopInterval() : this.startInterval()
    this.updatePlayButtonComponentHack()
  }

  pauseCommand() {
    if (this.isRunning) {
      this.stopInterval()
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
      const speed = node.speed
      node.angle = direction
      node.speed = 1
      node.moveCommand()
      node.speed = speed
    })

    this.ensureRender()
  }

  deleteSelectionCommand() {
    this.selection.forEach(node => node.unmountAndDestroy())
  }

  async toggleHelpCommand() {
    this.toggleAndRender("HelpModalComponent")
  }

  _getKeyboardShortcuts() {
    return {
      space: () => this.togglePlayCommand(),
      d: () => {
        this.toggleTreeComponentFrameworkDebuggerCommand()
      },
      c: () => {
        this.exportDataCommand()
      },
      up: () => this.moveSelection("North"),
      down: () => this.moveSelection("South"),
      right: () => this.moveSelection("East"),
      left: () => this.moveSelection("West"),
      "?": () => this.toggleHelpCommand(),
      backspace: () => this.deleteSelectionCommand()
    }
  }
}

SimojiApp.setupApp = (simojiCode, windowWidth = 1000, windowHeight = 1000) => {
  const startState = new jtree.TreeNode(`TopBarComponent
 LogoComponent
 ShareComponent
 PlayButtonComponent
 AnalyzeDataButtonComponent
 ExamplesComponent
BottomBarComponent
RightBarComponent
 AgentPaletteComponent
SimEditorComponent
 value
  ${simojiCode.replace(/\n/g, "\n  ")}`)

  const app = new SimojiApp(startState.toString())
  app.windowWidth = windowWidth
  app.windowHeight = windowHeight
  app.appendBoard()
  return app
}

window.SimojiApp = SimojiApp








class TopBarComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      LogoComponent,
      ShareComponent,
      PlayButtonComponent,
      AnalyzeDataButtonComponent,
      ExamplesComponent
    })
  }
}

class AnalyzeDataButtonComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span 📈
 class TopBarComponentButton
 clickCommand openInOhayoCommand`
  }
}

class LogoComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Simoji
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.getRootNode().toggleHelpCommand()
  }
}

window.TopBarComponent = TopBarComponent


const DEFAULT_SIM = "soccer"



let exampleSims = new jtree.TreeNode()

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
    const hash = location.hash.substr(1)
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
    return exampleSims.has(id) ? exampleSims.getNode(id).childrenToString() : `comment Example '${id}' not found.`
  }

  async fetchSimGrammarAndExamplesAndInit() {
    const grammar = await fetch("simoji.grammar")
    const grammarCode = await grammar.text()

    const result = await fetch("examples")
    return this.init(grammarCode, await result.text())
  }

  async init(grammarCode, theExamples) {
    window.simojiCompiler = new jtree.HandGrammarProgram(grammarCode).compileAndReturnRootConstructor()
    exampleSims = new jtree.TreeNode(theExamples)

    const simCode = await this.fetchSimCode()

    window.app = SimojiApp.setupApp(simCode, window.innerWidth, window.innerHeight)
    window.app.start()
    return window.app
  }
}

window.BrowserGlue = BrowserGlue
