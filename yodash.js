const yodash = {}
const lodash = require("lodash")
const math = require("mathjs")
const { Directions, NodeTypes } = require("./components/Types.js")

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

yodash.compileAgentClassDeclarationsAndMap = program => {
  const clone = program.clone()
  clone.filter(node => node.getNodeTypeId() !== NodeTypes.agentDefinitionNode).forEach(node => node.destroy())
  clone.agentKeywordMap = {}
  clone.agentTypes.forEach((node, index) => (clone.agentKeywordMap[node.getWord(0)] = `simAgent${index}`))
  const compiled = clone.compile()
  const agentMap = Object.keys(clone.agentKeywordMap)
    .map(key => `"${key}":${clone.agentKeywordMap[key]}`)
    .join(",")
  return `${compiled}
    const map = {${agentMap}};
    map;`
}

yodash.patchExperimentAndReplaceSymbols = (program, experiment) => {
  const clone = program.clone()
  // drop experiment nodes
  clone.filter(node => node.getNodeTypeId() === NodeTypes.experimentNode).forEach(node => node.destroy())
  // Append current experiment
  if (experiment) clone.concat(experiment.childrenToString())
  // Build symbol table
  const symbolTable = {}
  clone
    .filter(node => node.getNodeTypeId() === NodeTypes.settingDefinitionNode)
    .forEach(node => {
      symbolTable[node.getWord(0)] = node.getContent()
      node.destroy()
    })
  // Find and replace
  let withVarsReplaced = clone.toString()
  Object.keys(symbolTable).forEach(key => {
    withVarsReplaced = withVarsReplaced.replaceAll(key, symbolTable[key])
  })
  return withVarsReplaced
}

yodash.getBestAngle = (targets, position) => {
  let closest = Infinity
  let target
  targets.forEach(candidate => {
    const pos = candidate.position
    const distance = math.distance([pos.down, pos.right], [position.down, position.right])
    if (distance < closest) {
      closest = distance
      target = candidate
    }
  })
  const heading = target.position
  return yodash.angle(position.down, position.right, heading.down, heading.right)
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

yodash.getRandomLocation = (rows, cols, randomNumberGenerator) => {
  const maxRight = cols
  const maxBottom = rows
  const right = Math.round(randomNumberGenerator() * maxRight)
  const down = Math.round(randomNumberGenerator() * maxBottom)
  return { right, down }
}

yodash.getRandomLocationHash = (rows, cols, occupiedSpots, randomNumberGenerator) => {
  const { right, down } = yodash.getRandomLocation(rows, cols, randomNumberGenerator)
  const hash = yodash.makePositionHash({ right, down })
  if (occupiedSpots && occupiedSpots.has(hash))
    return yodash.getRandomLocationHash(rows, cols, occupiedSpots, randomNumberGenerator)
  return hash
}

yodash.fill = (rows, cols, occupiedSpots, emoji) => {
  const board = []
  while (rows >= 0) {
    let col = cols
    while (col >= 0) {
      const hash = yodash.makePositionHash({ right: col, down: rows })
      col--
      if (occupiedSpots.has(hash)) continue
      board.push(`${emoji} ${hash}`)
    }
    rows--
  }
  return board.join("\n")
}

yodash.positionsAdjacentTo = position => {
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

yodash.makePositionHash = position => `${position.down + "⬇️ " + position.right + "➡️"}`

yodash.makeRectangle = (character = "🧱", width = 20, height = 20, startRight = 0, startDown = 0) => {
  if (width < 1 || height < 1) {
    return ""
  }
  const cells = []
  let row = 0
  while (row < height) {
    let col = 0
    while (col < width) {
      const isPerimeter = row === 0 || row === height - 1 || col === 0 || col === width - 1
      if (isPerimeter)
        cells.push(
          `${character} ${yodash.makePositionHash({
            down: startDown + row,
            right: startRight + col
          })}`
        )
      col++
    }
    row++
  }
  return cells.join("\n")
}

yodash.parsePosition = words => {
  return {
    down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
    right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
  }
}

yodash.draw = str => {
  const lines = str.split("\n")
  const output = []
  for (let index = 0; index < lines.length; index++) {
    const words = lines[index].split(" ")
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]
      if (word !== "") output.push(`${word} ${yodash.makePositionHash({ down: index, right: wordIndex })}`)
    }
  }
  return output.join("\n")
}

yodash.updateOccupiedSpots = (board, occupiedSpots) => {
  new TreeNode(board).forEach(line => {
    occupiedSpots.add(yodash.makePositionHash(yodash.parsePosition(line.getWords())))
  })
}

yodash.getAllAvailableSpots = (rows, cols, occupiedSpots, rowStart = 0, colStart = 0) => {
  const availablePositions = []
  let down = rows
  while (down >= rowStart) {
    let right = cols
    while (right >= colStart) {
      const hash = yodash.makePositionHash({ right, down })
      if (!occupiedSpots.has(hash)) availablePositions.push({ right, down, hash })
      right--
    }
    down--
  }
  return availablePositions
}

yodash.parsePercent = str => parseFloat(str.replace("%", "")) / 100

yodash.insertClusteredRandomAgents = (
  randomNumberGenerator,
  amount,
  char,
  rows,
  cols,
  occupiedSpots,
  originRow,
  originColumn
) => {
  const availableSpots = yodash.getAllAvailableSpots(rows, cols, occupiedSpots)
  const spots = yodash.sampleFrom(availableSpots, amount * 10, randomNumberGenerator)
  const origin = originColumn
    ? { down: parseInt(originRow), right: parseInt(originColumn) }
    : yodash.getRandomLocation(rows, cols, randomNumberGenerator)
  const sortedByDistance = lodash.sortBy(spots, spot =>
    math.distance([origin.down, origin.right], [spot.down, spot.right])
  )

  return sortedByDistance
    .slice(0, amount)
    .map(spot => {
      const { hash } = spot
      occupiedSpots.add(hash)
      return `${char} ${hash}`
    })
    .join("\n")
}

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
  const map = TreeUtils.arrayToMap(fields)
  newTree.forEach(node => {
    if (!map[node.getWord(0)]) node.destroy()
  })

  return newTree
}

yodash.flatten = tree => {
  const newTree = new jtree.TreeNode()
  tree.forEach(node => node.forEach(child => newTree.appendNode(child)))
  return newTree
}

module.exports = { yodash }
