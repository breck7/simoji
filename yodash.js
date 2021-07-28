const yodash = {}

yodash.parseInts = (arr, start) => arr.map((item, index) => (index >= start ? parseInt(item) : item))

yodash.getRandomAngle = () => {
	const r1 = Math.random()
	const r2 = Math.random()
	if (r1 > 0.5) return r2 > 0.5 ? "North" : "South"
	return r2 > 0.5 ? "West" : "East"
}

yodash.flipAngle = angle => {
	let newAngle = ""
	if (angle.includes("North")) newAngle += "South"
	else if (angle.includes("South")) newAngle += "North"
	if (angle.includes("East")) newAngle += "West"
	else if (angle.includes("West")) newAngle += "East"
	return newAngle
}

yodash.spawnFunction = (def, board, positionHash) => {
	const probability = parseFloat(def.getWord(2) ?? 1)
	if (Math.random() > probability) return false

	const newObject = def.getWord(1)
	return board.appendLine(`${newObject} ${positionHash}`)
}

yodash.getRandomLocation = (rows, cols, positionSet) => {
	const maxRight = cols
	const maxBottom = rows
	const right = Math.round(Math.random() * maxRight)
	const down = Math.round(Math.random() * maxBottom)
	const hash = yodash.makePositionHash({ right, down })
	if (positionSet && positionSet.has(hash)) return yodash.getRandomLocation(rows, cols, positionSet)
	return hash
}

yodash.applyCommandMap = (commandMap, targets, subject) => {
	targets.forEach(target => {
		const targetId = target.getWord(0)
		const instructions = commandMap.getNode(targetId)
		if (instructions) {
			instructions.forEach(instruction => {
				subject[instruction.getWord(0)](target, instruction)
			})
		}
	})
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

module.exports = { yodash }
