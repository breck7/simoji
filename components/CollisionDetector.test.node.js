#!/usr/bin/env node

const { CollisionDetector } = require("./CollisionDetector.js")
const { TestRacer } = require("jtree/products/TestRacer.js")

const testTree = {}

// Slow is smooth and smooth is fast.
// Todo:
// - Write every test case imaginable.
// - Have this handle neighbors, collissions, and touching
// - Keep in mind that in the future it may not
// - Consider a linear algebra, layer approach?
class MockWorld {
	constructor(width, height) {
		this.width = width
		this.height = height
	}
}

class MockAgent {
	constructor(id, position) {
		this.id = id
		this.x = position.x
		this.y = position.y
		this.width = position.width
		this.height = position.height
	}
}

testTree.empty = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = []
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions().length, 0) // Should not detect any collisions
}

testTree.miss = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 200, y: 200, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions().length, 0) // Should not detect any collisions
}

testTree.hit = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 55, y: 55, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions().length, 2, "one hit") // Should detect a collision between agents 1 and 2
}

testTree.multiple = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 55, y: 55, width: 10, height: 10 }),
		new MockAgent(3, { x: 200, y: 200, width: 10, height: 10 }),
		new MockAgent(4, { x: 205, y: 200, width: 10, height: 10 }),
		new MockAgent(5, { x: 400, y: 400, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions().length, 4, "2 hits") // Should detect collisions between agents 1 and 2, and agents 3 and 4
}

testTree.get = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 55, y: 55, width: 10, height: 10 }),
		new MockAgent(3, { x: 200, y: 200, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	const collidingAgents = collisionDetector.getCollidingAgents(45, 45, 20, 20)
	areEqual(collidingAgents.length, 2, "query works") // Should return an array containing the agents 1 and 2, as they collide with the specified rectangle
}

testTree.big = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 55, y: 55, width: 10, height: 10 }),
		new MockAgent(3, { x: 200, y: 200, width: 10, height: 10 }),
		new MockAgent(4, { x: 250, y: 250, width: 10, height: 10 }),
		new MockAgent(5, { x: 300, y: 300, width: 10, height: 10 }),
		new MockAgent(6, { x: 30, y: 30, width: 10, height: 10 }),
		new MockAgent(7, { x: 15, y: 15, width: 10, height: 10 }),
		new MockAgent(8, { x: 100, y: 100, width: 10, height: 10 }),
		new MockAgent(9, { x: 75, y: 75, width: 10, height: 10 }),
		new MockAgent(10, { x: 350, y: 350, width: 10, height: 10 }),
		new MockAgent(11, { x: 400, y: 400, width: 10, height: 10 }),
		new MockAgent(12, { x: 450, y: 450, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	const collidingAgents = collisionDetector.getCollidingAgents(45, 45, 30, 30)
	areEqual(collidingAgents.length, 3) // Should return an array containing the agents 1 and 2, as they collide with the specified rectangle
}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
