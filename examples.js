const stamp = require("jtree/products/stamp.nodejs.js")
const { jtree } = require("jtree")

const getExamples = prod => {
	const tree = new jtree.TreeNode(stamp.dirToStampWithContents(__dirname + "/examples/"))
	tree.forEach(node => {
		// todo: refactor stamp
		const name = node.getWord(1).replace(".simoji", "")
		node.setLine(name)
		const contents = node.getNode("data")
		node.setChildren(contents.childrenToString())
		if (contents.length < 2) node.destroy()
		if (prod && !prod.has(name)) node.destroy()
	})
	return tree.toString()
}

module.exports = { getExamples }
