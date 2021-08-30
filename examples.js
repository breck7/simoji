const stamp = require("jtree/products/stamp.nodejs.js")
const { Disk } = require("jtree/products/Disk.node.js")

const getExamples = () =>
	Disk.getFiles(__dirname + "/examples/")
		.map(path => {
			const name = Disk.getFileName(path.replace(".simoji", ""))
			return name + `\n ` + Disk.read(path).replace(/\n/g, "\n ")
		})
		.filter(i => i)
		.join("\n")
		.trim()

module.exports = { getExamples }
