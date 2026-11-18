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

function addPlatform(parent, size, position, material, colliders, platforms, minY) {
  addSolid(parent, size, position, material, colliders, minY, position[1] + size[1] / 2);
  platforms.push({
    minX: position[0] - size[0] / 2,
    maxX: position[0] + size[0] / 2,
    minZ: position[2] - size[2] / 2,
    maxZ: position[2] + size[2] / 2,
    topY: position[1] + size[1] / 2
  });
}

export function createRecipientResidence(scene) {
  const colliders = [];
  const platforms = [];
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
  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(0, 0, 3.25);
  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(0, 0, -3.25);
  for (const leaf of [leftLeaf, rightLeaf]) {
    addBox(leaf, [0.14, 2.35, 3.18], [0, 1.2, -1.59], dark);
    addBox(leaf, [0.18, 2.5, 0.12], [0, 1.25, -0.08], gold);
    addBox(leaf, [0.18, 2.5, 0.12], [0, 1.25, -3.1], gold);
    for (let i = 1; i <= 5; i += 1) addBox(leaf, [0.11, 2.2, 0.075], [0, 1.2, -i * 0.51], gold);
    gate.add(leaf);
  }
  exterior.add(gate);
  const gateCollider = { minX: 9.84, maxX: 10.18, minZ: -41.3, maxZ: -34.7, minY: 0, maxY: 2.55, active: true };
  colliders.push(gateCollider);
  let gateOpening = false;
  let gateOpenProgress = 0;
  for (const z of [-42.1, -33.9]) {
    addBox(exterior, [0.72, 3.0, 0.72], [10, 1.5, z], stone);
    addBox(exterior, [0.9, 0.18, 0.9], [10, 3.05, z], gold);
    const lantern = new THREE.PointLight(0xffc77c, 0.65, 6);
    lantern.position.set(10, 2.8, z);
    exterior.add(lantern);
  }
  addSolid(exterior, [2.6, 2.6, 2.3], [8, 1.3, -34.2], cream, colliders, 0, 2.6);
  addBox(exterior, [2.9, 0.2, 2.6], [8, 2.7, -34.2], dark);
  addBox(exterior, [2.1, 0.9, 0.08], [8, 1.8, -33.02], glass);
  addBox(exterior, [2.2, 0.1, 0.14], [8, 2.28, -32.98], gold);

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

  // Heavy double front doors. The player must approach the entrance and let them swing open.
  const mainDoors = new THREE.Group();
  exterior.add(mainDoors);
  const leftMainDoor = new THREE.Group();
  leftMainDoor.position.set(16.0, 0, -34.84);
  const rightMainDoor = new THREE.Group();
  rightMainDoor.position.set(18.0, 0, -34.84);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x493021, roughness: 0.82 });
  addBox(leftMainDoor, [1.0, 3.45, 0.16], [0.5, 1.73, 0], doorMaterial);
  addBox(rightMainDoor, [1.0, 3.45, 0.16], [-0.5, 1.73, 0], doorMaterial);
  for (const pivot of [leftMainDoor, rightMainDoor]) {
    addBox(pivot, [0.08, 3.1, 0.04], [pivot === leftMainDoor ? 0.85 : -0.85, 1.73, 0.1], gold);
    addBox(pivot, [0.13, 0.13, 0.09], [pivot === leftMainDoor ? 0.82 : -0.82, 1.72, 0.15], gold);
    mainDoors.add(pivot);
  }
  const mainDoorCollider = { minX: 15.98, maxX: 18.02, minZ: -34.98, maxZ: -34.7, minY: 0, maxY: 3.5, active: true };
  colliders.push(mainDoorCollider);
  let mainDoorProgress = 0;
  let entryPending = false;
  let entryPlayer = null;
  let exitPending = false;
  let exitPlayer = null;
  let exitDoorProgress = 0;

  // The interior is a separate lightweight walkable environment. It is switched on
  // only after the player reaches and enters the exterior front door.
  const interior = new THREE.Group();
  interior.visible = false;
  scene.add(interior);
  let officeDoorProgress = 0;
  let officeDoorOpening = false;
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
  addPlatform(interior, [3.2, 1.04, 0.85], [105.5, 0.52, 8.3], wood, colliders, platforms, 0);
  addBox(interior, [3.35, 0.12, 0.95], [105.5, 1.0, 8.3], gold);
  addBox(interior, [3.35, 0.12, 0.95], [105.5, 1.0, 8.3], gold);
  addPlatform(interior, [2.4, 0.48, 0.85], [102.7, 0.24, -4.8], wood, colliders, platforms, 0);
  addPlatform(interior, [2.4, 0.48, 0.85], [109.3, 0.24, -4.8], wood, colliders, platforms, 0);
  const rug = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.035, 3.0), new THREE.MeshStandardMaterial({ color: 0x513b35, roughness: 1 }));
  rug.position.set(106, 0.025, 4.1);
  interior.add(rug);
  for (const x of [100.9, 111.1]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.48, 8), wood);
    pot.position.set(x, 0.24, 7.2);
    interior.add(pot);
    const leaves = new THREE.Group();
    leaves.position.set(x, 0.48, 7.2);
    for (let i = 0; i < 5; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.15, 5), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x315b3d : 0x47734b, roughness: 1 }));
      leaf.position.y = 0.48;
      leaf.rotation.z = (i - 2) * 0.28;
      leaves.add(leaf);
    }
    interior.add(leaves);
    colliders.push({ minX: x - 0.42, maxX: x + 0.42, minZ: 6.75, maxZ: 7.65, minY: 0, maxY: 1.6 });
  }
  addBox(interior, [1.4, 1.0, 0.12], [106, 2.5, -7.78], wood);
  addBox(interior, [1.12, 0.72, 0.035], [106, 2.52, -7.69], gold);
  addBox(interior, [0.8, 0.06, 0.52], [105.5, 1.55, 8.05], dark);
  addBox(interior, [0.48, 0.08, 0.34], [105.5, 1.62, 8.02], glass);
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
  addBox(interior, [3.0, 0.22, 2.2], [109.5, 4.35, -2.0], floor);

  // Upper corridor and enclosed private office with a real doorway.
  addSolid(interior, [0.22, 2.8, 7.8], [100.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addSolid(interior, [0.22, 2.8, 7.8], [111.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addSolid(interior, [4.4, 2.8, 0.22], [102.9, 5.85, -7], cream, colliders, 4.4, 7.3);
  addSolid(interior, [4.4, 2.8, 0.22], [109.1, 5.85, -7], cream, colliders, 4.4, 7.3);
  addSolid(interior, [0.22, 2.8, 4.8], [109.5, 5.85, -3.1], cream, colliders, 4.4, 7.3);
  addBox(interior, [11.6, 0.25, 8.2], [106, 7.3, -3.1], dark);
  for (const x of [102.2, 109.8]) {
    addBox(interior, [1.2, 1.2, 0.07], [x, 6.0, 0.42], glass);
    addBox(interior, [1.25, 0.08, 0.1], [x, 6.0, 0.48], gold);
  }
  // Upstairs reception: one shared destination for the staircase and elevator.
  // The desk faces the open landing; the secretary sits behind it with a chair,
  // computer, keyboard, desk phone and a small visitor bell.
  addPlatform(interior, [3.25, 1.12, 0.92], [105.5, 4.79, -0.55], wood, colliders, platforms, 4.35);
  addBox(interior, [3.38, 0.12, 1.02], [105.5, 5.29, -0.55], gold);
  addBox(interior, [0.92, 0.08, 0.55], [105.5, 5.39, -0.66], dark);
  addBox(interior, [0.62, 0.42, 0.06], [105.5, 5.65, -0.83], glass);
  addBox(interior, [0.52, 0.035, 0.22], [105.5, 5.36, -0.18], dark);
  addBox(interior, [0.22, 0.12, 0.18], [106.65, 5.38, -0.72], gold);
  addBox(interior, [0.12, 0.06, 0.12], [106.65, 5.47, -0.72], dark);

  // Reception chair and visitor seating.
  addPlatform(interior, [0.82, 0.18, 0.78], [105.5, 4.88, -1.82], dark, colliders, platforms, 4.35);
  addSolid(interior, [0.78, 0.82, 0.16], [105.5, 5.28, -2.18], dark, colliders, 4.35, 5.7);
  addBox(interior, [0.92, 0.12, 0.92], [108.65, 4.65, -0.35], wood);
  addBox(interior, [0.96, 0.1, 0.96], [108.65, 5.02, -0.35], gold);
  addBox(interior, [0.34, 0.46, 0.34], [108.65, 5.29, -0.35], dark);
  const receptionLamp = new THREE.PointLight(0xffd29a, 0.55, 6);
  receptionLamp.position.set(105.5, 6.55, -0.7);
  interior.add(receptionLamp);

  // Keep the office corridor open so the secretary can walk ahead of the player.
  addPlatform(interior, [1.0, 0.62, 0.78], [109.5, 4.68, -4.45], wood, colliders, platforms, 4.35);
  addBox(interior, [1.08, 0.1, 0.86], [109.5, 5.04, -4.45], gold);
  addSolid(interior, [0.28, 2.0, 1.8], [110.9, 5.45, -4.7], wood, colliders, 4.35, 6.6);
  for (let i = 0; i < 4; i += 1) addBox(interior, [0.08, 0.34, 1.45], [110.72, 4.7 + i * 0.43, -4.7], i % 2 ? gold : dark);
  addBox(interior, [0.9, 0.85, 0.06], [102.1, 5.55, -6.78], gold);
  addBox(interior, [0.72, 0.66, 0.04], [102.1, 5.55, -6.72], wood);
  const officeLamp = new THREE.PointLight(0xffc77c, 0.9, 8);
  officeLamp.position.set(106, 6.5, -3.8);
  interior.add(officeLamp);

  // A proper private office suite sits beyond the upper-floor reception corridor.
  // The secretary waits outside; the recipient remains hidden until the office is opened.
  addBox(interior, [11.0, 0.22, 5.35], [106, 4.35, -9.75], floor);
  addBox(interior, [11.4, 0.24, 5.6], [106, 7.3, -9.75], dark);
  addSolid(interior, [0.22, 2.8, 5.35], [100.5, 5.85, -9.75], cream, colliders, 4.35, 7.3);
  addSolid(interior, [0.22, 2.8, 5.35], [111.5, 5.85, -9.75], cream, colliders, 4.35, 7.3);
  addSolid(interior, [11.0, 2.8, 0.22], [106, 5.85, -12.42], cream, colliders, 4.35, 7.3);
  addBox(interior, [1.5, 1.8, 0.08], [102.2, 5.8, -12.27], glass);
  addBox(interior, [1.6, 0.08, 0.1], [102.2, 6.0, -12.2], gold);

  // Double office doors occupy the existing opening in the corridor wall.
  const officeDoors = new THREE.Group();
  interior.add(officeDoors);
  const leftOfficeDoor = new THREE.Group();
  leftOfficeDoor.position.set(105.2, 4.35, -7.08);
  const rightOfficeDoor = new THREE.Group();
  rightOfficeDoor.position.set(106.8, 4.35, -7.08);
  addBox(leftOfficeDoor, [0.8, 2.55, 0.14], [0.4, 1.275, 0], wood);
  addBox(rightOfficeDoor, [0.8, 2.55, 0.14], [-0.4, 1.275, 0], wood);
  for (const panel of [leftOfficeDoor, rightOfficeDoor]) {
    addBox(panel, [0.56, 1.75, 0.035], [panel === leftOfficeDoor ? 0.4 : -0.4, 1.35, 0.09], gold);
    officeDoors.add(panel);
  }
  const officeDoorCollider = {
    minX: 105.12, maxX: 106.88, minZ: -7.2, maxZ: -6.94,
    minY: 4.35, maxY: 7.05, active: true
  };
  colliders.push(officeDoorCollider);
  const officeSign = addBox(interior, [1.15, 0.32, 0.06], [106, 6.95, -6.82], gold);

  // A large executive desk and chair make the recipient's office unmistakable.
  addPlatform(interior, [3.1, 1.12, 0.92], [106, 4.88, -9.45], wood, colliders, platforms, 4.35);
  addBox(interior, [3.25, 0.12, 1.02], [106, 5.38, -9.45], gold);
  addBox(interior, [1.0, 0.08, 0.62], [106, 5.48, -9.45], dark);
  addBox(interior, [0.68, 0.42, 0.04], [106, 5.72, -9.22], glass);
  addSolid(interior, [1.0, 0.72, 0.82], [106, 4.72, -11.35], dark, colliders, 4.35, 5.2);
  const officeRug = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.035, 2.8), new THREE.MeshStandardMaterial({ color: 0x463b36, roughness: 1 }));
  officeRug.position.set(106, 4.49, -9.9);
  interior.add(officeRug);
  const privateLamp = new THREE.PointLight(0xffc98b, 1.0, 9);
  privateLamp.position.set(106, 6.55, -9.5);
  interior.add(privateLamp);

  // The inside face of the same main entrance is used when leaving the mansion.
  const interiorExitDoors = new THREE.Group();
  interior.add(interiorExitDoors);
  const leftExitDoor = new THREE.Group();
  leftExitDoor.position.set(104, 0, 12);
  const rightExitDoor = new THREE.Group();
  rightExitDoor.position.set(108, 0, 12);
  addBox(leftExitDoor, [2, 3.35, 0.16], [1, 1.675, 0], doorMaterial);
  addBox(rightExitDoor, [2, 3.35, 0.16], [-1, 1.675, 0], doorMaterial);
  interiorExitDoors.add(leftExitDoor, rightExitDoor);
  const interiorExitCollider = {
    minX: 103.9, maxX: 108.1, minZ: 11.86, maxZ: 12.14,
    minY: 0, maxY: 3.45, active: true
  };
  colliders.push(interiorExitCollider);

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
  addBox(cabin, [1.45, 0.07, 1.4], [0, 0.11, 0], floor);
  addBox(cabin, [0.55, 0.07, 0.42], [0.63, 1.45, -0.7], gold);
  addBox(cabin, [0.24, 0.18, 0.06], [0.63, 1.45, -0.65], interiorLight);
  for (let i = 0; i < 3; i += 1) {
    const button = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 8),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x72b58a : 0xd6a75e, emissive: i === 0 ? 0x245b38 : 0x79501e, emissiveIntensity: 0.6 })
    );
    button.position.set(0.63, 1.25 - i * 0.16, -0.62);
    cabin.add(button);
  }
  const cabinLamp = new THREE.PointLight(0xffd9a8, 0.65, 4);
  cabinLamp.position.set(0, 2.05, 0);
  cabin.add(cabinLamp);
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

  function getBaseFloorY(x, z, currentY = 0) {
    if (!interior.visible) return 0;
    if (isOnStairs(x, z)) {
      const progress = THREE.MathUtils.clamp((stairBottomZ - z) / (stairBottomZ - stairTopZ), 0, 1);
      return progress * 4.35;
    }
    const onUpper = x >= 100.8 && x <= 111.2 && z >= -12.1 && z <= 4.8;
    if (currentY > 3.8 && onUpper) return 4.35;
    return 0;
  }

  function getFloorY(x, z, currentY = 0) {
    const baseY = getBaseFloorY(x, z, currentY);
    for (const platform of platforms) {
      const inside = x >= platform.minX + 0.08 && x <= platform.maxX - 0.08
        && z >= platform.minZ + 0.08 && z <= platform.maxZ - 0.08;
      if (inside && currentY >= platform.topY - 0.12 && currentY <= platform.topY + 0.45) {
        return Math.max(baseY, platform.topY);
      }
    }
    return baseY;
  }

  function getLandingY(x, z, previousY, nextY, falling) {
    if (!falling) return null;
    let landing = null;
    for (const platform of platforms) {
      const inside = x >= platform.minX + 0.08 && x <= platform.maxX - 0.08
        && z >= platform.minZ + 0.08 && z <= platform.maxZ - 0.08;
      if (inside && previousY >= platform.topY - 0.04 && nextY <= platform.topY) {
        if (landing === null || platform.topY > landing) landing = platform.topY;
      }
    }
    return landing;
  }

  return {
    colliders,
    getLandingY,
    gatekeeperPosition: new THREE.Vector3(8.4, 0, -37.2),
    recipientPosition: new THREE.Vector3(106, 4.35, -11.05),
    secretaryPosition: new THREE.Vector3(105.5, 4.35, -1.28),
    secretaryEscortPosition: new THREE.Vector3(106, 4.35, -5.55),
    enterInterior(player) {
      if (interior.visible || entryPending) return false;
      entryPending = true;
      entryPlayer = player;
      mainDoorProgress = 0;
      return true;
    },
    isEnteringInterior() { return entryPending; },
    updateEntry(delta) {
      if (!entryPending) return false;
      mainDoorProgress = Math.min(1, mainDoorProgress + delta / 0.85);
      const eased = mainDoorProgress * mainDoorProgress * (3 - 2 * mainDoorProgress);
      leftMainDoor.rotation.y = -eased * 1.22;
      rightMainDoor.rotation.y = eased * 1.22;
      if (mainDoorProgress >= 0.82) mainDoorCollider.active = false;
      if (mainDoorProgress >= 1) {
        exterior.visible = false;
        interior.visible = true;
        entryPlayer.position.set(106, 0, 10.1);
        entryPlayer.rotation.y = Math.PI;
        entryPlayer = null;
        entryPending = false;
      }
      return entryPending;
    },
    isInterior() { return interior.visible; },
    isExitingInterior() { return exitPending; },
    isNearExit(x, z) {
      return interior.visible && x >= 104.2 && x <= 107.8 && z >= 9.1 && z <= 11.6;
    },
    exitInterior(player) {
      if (!interior.visible || exitPending) return false;
      exitPending = true;
      exitPlayer = player;
      exitDoorProgress = 0;
      return true;
    },
    updateExit(delta) {
      if (!exitPending) return false;
      exitDoorProgress = Math.min(1, exitDoorProgress + delta / 0.9);
      const eased = exitDoorProgress * exitDoorProgress * (3 - 2 * exitDoorProgress);
      leftExitDoor.rotation.y = -eased * 1.18;
      rightExitDoor.rotation.y = eased * 1.18;
      if (exitDoorProgress >= 0.8) interiorExitCollider.active = false;
      if (exitDoorProgress >= 1) {
        interior.visible = false;
        exterior.visible = true;
        exitPlayer.position.set(17, 0, -32.7);
        exitPlayer.rotation.y = Math.PI;
        exitPlayer = null;
        exitPending = false;
        return false;
      }
      return true;
    },
    isOnStairs,
    isNearStairs(x, z) {
      return interior.visible && Math.hypot(x - stairX, z - stairBottomZ) <= 2.0;
    },
    isNearLift(x, z) {
      return interior.visible && Math.hypot(x - 102.8, z - 1.9) <= 1.8;
    },
    isNearOfficeDoor(x, z) {
      return interior.visible && x >= 104.2 && x <= 107.8 && z >= -8.25 && z <= -6.15;
    },
    getFloorY,
    openOfficeDoor() {
      if (officeDoorOpening || officeDoorProgress >= 1) return;
      officeDoorOpening = true;
      officeDoorProgress = 0;
    },
    isOfficeDoorOpening() { return officeDoorOpening; },
    updateOfficeDoor(delta) {
      if (!officeDoorOpening) return false;
      officeDoorProgress = Math.min(1, officeDoorProgress + delta / 0.8);
      const eased = officeDoorProgress * officeDoorProgress * (3 - 2 * officeDoorProgress);
      leftOfficeDoor.rotation.y = -eased * 1.18;
      rightOfficeDoor.rotation.y = eased * 1.18;
      if (officeDoorProgress >= 0.8) officeDoorCollider.active = false;
      if (officeDoorProgress >= 1) officeDoorOpening = false;
      return officeDoorOpening;
    },
    startLiftRide(player) {
      if (!interior.visible || liftState !== 'idle') return false;
      const fromUpper = player.position.y > 2.5;
      if (fromUpper) {
        player.position.set(102.8, 4.35, 0.1);
        cabin.position.y = 4.35;
        setLiftDoors(true);
        liftState = 'opening-upper';
      } else {
        player.position.set(102.8, 0, 0.1);
        cabin.position.y = 0;
        setLiftDoors(true);
        liftState = 'opening-ground';
      }
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
          liftState = 'arriving-upper';
          liftTimer = 0;
        }
      } else if (liftState === 'arriving-upper' && liftTimer >= 0.55) {
        player.position.set(102.8, 4.35, 1.55);
        liftState = 'idle';
        liftTimer = 0;
        return false;
      } else if (liftState === 'opening-upper' && liftTimer >= 0.55) {
        setLiftDoors(false);
        liftState = 'closing-upper';
        liftTimer = 0;
      } else if (liftState === 'closing-upper' && liftTimer >= 0.55) {
        liftState = 'moving-down';
        liftTimer = 0;
      } else if (liftState === 'moving-down') {
        const progress = THREE.MathUtils.clamp(liftTimer / 2.2, 0, 1);
        cabin.position.y = 4.35 * (1 - progress);
        player.position.y = 4.35 * (1 - progress);
        if (progress >= 1) {
          setLiftDoors(true);
          liftState = 'arriving-ground';
          liftTimer = 0;
        }
      } else if (liftState === 'arriving-ground' && liftTimer >= 0.55) {
        player.position.set(102.8, 0, 1.55);
        liftState = 'idle';
        liftTimer = 0;
        return false;
      }
      return true;
    },
    openGate() {
      if (gateOpening || gateOpenProgress >= 1) return;
      gateOpening = true;
      gateOpenProgress = 0;
    },
    updateGate(delta) {
      if (!gateOpening) return false;
      gateOpenProgress = Math.min(1, gateOpenProgress + delta / 1.25);
      const eased = gateOpenProgress * gateOpenProgress * (3 - 2 * gateOpenProgress);
      leftLeaf.rotation.y = eased * 1.42;
      rightLeaf.rotation.y = -eased * 1.42;
      if (gateOpenProgress >= 0.82) gateCollider.active = false;
      if (gateOpenProgress >= 1) gateOpening = false;
      return gateOpening;
    },
    isGateOpening() { return gateOpening; }
  };
}
