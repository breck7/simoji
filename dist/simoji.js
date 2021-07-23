const yodash = {}

yodash.parseInts = (arr, start) =>
	arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = () => {
	const r1 = Math.random()
	const r2 = Math.random()
	if (r1 > 0.5) return r2 > 0.5 ? "North" : "South"
	return r2 > 0.5 ? "West" : "East"
}

yodash.flipAngle = (angle) => {
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
	if (positionSet && positionSet.has(hash))
		return yodash.getRandomLocation(rows, cols, positionSet)
	return hash
}

yodash.applyCommandMap = (commandMap, targets, subject) => {
	targets.forEach((target) => {
		const keyword = target.getWord(0)
		const hit = commandMap.getNode(keyword)
		if (hit) {
			const command = hit.nodeAt(0)
			subject[command.getWord(0)](target, command.getWord(1))
		}
	})
}

yodash.positionsAdjacentTo = (position) => {
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

yodash.makePositionHash = (position) =>
	`${position.down + "⬇️ " + position.right + "➡️"}`

yodash.makeRectangle = (
	character = "🧱",
	width = 20,
	height = 20,
	startRight = 0,
	startDown = 0
) => {
	if (width < 1 || height < 1) {
		return ""
	}
	const cells = []
	let row = 0
	while (row < height) {
		let col = 0
		while (col < width) {
			const isPerimeter =
				row === 0 ||
				row === height - 1 ||
				col === 0 ||
				col === width - 1
			if (isPerimeter)
				cells.push(
					`${character} ${yodash.makePositionHash({
						down: startDown + row,
						right: startRight + col,
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
  get solid() {
    return this.objectDefinition.has("solid")
  }

  get bouncy() {
    return this.objectDefinition.has("bouncy")
  }

  get hasRoutines() {
    return this.objectDefinition.has("spawns")
  }

  get icon() {
    return this.objectDefinition.getWord(0)
  }

  get mass() {
    return this.objectDefinition.get("mass") ?? 1
  }

  get spin() {
    return this._spin ?? this.objectDefinition.get("spin") ?? "random"
  }

  set spin(value) {
    this._spin = value
  }

  get force() {
    if (this._force !== undefined) return this._force
    return this.objectDefinition.get("force") ?? 0
  }

  set force(value) {
    this._force = value
  }

  get acceleration() {
    return this.force / this.mass
  }

  get speed() {
    if (this._speed !== undefined) return this._speed
    const speed = this.objectDefinition.get("speed")
    return speed ? parseInt(speed) : 0
  }

  set speed(value) {
    this._speed = value
  }

  get diameter() {
    return this.objectDefinition.get("diameter") ?? 1
  }

  get angle() {
    return this._angle ?? this.objectDefinition.get("angle") ?? "South"
  }

  set angle(value) {
    this._angle = value
  }

  get health() {
    if (this._health !== undefined) return this._health
    const health = this.objectDefinition.get("health")
    return health ? parseInt(health) : Infinity
  }

  set health(value) {
    this._health = value
  }

  get objectDefinition() {
    return this.getRootNode().simojiProgram.getNode(this.getWord(0))
  }

  replaceWith(target, newObject) {
    this.getParent().appendLine(`${newObject} ${this.positionHash}`)
    this.unmountAndDestroy()
  }

  kickIt(target) {
    target.speed = 1
    target.spin = 0
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

  end(target, message) {
    alert(message)
    this.getRootNode().togglePlayCommand()
  }

  get touchMap() {
    return this.objectDefinition.getNode("ifTouches")
  }

  handleCollisions(targets) {
    const commandMap = this.objectDefinition.getNode("ifHits")
    if (!commandMap) return

    return yodash.applyCommandMap(commandMap, targets, this)
  }

  spinCommand() {
    if (this.spin === "random") this.angle = yodash.getRandomAngle()
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
    yodash.spawnFunction(this.objectDefinition.getNode("spawns"), this.getParent(), this.positionHash)
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
    if (this.root.isSolidAgent(value)) return this.bouncy ? this.bounce() : this
    const newLine = this.getLine()
      .split(" ")
      .map(part => (part.includes("⬇️") ? value.down + "⬇️" : part.includes("➡️") ? value.right + "➡️" : part))
      .join(" ")
    return this.setLine(newLine)
  }

  set left(value) {
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

window.Agent = Agent





class BoardComponent extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, this.getRootNode().agentMap)
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




class ExamplesComponent extends AbstractTreeComponent {
  loadExampleCommand(name) {
    app.loadNewSim(exampleSims.getNode(name).childrenToString())
    location.hash = ""
  }

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
    const parent = this.getParent()
    const root = parent.getRootNode()
    const existingObject = root.agentAt(positionHash)
    if (existingObject) return root.toggleSelectCommand(existingObject)
    const { agentToInsert } = root

    if (!agentToInsert) return this

    //if (parent.findNodes(agentToInsert).length > MAX_ITEMS) return true

    parent.prependLine(`${agentToInsert} ${positionHash}`)
    parent.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
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




class ObjectPaletteComponent extends AbstractTreeComponent {
  toStumpCode() {
    const root = this.getRootNode()
    const activeObject = root.agentToInsert
    const items = root.simojiProgram.objectTypes
      .map(item => item.getWord(0))
      .map(
        word => ` span ${word}
  class ${activeObject === word ? "ActiveObject" : ""}
  clickCommand changeAgentBrushCommand ${word}`
      )
      .join("\n")
    return `div
 class ObjectPaletteComponent
${items}`
  }

  changeAgentBrushCommand(x) {
    this.getRootNode().changeAgentBrushCommand(x)
    this.setContent(Date.now()).renderAndGetRenderReport()
  }

  getDependencies() {
    return [this.getRootNode().editor]
  }
}

window.ObjectPaletteComponent = ObjectPaletteComponent




class PlayButtonComponent extends AbstractTreeComponent {
  get isStarted() {
    return this.getRootNode().isStarted
  }

  toStumpCode() {
    return `span ${this.isStarted ? "⏸" : "▶️"}
 class PlayButtonComponent
 clickCommand togglePlayCommand`
  }

  togglePlayCommand() {
    this.getRootNode().togglePlayCommand()
  }
}

window.PlayButtonComponent = PlayButtonComponent




class ShareComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `div
 style display: inline;
 span 🔗
 input
  readonly
  value ${this.link}`
  }

  get link() {
    const url = new URL(location.href)
    url.hash = ""
    return url.toString() + this.hash
  }

  get hash() {
    const tree = new jtree.TreeNode()
    tree.appendLineAndChildren("simoji", this.getRootNode().simojiProgram?.childrenToString() ?? "")
    return "#" + encodeURIComponent(tree.toString())
  }
}

window.ShareComponent = ShareComponent




class SimEditorComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `textarea
 class SimEditorComponent
 changeCommand reloadSimCommand`
  }

  reloadSimCommand() {
    app.loadNewSim(this.el.val())
  }

  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      value: jtree.TreeNode
    })
  }

  get el() {
    return jQuery(".SimEditorComponent")
  }

  async treeComponentDidMount() {
    this.el.val(this.getNode("value").childrenToString())
    super.treeComponentDidMount()
  }

  async treeComponentDidUpdate() {
    this.el.val(this.getNode("value").childrenToString())
    super.treeComponentDidUpdate()
  }
}

window.SimEditorComponent = SimEditorComponent






class SimojiApp extends AbstractTreeComponent {
  createParser() {
    return new jtree.TreeNode.Parser(undefined, {
      TopBarComponent,
      SimEditorComponent,
      HelpModalComponent,
      BoardComponent,
      TreeComponentFrameworkDebuggerComponent
    })
  }

  get agentMap() {
    if (!this._agentMap) {
      this.compiledCode = this.simojiProgram.compileObjectClassDeclarationsAndMap()
      this._agentMap = eval(this.compiledCode)
    }
    return this._agentMap
  }

  appendBoard() {
    const { simojiProgram, windowWidth, windowHeight } = this
    const setSize = simojiProgram.get("size")
    const gridSize = Math.min(Math.max(setSize ? parseInt(setSize) : 20, 10), 200)
    const cols = Math.floor((windowWidth - 287) / gridSize) - 1
    const rows = Math.floor(windowHeight / gridSize) - 10

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

  loadNewSim(simCode) {
    clearInterval(this.interval)
    delete this._agentMap
    delete this._simojiProgram
    delete this.compiledCode
    delete this._solidsSet
    TreeNode._parsers.delete(BoardComponent) // clear parser
    this.editor.getNode("value").setChildren(simCode)
    this.editor.setWord(1, Date.now())

    this.board.unmountAndDestroy()
    this.appendBoard()
    this.startInterval()
    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
    localStorage.setItem("simoji", simCode)
    console.log("Local storage updated...")
  }

  get board() {
    return this.getNode("BoardComponent")
  }

  get simojiProgram() {
    if (!this._simojiProgram)
      this._simojiProgram = new simojiCompiler(this.getNode("SimEditorComponent value").childrenToString())
    return this._simojiProgram
  }

  startInterval() {
    this.interval = setInterval(() => {
      this.simLoop()
    }, this.stepTime)
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

    this.startInterval()
  }

  interval = undefined

  get stepTime() {
    const setTime = this.simojiProgram.get("stepTime")
    return setTime ? parseInt(setTime) : 100
  }

  isStarted = false
  simLoop(running = this.isStarted) {
    if (!running) return true

    this.agents.filter(node => node.force).forEach(node => node.applyForceCommand())

    this.agents.filter(node => node.speed).forEach(node => node.spinCommand().loopMove())
    const { agentPositionMap } = this
    agentPositionMap.forEach(nodes => {
      if (nodes.length > 1) nodes.forEach(node => node.handleCollisions(nodes))
    })
    this.handleTouches()
    this.agents.forEach(node => node.loopRoutine())

    const spawnNode = this.simojiProgram.getNode("spawns")
    if (spawnNode)
      yodash.spawnFunction(spawnNode, this.board, yodash.getRandomLocation(this.board.rows, this.board.cols))

    this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
  }

  handleTouches() {
    const agentPositionMap = this.agentPositionMap

    this.agents.forEach(node => {
      const { touchMap } = node
      if (touchMap) {
        const hits = yodash
          .positionsAdjacentTo(node.position)
          .map(pos => agentPositionMap.get(yodash.makePositionHash(pos)))
          .map(items => items && items[0])
          .filter(item => item)

        yodash.applyCommandMap(touchMap, hits, node)
      }
    })
  }

  ensureRender() {
    if (this.isStarted) return this
    const renderReport = this.renderAndGetRenderReport(this.willowBrowser.getBodyStumpNode())
  }

  get agents() {
    return this.board.getTopDownArray().filter(node => node instanceof Agent)
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

  isSolidAgent(position) {
    if (!this._solidsSet) {
      this._solidsSet = new Set()
      this.getRootNode()
        .getTopDownArray()
        .filter(node => node.solid)
        .forEach(item => {
          this._solidsSet.add(item.positionHash)
        })
    }
    const hash = yodash.makePositionHash(position)
    if (this._solidsSet.has(hash)) return true
    return false
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

  updatePlayButtonComponentHack() {
    this.getNode("TopBarComponent PlayButtonComponent")
      .setContent(this.isStarted)
      .renderAndGetRenderReport()
  }

  togglePlayCommand() {
    this.isStarted = !this.isStarted
    this.updatePlayButtonComponentHack()
  }

  changeAgentBrushCommand(object) {
    if (object === this._agentToInsert) {
      this._agentToInsert = undefined
      return this
    }
    this._agentToInsert = object
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
      node.spin = 0
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
 ExamplesComponent
 ObjectPaletteComponent
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
      ExamplesComponent,
      ObjectPaletteComponent
    })
  }
}

class LogoComponent extends AbstractTreeComponent {
  toStumpCode() {
    return `span Start📗
 class LogoComponent
 clickCommand toggleHelpCommand`
  }

  toggleHelpCommand() {
    this.getRootNode().toggleHelpCommand()
  }
}

window.TopBarComponent = TopBarComponent


const DEFAULT_SIM = "soccer"



// prettier-ignore

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

    window.app = SimojiApp.setupApp(simCode, jQuery(window).width(), jQuery(window).height())
    window.app.start()
    return window.app
  }
}

window.BrowserGlue = BrowserGlue
