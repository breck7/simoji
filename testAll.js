const runTree = testTree => {
	const tap = require("tap")
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})
}

runTree({ ...require("./yodash.test.node.js").testTree, ...require("./components/SimojiApp.test.node.js").testTree })
