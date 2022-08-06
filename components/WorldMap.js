const { yodash } = require("../yodash.js")

class WorldMap {
	constructor(agents) {
		const map = new Map()
		agents.forEach(agent => {
			const { positionHash, agentSize } = agent
			if (!map.has(positionHash, agentSize)) map.set(positionHash, [])
			map.get(positionHash).push(agent)
		})
		this.map = map
	}

	get occupiedSpots() {
		return new Set(this.map.keys())
	}

	canGoHere(position, size) {
		const hash = yodash.makePositionHash(position)
		const agentsHere = this.map.get(hash)
		if (agentsHere && agentsHere.some(agent => agent.solid)) return false

		return true
	}

	get(position) {
		return this.map.get(position)
	}

	get overlappingAgents() {
		let overlaps = []
		this.map.forEach(nodes => {
			if (nodes.length > 1) overlaps.push(nodes)
		})
		return overlaps
	}
}

module.exports = { WorldMap }
