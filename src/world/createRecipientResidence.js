import * as THREE from 'three';

function addBox(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addSolid(parent, size, position, material, colliders, minY = 0, maxY = size[1]) {
  addBox(parent, size, position, material);
  colliders.push({
    minX: position[0] - size[0] / 2,
    maxX: position[0] + size[0] / 2,
    minZ: position[2] - size[2] / 2,
    maxZ: position[2] + size[2] / 2,
    minY,
    maxY
  });
}

export function createRecipientResidence(scene) {
  const colliders = [];
  const stone = new THREE.MeshStandardMaterial({ color: 0x77766f, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x252d38, roughness: 0.88 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xc9bda7, roughness: 0.92 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb88b4d, metalness: 0.45, roughness: 0.42 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x29485c, metalness: 0.22, roughness: 0.28, transparent: true, opacity: 0.36 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x9b927f, roughness: 0.95 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x573b2b, roughness: 0.86 });
  const interiorLight = new THREE.MeshStandardMaterial({ color: 0xffd69a, emissive: 0xb56b27, emissiveIntensity: 0.55 });

  // Exterior estate remains in Oriyaba and is visible before the player enters.
  const exterior = new THREE.Group();
  scene.add(exterior);
  addBox(exterior, [13.5, 0.12, 22], [16.7, 0.02, -38], new THREE.MeshStandardMaterial({ color: 0x344a37, roughness: 1 }));
  addBox(exterior, [3.2, 0.1, 22], [10.3, 0.08, -38], stone);

  addSolid(exterior, [0.45, 2.8, 7.25], [10, 1.4, -31.125], stone, colliders, 0, 2.8);
  addSolid(exterior, [0.45, 2.8, 7.25], [10, 1.4, -44.875], stone, colliders, 0, 2.8);
  addSolid(exterior, [0.45, 2.8, 22], [23.5, 1.4, -38], stone, colliders, 0, 2.8);
  addSolid(exterior, [13.5, 2.8, 0.45], [16.7, 1.4, -27], stone, colliders, 0, 2.8);
  addSolid(exterior, [13.5, 2.8, 0.45], [16.7, 1.4, -49], stone, colliders, 0, 2.8);

  const gate = new THREE.Group();
  gate.position.set(10, 0, -38);
  addBox(gate, [0.12, 2.35, 3.25], [0, 1.2, 1.63], dark);
  addBox(gate, [0.12, 2.35, 3.25], [0, 1.2, -1.63], dark);
  for (let i = 0; i < 6; i += 1) addBox(gate, [0.16, 2.55, 0.08], [0, 1.25, -2.8 + i * 1.12], gold);
  exterior.add(gate);
  const gateCollider = { minX: 9.88, maxX: 10.16, minZ: -41.25, maxZ: -34.75, minY: 0, maxY: 2.5, active: true };
  colliders.push(gateCollider);

  addSolid(exterior, [2.6, 2.6, 2.3], [8, 1.3, -34.2], cream, colliders, 0, 2.6);
  addBox(exterior, [2.9, 0.2, 2.6], [8, 2.7, -34.2], dark);

  // Mansion facade: the doorway is deliberately open so the entry point is obvious.
  addBox(exterior, [9.2, 0.22, 8.4], [17, 0.02, -39.2], dark);
  addSolid(exterior, [0.28, 4.5, 8.4], [12.46, 2.25, -39.2], cream, colliders, 0, 4.5);
  addSolid(exterior, [0.28, 4.5, 8.4], [21.54, 2.25, -39.2], cream, colliders, 0, 4.5);
  addSolid(exterior, [9.35, 4.5, 0.28], [17, 2.25, -43.4], cream, colliders, 0, 4.5);
  addSolid(exterior, [3.55, 4.5, 0.28], [14.15, 2.25, -35], cream, colliders, 0, 4.5);
  addSolid(exterior, [3.55, 4.5, 0.28], [19.85, 2.25, -35], cream, colliders, 0, 4.5);
  addBox(exterior, [9.8, 0.45, 9], [17, 4.65, -39.2], dark);
  for (const x of [13.8, 20.2]) {
    addBox(exterior, [1.15, 1.35, 0.08], [x, 2.6, -34.82], glass);
    addBox(exterior, [1.25, 0.08, 0.12], [x, 2.6, -34.76], gold);
  }
  for (let i = 0; i < 3; i += 1) addBox(exterior, [2.8, 0.14, 0.42], [17, 0.07 + i * 0.14, -34.25 - i * 0.4], stone);
  const doorGlow = new THREE.PointLight(0xffc77c, 0.8, 7);
  doorGlow.position.set(17, 3.1, -34.2);
  exterior.add(doorGlow);

  // The interior is a separate lightweight walkable environment. It is switched on
  // only after the player reaches and enters the exterior front door.
  const interior = new THREE.Group();
  interior.visible = false;
  scene.add(interior);
  const lobbyX = 106;
  const lobbyZ = 2;
  addBox(interior, [12, 0.24, 20], [lobbyX, -0.12, lobbyZ], floor);
  addBox(interior, [12.4, 0.3, 20.4], [lobbyX, -0.34, lobbyZ], dark);

  // Enclosing ground-floor walls, with a wide front doorway.
  addSolid(interior, [0.25, 4.4, 20], [100, 2.2, 2], cream, colliders, 0, 4.4);
  addSolid(interior, [0.25, 4.4, 20], [112, 2.2, 2], cream, colliders, 0, 4.4);
  addSolid(interior, [12, 4.4, 0.25], [106, 2.2, -8], cream, colliders, 0, 4.4);
  addSolid(interior, [3.8, 4.4, 0.25], [101.9, 2.2, 12], cream, colliders, 0, 4.4);
  addSolid(interior, [3.8, 4.4, 0.25], [110.1, 2.2, 12], cream, colliders, 0, 4.4);

  // Lobby columns, reception console, seating and warm ceiling fixtures.
  for (const x of [101.3, 110.7]) {
    for (const z of [-5.5, 8.5]) {
      addBox(interior, [0.38, 4.1, 0.38], [x, 2.05, z], dark);
      addBox(interior, [0.55, 0.16, 0.55], [x, 4.12, z], gold);
    }
  }
  addBox(interior, [3.2, 0.95, 0.85], [105.5, 0.48, 8.3], wood);
  addBox(interior, [3.35, 0.12, 0.95], [105.5, 1.0, 8.3], gold);
  addBox(interior, [2.4, 0.48, 0.85], [102.7, 0.24, -4.8], wood);
  addBox(interior, [2.4, 0.48, 0.85], [109.3, 0.24, -4.8], wood);
  for (const x of [103, 106, 109]) {
    const lamp = new THREE.PointLight(0xffd29a, 0.7, 9);
    lamp.position.set(x, 3.75, 3);
    interior.add(lamp);
    addBox(interior, [0.65, 0.08, 0.65], [x, 4.25, 3], interiorLight);
  }

  // Broad, clearly visible staircase: ten real treads rising toward the upper landing.
  const stairX = 109;
  const stairBottomZ = 5.2;
  const stairTopZ = -1.8;
  for (let i = 0; i < 10; i += 1) {
    const rise = (i + 1) * 0.435;
    const z = stairBottomZ - (i + 0.5) * 0.7;
    addBox(interior, [2.25, 0.12, 0.74], [stairX, rise - 0.06, z], i % 2 ? dark : stone);
    addBox(interior, [2.3, 0.08, 0.12], [stairX, rise + 0.02, z - 0.31], gold);
  }
  for (const x of [107.78, 110.22]) {
    const rail = addBox(interior, [0.12, 1.05, 7.2], [x, 2.3, 1.7], gold);
    rail.rotation.x = -Math.atan(4.35 / 7);
    colliders.push({ minX: x - 0.09, maxX: x + 0.09, minZ: -1.95, maxZ: 5.35, minY: 0, maxY: 4.7 });
  }

  // Upper level is built in sections so the stair opening remains open.
  addBox(interior, [6.5, 0.22, 10], [103.25, 4.35, -3], floor);
  addBox(interior, [3.0, 0.22, 3.2], [109.5, 4.35, -6.4], floor);
  addBox(interior, [3.0, 0.22, 3.4], [109.5, 4.35, 2.2], floor);
  addBox(interior, [3.0, 0.22, 2.0], [109.5, 4.35, -3.9], floor);
  addBox(interior, [3.0, 0.22, 1.8], [109.5, 4.35, -0.3], floor);

  // Upper corridor and enclosed private office with a real doorway.
  addSolid(interior, [0.22, 2.8, 7.8], [100.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addSolid(interior, [0.22, 2.8, 7.8], [111.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addSolid(interior, [5.4, 2.8, 0.22], [103.2, 5.85, -7], cream, colliders, 4.4, 7.3);
  addSolid(interior, [5.4, 2.8, 0.22], [108.8, 5.85, -7], cream, colliders, 4.4, 7.3);
  addSolid(interior, [0.22, 2.8, 4.8], [109.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addBox(interior, [11.6, 0.25, 8.2], [106, 7.3, -3.1], dark);
  for (const x of [102.2, 109.8]) {
    addBox(interior, [1.2, 1.2, 0.07], [x, 6.0, 0.42], glass);
    addBox(interior, [1.25, 0.08, 0.1], [x, 6.0, 0.48], gold);
  }
  addBox(interior, [2.2, 0.85, 1.0], [104.2, 4.9, -4.3], wood);
  addBox(interior, [2.4, 0.12, 1.1], [104.2, 5.36, -4.3], gold);
  addBox(interior, [1.5, 1.8, 0.12], [106.2, 5.25, -6.1], dark);
  const officeLamp = new THREE.PointLight(0xffc77c, 0.9, 8);
  officeLamp.position.set(106, 6.5, -3.8);
  interior.add(officeLamp);

  // Glass elevator shaft and a visible cabin with three enclosed sides.
  const shaft = new THREE.Group();
  shaft.position.set(102.8, 0, 0.1);
  interior.add(shaft);
  colliders.push(
    { minX: 101.72, maxX: 101.9, minZ: -1.05, maxZ: 1.1, minY: 0, maxY: 7.1 },
    { minX: 103.7, maxX: 103.88, minZ: -1.05, maxZ: 1.1, minY: 0, maxY: 7.1 },
    { minX: 101.8, maxX: 103.8, minZ: -1.1, maxZ: -0.92, minY: 0, maxY: 7.1 }
  );
  addBox(shaft, [2.0, 7.0, 2.0], [0, 3.5, 0], glass);
  addBox(shaft, [0.1, 7.0, 2.0], [-1.0, 3.5, 0], gold);
  addBox(shaft, [0.1, 7.0, 2.0], [1.0, 3.5, 0], gold);
  addBox(shaft, [2.0, 7.0, 0.1], [0, 3.5, -1.0], gold);
  const cabin = new THREE.Group();
  shaft.add(cabin);
  addBox(cabin, [1.72, 0.14, 1.72], [0, 0, 0], dark);
  addBox(cabin, [0.1, 2.35, 1.68], [-0.81, 1.2, 0], dark);
  addBox(cabin, [0.1, 2.35, 1.68], [0.81, 1.2, 0], dark);
  addBox(cabin, [1.68, 2.35, 0.1], [0, 1.2, -0.81], dark);
  addBox(cabin, [1.72, 0.1, 1.72], [0, 2.4, 0], dark);
  const leftDoor = addBox(cabin, [0.82, 2.25, 0.1], [-0.42, 1.15, 0.82], gold);
  const rightDoor = addBox(cabin, [0.82, 2.25, 0.1], [0.42, 1.15, 0.82], gold);
  addBox(leftDoor, [0.58, 1.7, 0.035], [0, 0, 0.06], glass);
  addBox(rightDoor, [0.58, 1.7, 0.035], [0, 0, 0.06], glass);

  let liftState = 'idle';
  let liftTimer = 0;
  function setLiftDoors(open) {
    leftDoor.position.x = open ? -0.82 : -0.42;
    rightDoor.position.x = open ? 0.82 : 0.42;
  }

  function isOnStairs(x, z) {
    return x >= 107.8 && x <= 110.2 && z <= stairBottomZ + 0.25 && z >= stairTopZ - 0.25;
  }

  function getFloorY(x, z, currentY = 0) {
    if (!interior.visible) return 0;
    if (isOnStairs(x, z)) {
      const progress = THREE.MathUtils.clamp((stairBottomZ - z) / (stairBottomZ - stairTopZ), 0, 1);
      return progress * 4.35;
    }
    const onUpper = x >= 100.8 && x <= 111.2 && z >= -6.7 && z <= 4.8;
    if (currentY > 3.8 && onUpper) return 4.35;
    return 0;
  }

  return {
    colliders,
    gatekeeperPosition: new THREE.Vector3(8.35, 0, -34.6),
    recipientPosition: new THREE.Vector3(106, 4.35, -4.6),
    enterInterior(player) {
      if (interior.visible) return false;
      exterior.visible = false;
      interior.visible = true;
      player.position.set(106, 0, 10.1);
      player.rotation.y = Math.PI;
      return true;
    },
    isInterior() { return interior.visible; },
    isOnStairs,
    isNearStairs(x, z) {
      return interior.visible && Math.hypot(x - stairX, z - stairBottomZ) <= 2.0;
    },
    isNearLift(x, z) {
      return interior.visible && Math.hypot(x - 102.8, z - 1.9) <= 1.8;
    },
    getFloorY,
    startLiftRide(player) {
      if (!interior.visible || liftState !== 'idle') return false;
      player.position.set(102.8, 0, 0.1);
      cabin.position.y = 0;
      setLiftDoors(true);
      liftState = 'opening-ground';
      liftTimer = 0;
      return true;
    },
    isLiftRunning() { return liftState !== 'idle'; },
    updateLift(delta, player) {
      if (liftState === 'idle') return false;
      liftTimer += delta;
      if (liftState === 'opening-ground' && liftTimer >= 0.55) {
        setLiftDoors(false);
        liftState = 'closing-ground';
        liftTimer = 0;
      } else if (liftState === 'closing-ground' && liftTimer >= 0.55) {
        liftState = 'moving-up';
        liftTimer = 0;
      } else if (liftState === 'moving-up') {
        const progress = THREE.MathUtils.clamp(liftTimer / 2.2, 0, 1);
        cabin.position.y = progress * 4.35;
        player.position.y = progress * 4.35;
        if (progress >= 1) {
          setLiftDoors(true);
          liftState = 'opening-upper';
          liftTimer = 0;
        }
      } else if (liftState === 'opening-upper' && liftTimer >= 0.6) {
        player.position.set(102.8, 4.35, 1.55);
        liftState = 'idle';
        liftTimer = 0;
        return false;
      }
      return true;
    },
    openGate() {
      gate.rotation.y = -Math.PI * 0.42;
      gateCollider.active = false;
    }
  };
}
