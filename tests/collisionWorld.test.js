import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollisionWorld } from '../src/world/collisionWorld.js';

test('solid walls stop the player before the collision boundary', () => {
  const world = createCollisionWorld([{
    minX: 1, maxX: 2, minZ: -1, maxZ: 1, minY: 0, maxY: 3
  }]);
  const result = world.moveCircle({ x: 0, z: 0 }, 1.2, 0, 0, [], null, 0.4);
  assert.ok(result.x <= 0.601, `player crossed wall: x=${result.x}`);
});

test('movement slides along a wall instead of sticking completely', () => {
  const world = createCollisionWorld([{
    minX: 1, maxX: 2, minZ: -1, maxZ: 1, minY: 0, maxY: 3
  }]);
  const result = world.moveCircle({ x: 0, z: 0 }, 1.2, 1.2, 0, [], null, 0.4);
  assert.ok(result.x <= 0.601);
  assert.ok(result.z > 0.8);
});

test('player collision radius prevents walking through an NPC', () => {
  const pedestrian = { visible: true, position: { x: 1, y: 0, z: 0 }, userData: { collisionRadius: 0.43, collisionHeight: 1.9 } };
  const world = createCollisionWorld([]);
  const result = world.moveCircle({ x: 0, z: 0 }, 1.2, 0, 0, [pedestrian], null, 0.4);
  assert.ok(result.x < 0.18, `player overlapped pedestrian: x=${result.x}`);
});

test('inactive animated gates do not block passage', () => {
  const world = createCollisionWorld([{
    minX: -1, maxX: 1, minZ: -0.2, maxZ: 0.2, minY: 0, maxY: 3, active: false
  }]);
  const result = world.moveCircle({ x: -2, z: 0 }, 3, 0, 0, [], null, 0.4);
  assert.equal(result.x, 1);
});

test('ground-level walls do not block a player on an upper floor', () => {
  const world = createCollisionWorld([{
    minX: 0.5, maxX: 1.5, minZ: -1, maxZ: 1, minY: 0, maxY: 2
  }]);
  const result = world.moveCircle({ x: 0, z: 0 }, 1.2, 0, 4.35, [], null, 0.4);
  assert.equal(result.x, 1.2);
});
