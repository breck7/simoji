const { jtree } = require("jtree")

const ExampleSims = new jtree.TreeNode()

// prettier-ignore
/*NODE_JS_ONLY*/ ExampleSims.setChildren(require("../examples.js").getExamples().toString())

module.exports = { ExampleSims }
