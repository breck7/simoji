const { yodash } = require("../yodash.js")

class WorldMap {
	constructor(agents) {
		const map = new Map()
		agents.forEach(agent => {
			const { positionHash, agentSize } = agent
			if (!map.has(positionHash, agentSize)) map.set(positionHash, [])
			map.get(positionHash).push(agent)
		})
		this._map = map
	}

	get occupiedSpots() {
		return new Set(this._map.keys())
	}

	objectsAtPosition(positionHash) {
		return this._map.get(positionHash) ?? []
	}

	canGoHere(position, size) {
		const hash = yodash.makePositionHash(position)
		const agentsHere = this._map.get(hash)
		if (agentsHere && agentsHere.some(agent => agent.solid)) return false

		return true
	}

	get overlappingAgents() {
		let overlaps = []
		this._map.forEach(nodes => {
			if (nodes.length > 1) overlaps.push(nodes)
		})
		return overlaps
	}

	getNeighborCount(position) {
		const neighborCounts = {}
		yodash.positionsAdjacentTo(position).forEach(pos => {
			const agents = this.objectsAtPosition(yodash.makePositionHash(pos))
			agents.forEach(agent => {
				if (!neighborCounts[agent.name]) neighborCounts[agent.name] = 0
				neighborCounts[agent.name]++
			})
		})
		return neighborCounts
	}
}

module.exports = { WorldMap }
