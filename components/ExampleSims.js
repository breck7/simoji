const { TreeNode } = require("jtree/products/TreeNode.js")

const ExampleSims = new TreeNode()

// prettier-ignore
/*NODE_JS_ONLY*/ ExampleSims.setChildren(require("../examples.js").getExamples().toString())

module.exports = { ExampleSims }
