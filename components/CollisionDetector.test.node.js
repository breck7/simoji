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
		this.shape = { width: position.width, height: position.height }
	}
}

testTree.empty = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = []
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions(), 0) // Should not detect any collisions
}

testTree.miss = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 200, y: 200, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions(), 0) // Should not detect any collisions
}

testTree.hit = areEqual => {
	const world = new MockWorld(500, 500)
	const agents = [
		new MockAgent(1, { x: 50, y: 50, width: 10, height: 10 }),
		new MockAgent(2, { x: 55, y: 55, width: 10, height: 10 })
	]
	const collisionDetector = new CollisionDetector(agents, world.width, world.height)
	areEqual(collisionDetector.detectCollisions(), 1) // Should detect a collision between agents 1 and 2
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
	areEqual(collisionDetector.detectCollisions(), 2) // Should detect collisions between agents 1 and 2, and agents 3 and 4
}

if (!module.parent) TestRacer.testSingleFile(__filename, testTree)
module.exports = { testTree }
