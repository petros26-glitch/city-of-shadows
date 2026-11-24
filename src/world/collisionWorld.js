export function createCollisionWorld(colliders = []) {
  function blocked(x, z, floorY, radius, actors, self) {
    for (const wall of colliders) {
      if (wall.active === false) continue;
      if (floorY >= wall.maxY - 0.05 || floorY + 1.75 <= wall.minY) continue;

      const closestX = Math.max(wall.minX, Math.min(x, wall.maxX));
      const closestZ = Math.max(wall.minZ, Math.min(z, wall.maxZ));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) return true;
    }

    for (const actor of actors) {
      if (!actor || actor === self || !actor.visible) continue;
      const actorY = actor.position.y;
      if (actorY > floorY + 1.65 || actorY + 1.85 < floorY) continue;
      const dx = x - actor.position.x;
      const dz = z - actor.position.z;
      const actorRadius = actor.userData?.collisionRadius ?? 0.43;
      if (dx * dx + dz * dz < (radius + actorRadius) ** 2) return true;
    }
    return false;
  }

  function moveCircle(position, deltaX, deltaZ, floorY, actors = [], self = null, radius = 0.4) {
    let x = position.x;
    let z = position.z;

    const nextX = x + deltaX;
    if (!blocked(nextX, z, floorY, radius, actors, self)) x = nextX;

    const nextZ = z + deltaZ;
    if (!blocked(x, nextZ, floorY, radius, actors, self)) z = nextZ;

    return { x, z };
  }

  return { moveCircle, colliders };
}
