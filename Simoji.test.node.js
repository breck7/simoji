const tap = require("tap")
const { Disk } = require("jtree/products/Disk.node.js")
const { SimojiApp } = require("./components/SimojiApp.js")
const { yodash } = require("./yodash.js")
const { jtree } = require("jtree")
const grammarNode = require("jtree/products/grammar.nodejs.js")
const examplesPath = __dirname + "/examples/"

const simojiCompiler = jtree.compileGrammarFileAtPathAndReturnRootConstructor(__dirname + "/simoji.grammar")

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.simojiGrammar = areEqual => {
	const errs = new grammarNode(Disk.read(__dirname + "/simoji.grammar")).getAllErrors().map(err => err.toObject())
	if (errs.length) console.log(new jtree.TreeNode(errs).toFormattedTable(60))
	areEqual(errs.length, 0, "no grammar errors")
}

testTree.simGrammarErrors = areEqual => {
	const errs = Disk.getFiles(examplesPath)
		.map(path => {
			const code = Disk.read(path)
			const program = new simojiCompiler(code)
			const errors = program.getAllErrors()
			areEqual(errors.length, 0)
			return errors.map(err => {
				return { filename: path, ...err.toObject() }
			})
		})
		.flat()
	if (errs.length) console.log(new jtree.TreeNode(errs).toFormattedTable(60))
}

testTree.SimojiApp = areEqual => {
	const app = SimojiApp.setupApp(new simojiCompiler(""))
	areEqual(!!app, true)
}

const yodashTestTree = {}

yodashTestTree.getRandomAngle = areEqual => {
	areEqual(yodash.getRandomAngle().match(/(East|West|North|South)/).length, 2)
}

yodashTestTree.makeRectangle = areEqual => {
	const expected = `😀 0⬇️ 0➡️
😀 0⬇️ 1➡️
😀 1⬇️ 0➡️
😀 1⬇️ 1➡️`

	areEqual(yodash.makeRectangle("😀", 2, 2), expected)
	areEqual(
		yodash.makeRectangle("🚪", 2, 1, 1, 1),
		`🚪 1⬇️ 1➡️
🚪 1⬇️ 2➡️`
	)
}

if (module && !module.parent) runTree({ ...testTree, ...yodashTestTree })

module.exports = { testTree }
