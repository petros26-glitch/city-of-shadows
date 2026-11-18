import * as THREE from 'three';

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function solidBox(parent, size, position, material, colliders, minY = 0, maxY = size[1]) {
  const mesh = box(parent, size, position, material);
  colliders.push({
    minX: position[0] - size[0] / 2,
    maxX: position[0] + size[0] / 2,
    minZ: position[2] - size[2] / 2,
    maxZ: position[2] + size[2] / 2,
    minY,
    maxY
  });
  return mesh;
}

export function createRecipientResidence(scene) {
  const colliders = [];
  const stone = new THREE.MeshStandardMaterial({ color: 0x77766f, roughness: 0.95 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x343a42, roughness: 0.9 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xc4b79e, roughness: 0.92 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x252b35, roughness: 0.88 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb88b4d, metalness: 0.55, roughness: 0.38 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x243c50, metalness: 0.3, roughness: 0.25,
    emissive: 0x101c29, emissiveIntensity: 0.18
  });
  const lawn = new THREE.MeshStandardMaterial({ color: 0x344b37, roughness: 1 });
  const driveway = new THREE.MeshStandardMaterial({ color: 0x77746c, roughness: 1 });

  const estate = new THREE.Group();
  scene.add(estate);

  box(estate, [13.5, 0.12, 22], [16.7, 0.02, -38], lawn);
  box(estate, [3.2, 0.1, 22], [10.3, 0.08, -38], driveway);

  // Perimeter walls leave a real opening for the guarded entrance.
  solidBox(estate, [0.45, 2.8, 7.25], [10, 1.4, -31.125], stone, colliders, 0, 2.8);
  solidBox(estate, [0.45, 2.8, 7.25], [10, 1.4, -44.875], stone, colliders, 0, 2.8);
  solidBox(estate, [0.45, 2.8, 22], [23.5, 1.4, -38], stone, colliders, 0, 2.8);
  solidBox(estate, [13.5, 2.8, 0.45], [16.7, 1.4, -27], stone, colliders, 0, 2.8);
  solidBox(estate, [13.5, 2.8, 0.45], [16.7, 1.4, -49], stone, colliders, 0, 2.8);

  for (const z of [-41.5, -34.5]) {
    solidBox(estate, [0.8, 3.8, 0.8], [10, 1.9, z], darkStone, colliders, 0, 3.8);
    box(estate, [1.05, 0.25, 1.05], [10, 3.85, z], gold);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), gold);
    lamp.position.set(10, 4.1, z);
    estate.add(lamp);
  }

  const gate = new THREE.Group();
  gate.position.set(10, 0, -38);
  box(gate, [0.12, 2.35, 3.25], [0, 1.2, 1.63], darkStone);
  box(gate, [0.12, 2.35, 3.25], [0, 1.2, -1.63], darkStone);
  for (let i = 0; i < 6; i += 1) {
    box(gate, [0.16, 2.55, 0.08], [0, 1.25, -2.8 + i * 1.12], gold);
  }
  estate.add(gate);
  const gateCollider = {
    minX: 9.88, maxX: 10.16, minZ: -41.25, maxZ: -34.75,
    minY: 0, maxY: 2.5, active: true
  };
  colliders.push(gateCollider);

  // Security gatehouse.
  solidBox(estate, [2.6, 2.6, 2.3], [8, 1.3, -34.2], cream, colliders, 0, 2.6);
  box(estate, [2.9, 0.2, 2.6], [8, 2.7, -34.2], roof);
  box(estate, [0.08, 1.0, 1.0], [6.67, 1.65, -34.2], glass);

  // Mansion ground floor: four real walls, with a proper front entrance.
  box(estate, [9.2, 0.18, 8.4], [17, 0.02, -39.2], darkStone);
  solidBox(estate, [0.25, 4.25, 8.4], [12.525, 2.125, -39.2], cream, colliders, 0, 4.25);
  solidBox(estate, [0.25, 4.25, 8.4], [21.475, 2.125, -39.2], cream, colliders, 0, 4.25);
  solidBox(estate, [9.2, 4.25, 0.25], [17, 2.125, -43.275], cream, colliders, 0, 4.25);
  solidBox(estate, [3.6, 4.25, 0.25], [14.2, 2.125, -35.075], cream, colliders, 0, 4.25);
  solidBox(estate, [3.6, 4.25, 0.25], [19.8, 2.125, -35.075], cream, colliders, 0, 4.25);

  // Door frame and front windows.
  for (const x of [15.95, 18.05]) {
    box(estate, [0.18, 3.2, 0.2], [x, 1.6, -34.91], gold);
  }
  box(estate, [2.25, 0.18, 0.2], [17, 3.15, -34.91], gold);
  for (const x of [13.8, 20.2]) {
    box(estate, [1.15, 1.35, 0.08], [x, 2.55, -34.91], glass);
    box(estate, [1.25, 0.08, 0.12], [x, 2.55, -34.84], gold);
  }
  // The stairwell opening stays clear; the upper floor pieces form the first-floor ceiling.

  // Front approach steps, aligned with the actual doorway.
  for (let i = 0; i < 3; i += 1) {
    box(estate, [2.8, 0.14, 0.42], [17, 0.07 + i * 0.14, -34.25 - i * 0.4], stone);
  }

  // Upstairs floor has separate openings for the staircase and elevator shaft.
  box(estate, [0.55, 0.2, 7.4], [13.075, 4.25, -39.2], cream);
  box(estate, [3.1, 0.2, 7.4], [16.8, 4.25, -39.2], cream);
  box(estate, [1.9, 0.2, 3.5], [14.3, 4.25, -37.1], cream);
  box(estate, [1.9, 0.2, 2.0], [14.3, 4.25, -41.85], cream);
  box(estate, [0.95, 0.2, 7.4], [20.725, 4.25, -39.2], cream);
  box(estate, [1.9, 0.2, 0.9], [19.3, 4.25, -35.95], cream);
  box(estate, [1.9, 0.2, 2.0], [19.3, 4.25, -41.9], cream);
  box(estate, [1.9, 0.2, 0.5], [19.3, 4.25, -40.65], cream);

  // Visible staircase: ten individual treads with a continuous walkable incline.
  const stairBottomZ = -35.6;
  const stairTopZ = -40.6;
  for (let i = 0; i < 10; i += 1) {
    const tread = box(
      estate,
      [1.55, 0.08, 0.5],
      [19.3, (i + 0.5) * 0.435 - 0.04, stairBottomZ - (i + 0.5) * 0.5],
      stone
    );
    tread.material = i % 2 === 0 ? stone : darkStone;
  }
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x343a42, metalness: 0.35, roughness: 0.7 });
  for (const x of [18.42, 20.18]) {
    const rail = box(estate, [0.12, 1.05, 5.25], [x, 2.35, -38.1], railMaterial);
    rail.rotation.x = 0.70;
    colliders.push({
      minX: x - 0.16, maxX: x + 0.16, minZ: -40.75, maxZ: -35.45,
      minY: 0, maxY: 4.5
    });
  }

  // Elevator shaft, glass enclosure and moving cabin.
  const liftFrame = new THREE.MeshStandardMaterial({ color: 0x9a7445, metalness: 0.62, roughness: 0.36 });
  const liftMetal = new THREE.MeshStandardMaterial({ color: 0x343b45, metalness: 0.55, roughness: 0.42 });
  const liftGlass = new THREE.MeshStandardMaterial({ color: 0x30495c, metalness: 0.28, roughness: 0.22, transparent: true, opacity: 0.48 });
  for (const x of [13.3, 15.3]) {
    box(estate, [0.12, 7.25, 0.12], [x, 3.63, -38.85], liftFrame);
    box(estate, [0.08, 7.1, 1.85], [x, 3.62, -39.85], liftGlass);
  }
  box(estate, [2.0, 7.1, 0.08], [14.3, 3.62, -40.8], liftGlass);
  box(estate, [0.12, 7.25, 0.12], [13.3, 3.63, -40.8], liftFrame);
  box(estate, [0.12, 7.25, 0.12], [15.3, 3.63, -40.8], liftFrame);
  for (const x of [13.3, 15.3]) {
    box(estate, [0.12, 7.25, 0.12], [x, 3.63, -38.85], liftFrame);
    colliders.push({ minX: x - 0.07, maxX: x + 0.07, minZ: -40.9, maxZ: -38.8, minY: 0, maxY: 7.3 });
  }
  colliders.push({ minX: 13.3, maxX: 15.3, minZ: -40.9, maxZ: -40.72, minY: 0, maxY: 7.3 });

  const liftCar = new THREE.Group();
  liftCar.position.set(14.3, 0, -39.85);
  estate.add(liftCar);
  box(liftCar, [1.72, 0.14, 1.72], [0, 0.12, 0], liftMetal);
  box(liftCar, [0.1, 2.42, 1.68], [-0.81, 1.39, 0], liftMetal);
  box(liftCar, [0.1, 2.42, 1.68], [0.81, 1.39, 0], liftMetal);
  box(liftCar, [1.68, 2.42, 0.1], [0, 1.39, -0.81], liftMetal);
  box(liftCar, [1.72, 0.12, 1.72], [0, 2.62, 0], liftMetal);
  const liftLeftDoor = box(liftCar, [0.76, 2.28, 0.09], [-0.39, 1.35, 0.82], liftFrame);
  const liftRightDoor = box(liftCar, [0.76, 2.28, 0.09], [0.39, 1.35, 0.82], liftFrame);
  const liftDoorInset = new THREE.MeshStandardMaterial({ color: 0x1b2734, metalness: 0.5, roughness: 0.38 });
  box(liftLeftDoor, [0.52, 1.75, 0.035], [0, 0, 0.055], liftDoorInset);
  box(liftRightDoor, [0.52, 1.75, 0.035], [0, 0, 0.055], liftDoorInset);
  let liftState = 'idle';
  let liftTimer = 0;

  function setLiftDoors(open) {
    liftLeftDoor.position.x = open ? -0.78 : -0.39;
    liftRightDoor.position.x = open ? 0.78 : 0.39;
  }

  // Fully enclosed upstairs office: four walls, roof, windows and interior.
  const upperWallY = 5.72;
  solidBox(estate, [0.22, 2.9, 7.6], [12.8, upperWallY, -39.2], cream, colliders, 4.3, 7.2);
  solidBox(estate, [0.22, 2.9, 7.6], [21.2, upperWallY, -39.2], cream, colliders, 4.3, 7.2);
  solidBox(estate, [8.4, 2.9, 0.22], [17, upperWallY, -43], cream, colliders, 4.3, 7.2);
  solidBox(estate, [8.4, 2.9, 0.22], [17, upperWallY, -35.4], cream, colliders, 4.3, 7.2);
  box(estate, [8.8, 0.28, 8.0], [17, 7.3, -39.2], roof);

  // Window panes remain visible on all sides of the upper room.
  for (const x of [14.5, 19.5]) {
    box(estate, [1.2, 1.25, 0.07], [x, 5.85, -35.26], glass);
    box(estate, [1.2, 0.07, 0.1], [x, 5.85, -35.2], gold);
  }
  for (const z of [-37.3, -41.1]) {
    box(estate, [0.07, 1.2, 1.25], [12.66, 5.85, z], glass);
    box(estate, [0.1, 0.07, 1.25], [12.62, 5.85, z], gold);
    box(estate, [0.07, 1.2, 1.25], [21.34, 5.85, z], glass);
  }

  // Desk and furnishings in the private office.
  box(estate, [2.8, 0.9, 1.0], [15.6, 4.9, -38.2], darkStone);
  box(estate, [2.4, 0.12, 0.85], [15.6, 5.38, -38.2], gold);
  box(estate, [0.12, 1.7, 2.0], [17.2, 5.25, -42.0], glass);
  const officeLight = new THREE.PointLight(0xffc77c, 1.0, 9);
  officeLight.position.set(17, 6.35, -38);
  estate.add(officeLight);

  function isOnStairs(x, z) {
    return x >= 18.62 && x <= 19.98 && z <= stairBottomZ + 0.2 && z >= stairTopZ - 0.15;
  }

  function getFloorY(x, z, currentY = 0) {
    if (isOnStairs(x, z)) {
      const progress = THREE.MathUtils.clamp((stairBottomZ - z) / (stairBottomZ - stairTopZ), 0, 1);
      return progress * 4.35;
    }
    const insideUpperRoom =
      x >= 12.95 && x <= 21.05 &&
      z >= -42.85 && z <= -35.55;
    if (currentY > 3.8 && insideUpperRoom) return 4.35;
    return 0;
  }

  return {
    colliders,
    gatekeeperPosition: new THREE.Vector3(8.35, 0, -34.6),
    stairsPosition: new THREE.Vector3(19.3, 0, -35.6),
    isOnStairs,
    isNearStairs(x, z) {
      return Math.hypot(x - 19.3, z - stairBottomZ) <= 1.85;
    },
    getFloorY,
    startLiftRide(player) {
      if (liftState !== 'idle') return false;
      player.position.set(14.3, 0, -39.85);
      liftCar.position.y = 0;
      setLiftDoors(true);
      liftState = 'opening-ground';
      liftTimer = 0;
      return true;
    },
    isLiftRunning() {
      return liftState !== 'idle';
    },
    updateLift(delta, player) {
      if (liftState === 'idle') return false;
      liftTimer += delta;
      if (liftState === 'opening-ground' && liftTimer >= 0.45) {
        setLiftDoors(false);
        liftState = 'closing-ground';
        liftTimer = 0;
      } else if (liftState === 'closing-ground' && liftTimer >= 0.45) {
        liftState = 'moving-up';
        liftTimer = 0;
      } else if (liftState === 'moving-up') {
        const progress = THREE.MathUtils.clamp(liftTimer / 1.8, 0, 1);
        liftCar.position.y = progress * 4.35;
        player.position.y = progress * 4.35;
        if (progress >= 1) {
          setLiftDoors(true);
          liftState = 'opening-upper';
          liftTimer = 0;
        }
      } else if (liftState === 'opening-upper' && liftTimer >= 0.5) {
        player.position.set(14.3, 4.35, -38.35);
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
