const stamp = require("jtree/products/stamp.nodejs.js")
const { jtree } = require("jtree")

const getExamples = () => {
	const tree = new jtree.TreeNode(stamp.dirToStampWithContents(__dirname + "/examples/"))
	tree.forEach(node => {
		// todo: refactor stamp
		node.setLine(node.getWord(1).replace(".simoji", ""))
		const contents = node.getNode("data")
		node.setChildren(contents.childrenToString())
		if (contents.length < 2) node.destroy()
	})
	return tree.toString()
}

module.exports = { getExamples }
