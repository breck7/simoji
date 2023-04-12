const yodash = {}
const math = require("mathjs")
const { Utils } = require("jtree/products/Utils.js")
const { Directions, ParserTypes } = require("./components/Types.js")

yodash.parseInts = (arr, start) => arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = randomNumberGenerator => {
  const r1 = randomNumberGenerator()
  const r2 = randomNumberGenerator()
  if (r1 > 0.5) return r2 > 0.5 ? Directions.North : Directions.South
  return r2 > 0.5 ? Directions.West : Directions.East
}

yodash.flipAngle = angle => {
  let newAngle = ""
  if (angle.includes(Directions.North)) newAngle += Directions.South
  else if (angle.includes(Directions.South)) newAngle += Directions.North
  if (angle.includes(Directions.East)) newAngle += Directions.West
  else if (angle.includes(Directions.West)) newAngle += Directions.East
  return newAngle
}

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

yodash.getBestAngle = (targets, subject) => {
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
  return yodash.angle(subject.y, subject.x, target.y, target.x)
}

yodash.angle = (cx, cy, ex, ey) => {
  const dy = ey - cy
  const dx = ex - cx
  let theta = Math.atan2(dy, dx) // range (-PI, PI]
  theta *= 180 / Math.PI // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  let angle = ""

  if (Math.abs(theta) > 90) angle += Directions.North
  else angle += Directions.South
  if (theta < 0) angle += Directions.West
  else angle += Directions.East
  return angle
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
