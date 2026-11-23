import * as THREE from 'three';

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function makePedestrian(scene, x, z, shirtColor, route, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const skin = new THREE.MeshStandardMaterial({ color: 0x805039, roughness: 0.95 });
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.92 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x252b34, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.55, 2, 7), shirt);
  torso.position.y = 1.02;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 7), skin);
  head.position.y = 1.62;
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.205, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.48), dark);
  hair.position.y = 1.68;
  group.add(hair);
  const legs = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 2, 5), trousers);
    leg.position.set(side * 0.12, 0.43, 0);
    group.add(leg);
    legs.push(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 2, 5), skin);
    arm.position.set(side * 0.3, 1.02, 0);
    arm.rotation.z = side * -0.12;
    group.add(arm);
    arms.push(arm);
  }
  group.scale.setScalar(scale);
  scene.add(group);
  return { group, legs, arms, route, routeIndex: 1, walkTime: 1.7, pause: 0.8 };
}

function makeShopStall(scene, x, z, color, sign, colliders) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wood = new THREE.MeshStandardMaterial({ color: 0x765039, roughness: 1 });
  const canopy = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x242a31, roughness: 1 });
  box(group, [1.65, 0.9, 1.05], [0, 0.52, 0], wood);
  box(group, [1.9, 0.12, 1.3], [0, 1.05, 0], canopy);
  for (const sx of [-0.78, 0.78]) {
    box(group, [0.08, 1.85, 0.08], [sx, 0.94, -0.48], dark);
    box(group, [0.08, 1.85, 0.08], [sx, 0.94, 0.48], dark);
  }
  box(group, [1.55, 0.34, 0.06], [0, 1.38, 0.57], canopy);
  // Simple colourful produce crates make the market readable at phone resolution.
  for (let i = 0; i < 3; i += 1) {
    const produce = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 6, 5),
      new THREE.MeshStandardMaterial({ color: [0xc85b36, 0xd7a63d, 0x5f934b][i], roughness: 1 })
    );
    produce.position.set(-0.45 + i * 0.42, 1.02, 0.12);
    group.add(produce);
  }
  scene.add(group);
  // Keep stalls on the pavement edge; their small footprint is solid.
  colliders.push({
    minX: x - 0.92, maxX: x + 0.92,
    minZ: z - 0.66, maxZ: z + 0.66,
    minY: 0, maxY: 1.9
  });
  const signMesh = box(group, [1.25, 0.25, 0.05], [0, 1.62, 0.62],
    new THREE.MeshStandardMaterial({ color: 0x253c48, roughness: 0.9 }));
  signMesh.userData.label = sign;
}

function makePublicBuilding(scene, x, z, title, wallColor, colliders, isClinic = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wall = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x303943, roughness: 1 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xe0d2b4, roughness: 0.9 });
  box(group, [4.5, 2.7, 4.2], [0, 1.35, 0], wall);
  box(group, [4.8, 0.22, 4.5], [0, 2.81, 0], roof);
  box(group, [1.1, 1.15, 0.08], [-1.25, 1.55, 2.14], trim);
  box(group, [1.1, 1.15, 0.08], [1.25, 1.55, 2.14], trim);
  box(group, [0.95, 1.95, 0.12], [0, 0.98, 2.15], roof);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 96;
  const context = signCanvas.getContext('2d');
  context.fillStyle = isClinic ? '#2f7768' : '#284e68';
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.fillStyle = '#ffffff';
  context.font = 'bold 38px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(title, 256, 48, 490);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.9 });
  box(group, [2.6, 0.45, 0.12], [0, 2.25, 2.2], sign);
  if (isClinic) {
    box(group, [0.65, 0.12, 0.16], [0, 2.25, 2.31], trim);
    box(group, [0.12, 0.65, 0.16], [0, 2.25, 2.31], trim);
  }
  scene.add(group);
  colliders.push({
    minX: x - 2.4, maxX: x + 2.4,
    minZ: z - 2.35, maxZ: z + 2.35,
    minY: 0, maxY: 3.1
  });
}

export function createOriyabaExpansion(scene) {
  const colliders = [];
  const pedestrians = [];
  const routeA = [{ x: -4.7, z: 16 }, { x: 4.7, z: 16 }, { x: 4.7, z: 21 }, { x: -4.7, z: 21 }];
  const routeB = [{ x: -4.5, z: -17 }, { x: 4.5, z: -17 }, { x: 4.5, z: -12 }, { x: -4.5, z: -12 }];
  const routeC = [{ x: -4.4, z: 28 }, { x: 4.4, z: 28 }, { x: 4.4, z: 32 }, { x: -4.4, z: 32 }];

  // Small market row along the eastern pavement, away from the opening mission route.
  makeShopStall(scene, 8.55, 16.0, 0x9a553e, 'FRUITS', colliders);
  makeShopStall(scene, 8.55, 19.0, 0x3d7771, 'PROVISIONS', colliders);
  makeShopStall(scene, 8.55, 22.0, 0x9b7940, 'SNACKS', colliders);

  // Public-service buildings occupy the open eastern plots, not the mansion estate.
  makePublicBuilding(scene, 21.0, -3.0, 'POLICE OUTPOST', 0x71808a, colliders, false);
  makePublicBuilding(scene, 21.0, 39.0, 'COMMUNITY CLINIC', 0xb6b8a9, colliders, true);

  // Everyday compound details: water drums, laundry lines and benches.
  const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x315d78, roughness: 0.82 });
  const drumLid = new THREE.MeshStandardMaterial({ color: 0x252d35, roughness: 0.9 });
  for (const [x, z] of [[-5.7, 11], [-5.7, 25], [5.7, -23]]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.9, 9), drumMaterial);
    drum.position.set(x, 0.47, z);
    scene.add(drum);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 9), drumLid);
    lid.position.set(x, 0.95, z);
    scene.add(lid);
  }
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x684a34, roughness: 1 });
  for (const [x, z] of [[-5.2, 6], [5.2, -7], [-5.2, 34]]) {
    const bench = new THREE.Group();
    box(bench, [1.35, 0.12, 0.42], [0, 0.55, 0], benchMaterial);
    for (const sx of [-0.5, 0.5]) box(bench, [0.1, 0.55, 0.1], [sx, 0.28, 0], benchMaterial);
    bench.position.set(x, 0, z);
    scene.add(bench);
  }

  const people = [
    [-4.6, 17.2, 0x9a6748, routeA],
    [4.6, 19.6, 0x3f6e75, routeA],
    [-4.5, -15.4, 0x8b784e, routeB],
    [4.5, -13.2, 0x714b69, routeB],
    [-4.4, 29.5, 0x456b4e, routeC],
    [4.4, 30.5, 0x8a5c3e, routeC]
  ];
  for (const [x, z, shirt, route] of people) {
    pedestrians.push(makePedestrian(scene, x, z, shirt, route));
  }
  // Children playing near the residential end of the street.
  pedestrians.push(makePedestrian(scene, -3.5, 30.2, 0xc18a36, routeC, 0.72));
  pedestrians.push(makePedestrian(scene, 3.5, 29.0, 0x477b8b, routeC, 0.72));
  // Visible public-service staff make both neighbourhood facilities feel occupied.
  pedestrians.push(makePedestrian(scene, 20.0, 0.05, 0x284d70,
    [{ x: 19.0, z: 0.05 }, { x: 23.0, z: 0.05 }]));
  pedestrians.push(makePedestrian(scene, 20.0, 42.0, 0x477b70,
    [{ x: 19.0, z: 42.0 }, { x: 23.0, z: 42.0 }]));

  function update(delta, playerPosition) {
    for (const pedestrian of pedestrians) {
      const person = pedestrian.group;
      if (pedestrian.pause > 0) {
        pedestrian.pause = Math.max(0, pedestrian.pause - delta);
        pedestrian.legs.forEach((leg) => { leg.rotation.x *= 0.85; });
        pedestrian.arms.forEach((arm) => { arm.rotation.x *= 0.85; });
        continue;
      }
      const destination = pedestrian.route[pedestrian.routeIndex];
      const dx = destination.x - person.position.x;
      const dz = destination.z - person.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.18) {
        pedestrian.routeIndex = (pedestrian.routeIndex + 1) % pedestrian.route.length;
        pedestrian.pause = 0.4 + (pedestrian.routeIndex % 2) * 0.45;
        continue;
      }
      const speed = 0.62;
      const step = Math.min(distance, speed * delta);
      person.position.x += (dx / distance) * step;
      person.position.z += (dz / distance) * step;
      person.rotation.y = Math.atan2(dx, dz);
      pedestrian.walkTime += delta * 6.5;
      const stride = Math.sin(pedestrian.walkTime) * 0.32;
      pedestrian.legs[0].rotation.x = stride;
      pedestrian.legs[1].rotation.x = -stride;
      pedestrian.arms[0].rotation.x = -stride * 0.7;
      pedestrian.arms[1].rotation.x = stride * 0.7;
      if (playerPosition && Math.hypot(playerPosition.x - person.position.x, playerPosition.z - person.position.z) < 4.5) {
        // Briefly acknowledge the player without interrupting their route.
        person.rotation.y = THREE.MathUtils.damp(
          person.rotation.y,
          Math.atan2(playerPosition.x - person.position.x, playerPosition.z - person.position.z),
          0.8,
          delta
        );
      }
    }
  }

  return { colliders, actors: pedestrians.map((person) => person.group), update };
}
