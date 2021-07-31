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

	if (Math.abs(theta) > 90) angle += "North"
	else angle += "South"
	if (theta < 0) angle += "West"
	else angle += "East"
	return angle
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

yodash.fill = (rows, cols, positionSet, emoji) => {
	const board = []
	while (rows >= 0) {
		let col = cols
		while (col >= 0) {
			const hash = yodash.makePositionHash({ right: col, down: rows })
			col--
			if (positionSet.has(hash)) continue
			board.push(`${emoji} ${hash}`)
		}
		rows--
	}
	return board.join("\n")
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

yodash.parsePosition = words => {
	return {
		down: parseInt(words.find(word => word.includes("⬇️")).slice(0, -1)),
		right: parseInt(words.find(word => word.includes("➡️")).slice(0, -1))
	}
}

yodash.updatePositionSet = (board, positionSet) => {
	new TreeNode(board).forEach(line => {
		positionSet.add(yodash.makePositionHash(yodash.parsePosition(line.getWords())))
	})
}

module.exports = { yodash }
