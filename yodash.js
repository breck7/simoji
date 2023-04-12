const yodash = {}
const math = require("mathjs")
const { Utils } = require("jtree/products/Utils.js")
const { ParserTypes } = require("./components/Types.js")

yodash.compare = (left, operator, right) => {
  if (operator === "=") return left == right
  if (operator === "<") return left < right
  if (operator === ">") return left > right
  if (operator === "<=") return left <= right
  if (operator === ">=") return left >= right

  return false
}

// Todo: why do we do this? Very confusing. Caught me by surprise.
// Is it because sometimes the class name is not valid JS?
yodash.compileAgentClassDeclarationsAndMap = program => {
  const agentKeywordMap = {}
  program.agentKeywordMap = agentKeywordMap // confusing
  const agentDefs = program.filter(node => node.parserId === ParserTypes.agentDefinitionParser)
  agentDefs.forEach((node, index) => (agentKeywordMap[node.firstWord] = `simAgent${index}`))
  const compiled = agentDefs.map(node => node.compile()).join("\n")
  const agentMap = Object.keys(agentKeywordMap)
    .map(key => `"${key}":${agentKeywordMap[key]}`)
    .join(",")
  return `${compiled}
    const map = {${agentMap}};
    map;`
}

yodash.patchExperimentAndReplaceSymbols = (program, experiment) => {
  const clone = program.clone()
  // drop experiment nodes
  clone.filter(node => node.parserId === ParserTypes.experimentParser).forEach(node => node.destroy())
  // Append current experiment
  if (experiment) clone.concat(experiment.childrenToString())
  // Build symbol table
  const symbolTable = {}
  clone
    .filter(node => node.parserId === ParserTypes.settingDefinitionParser)
    .forEach(node => {
      symbolTable[node.firstWord] = node.content
      node.destroy()
    })
  // Find and replace
  let withVarsReplaced = clone.toString()
  Object.keys(symbolTable).forEach(key => {
    withVarsReplaced = withVarsReplaced.replaceAll(key, symbolTable[key])
  })
  return withVarsReplaced
}

yodash.getBestUnitVector = (targets, subject) => {
  let closest = Infinity
  let target
  targets.forEach(agent => {
    if (agent === subject) return
    const distance = math.distance([agent.y, agent.x], [subject.y, subject.x])
    if (distance < closest) {
      closest = distance
      target = agent
    }
  })
  return yodash.unitVector(subject, target)
}

yodash.unitVector = (objA, objB) => {
  // calculate direction vector (delta)
  const delta = {
    x: objB.x - objA.x,
    y: objB.y - objA.y
  }

  // calculate magnitude of delta (distance between two points)
  const magDelta = Math.sqrt(delta.x * delta.x + delta.y * delta.y)

  // calculate unit vector (normalize direction vector by dividing by magnitude)
  return {
    x: delta.x / magDelta,
    y: delta.y / magDelta
  }
}

yodash.parsePercent = str => parseFloat(str.replace("%", "")) / 100

yodash.getRandomNumberGenerator = seed => () => {
  const semiRand = Math.sin(seed++) * 10000
  return semiRand - Math.floor(semiRand)
}

yodash.sampleFrom = (collection, howMany, randomNumberGenerator) =>
  shuffleArray(collection, randomNumberGenerator).slice(0, howMany)

const shuffleArray = (array, randomNumberGenerator) => {
  const clonedArr = array.slice()
  for (let index = clonedArr.length - 1; index > 0; index--) {
    const replacerIndex = Math.floor(randomNumberGenerator() * (index + 1))
    ;[clonedArr[index], clonedArr[replacerIndex]] = [clonedArr[replacerIndex], clonedArr[index]]
  }
  return clonedArr
}

yodash.pick = (tree, fields) => {
  const newTree = tree.clone()
  const map = Utils.arrayToMap(fields)
  newTree.forEach(node => {
    if (!map[node.firstWord]) node.destroy()
  })

  return newTree
}

yodash.flatten = tree => {
  const newTree = new TreeNode()
  tree.forEach(node => node.forEach(child => newTree.appendNode(child)))
  return newTree
}

module.exports = { yodash }
