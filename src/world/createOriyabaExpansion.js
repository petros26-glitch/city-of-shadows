import * as THREE from 'three';

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function makePedestrian(scene, x, z, shirtColor, route, scale = 1, role = 'resident') {
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
  group.userData.collisionRadius = 0.43 * scale;
  group.userData.collisionHeight = 1.9 * scale;
  scene.add(group);
  const labels = {
    resident: 'ORIYABA RESIDENT',
    child: 'LOCAL CHILD',
    vendor: 'MARKET VENDOR',
    style: 'STYLE ADVISOR',
    police: 'POLICE OFFICER',
    clinic: 'CLINIC WORKER',
    barber: 'BARBER'
  };
  return { group, legs, arms, route, role, label: labels[role] || labels.resident, routeIndex: 1, walkTime: 1.7, pause: 0.8 };
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
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 96;
  const signContext = signCanvas.getContext('2d');
  signContext.fillStyle = '#253c48';
  signContext.fillRect(0, 0, signCanvas.width, signCanvas.height);
  signContext.fillStyle = '#ffffff';
  signContext.font = 'bold 38px Arial';
  signContext.textAlign = 'center';
  signContext.textBaseline = 'middle';
  signContext.fillText(sign, 256, 48, 490);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signMaterial = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.9 });
  box(group, [1.25, 0.25, 0.05], [0, 1.62, 0.62], signMaterial);
}

function makePublicBuilding(scene, x, z, title, wallColor, colliders, isClinic = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wall = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x303943, roughness: 1 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xe0d2b4, roughness: 0.9 });
  const interiorFloor = new THREE.MeshStandardMaterial({ color: 0xb8ad98, roughness: 1 });

  if (isClinic) {
    // Small walk-in clinic: open front doorway, walkable floor and solid side/back walls.
    box(group, [4.5, 0.16, 4.2], [0, -0.08, 0], interiorFloor);
    box(group, [4.8, 0.22, 4.5], [0, 2.81, 0], roof);
    const wallY = 1.35;
    const wallHeight = 2.7;
    const wallDepth = 0.18;
    box(group, [4.5, wallHeight, wallDepth], [0, wallY, -2.01], wall);
    box(group, [wallDepth, wallHeight, 4.2], [-2.16, wallY, 0], wall);
    box(group, [wallDepth, wallHeight, 4.2], [2.16, wallY, 0], wall);
    box(group, [1.55, wallHeight, wallDepth], [-1.475, wallY, 2.01], wall);
    box(group, [1.55, wallHeight, wallDepth], [1.475, wallY, 2.01], wall);
    box(group, [1.4, 0.22, wallDepth], [0, 2.59, 2.01], wall);
    // Door jambs and a simple sheltered entrance.
    box(group, [0.12, 2.2, 0.2], [-0.72, 1.1, 2.04], trim);
    box(group, [0.12, 2.2, 0.2], [0.72, 1.1, 2.04], trim);
    box(group, [1.56, 0.12, 0.35], [0, 2.25, 2.18], trim);

    // Accurate wall colliders leave the central 1.44 m doorway unobstructed.
    colliders.push(
      { minX: x - 2.25, maxX: x + 2.25, minZ: z - 2.1, maxZ: z - 1.92, minY: 0, maxY: 2.7 },
      { minX: x - 2.25, maxX: x - 2.07, minZ: z - 2.1, maxZ: z + 2.1, minY: 0, maxY: 2.7 },
      { minX: x + 2.07, maxX: x + 2.25, minZ: z - 2.1, maxZ: z + 2.1, minY: 0, maxY: 2.7 },
      { minX: x - 2.25, maxX: x - 0.7, minZ: z + 1.92, maxZ: z + 2.1, minY: 0, maxY: 2.7 },
      { minX: x + 0.7, maxX: x + 2.25, minZ: z + 1.92, maxZ: z + 2.1, minY: 0, maxY: 2.7 }
    );

    // Compact reception counter and examination bed; both are solid to the player.
    box(group, [1.25, 0.82, 0.42], [-1.25, 0.58, 0.72], trim);
    colliders.push({
      minX: x - 1.88, maxX: x - 0.63,
      minZ: z + 0.48, maxZ: z + 0.96,
      minY: 0, maxY: 1.05
    });
    box(group, [1.25, 0.18, 0.62], [1.25, 0.78, -0.78], trim);
    box(group, [0.12, 0.52, 0.12], [0.75, 0.42, -0.78], roof);
    box(group, [0.12, 0.52, 0.12], [1.75, 0.42, -0.78], roof);
    colliders.push({
      minX: x + 0.6, maxX: x + 1.9,
      minZ: z - 1.12, maxZ: z - 0.44,
      minY: 0, maxY: 1.05
    });
  } else {
    box(group, [4.5, 2.7, 4.2], [0, 1.35, 0], wall);
    box(group, [4.8, 0.22, 4.5], [0, 2.81, 0], roof);
    box(group, [1.1, 1.15, 0.08], [-1.25, 1.55, 2.14], trim);
    box(group, [1.1, 1.15, 0.08], [1.25, 1.55, 2.14], trim);
    box(group, [0.95, 1.95, 0.12], [0, 0.98, 2.15], roof);
    colliders.push({
      minX: x - 2.4, maxX: x + 2.4,
      minZ: z - 2.35, maxZ: z + 2.35,
      minY: 0, maxY: 3.1
    });
  }

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
}

function makeStyleShop(scene, x, z, colliders) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wall = new THREE.MeshStandardMaterial({ color: 0xb6a58c, roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x263d4b, roughness: 0.85 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd1a45f, metalness: 0.25, roughness: 0.6 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x8e877a, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x65452f, roughness: 0.95 });
  box(group, [4.5, 0.12, 4.8], [0, 0.02, 0], floor);
  // Open-front shop: the central entrance remains wide enough for the player.
  box(group, [4.5, 2.8, 0.18], [0, 1.4, -2.31], wall);
  box(group, [0.18, 2.8, 4.8], [-2.16, 1.4, 0], wall);
  box(group, [0.18, 2.8, 4.8], [2.16, 1.4, 0], wall);
  box(group, [1.25, 2.8, 0.18], [-1.62, 1.4, 2.31], wall);
  box(group, [1.25, 2.8, 0.18], [1.62, 1.4, 2.31], wall);
  box(group, [4.75, 0.2, 0.35], [0, 2.85, 2.35], trim);
  box(group, [4.75, 0.2, 0.35], [0, 2.85, -2.35], trim);
  // Reception counter and lightweight clothing rails.
  box(group, [2.0, 0.88, 0.58], [0, 0.48, -1.25], wood);
  box(group, [2.08, 0.1, 0.64], [0, 0.96, -1.25], gold);
  for (const side of [-1, 1]) {
    box(group, [0.08, 1.55, 0.08], [side * 1.72, 1.0, -0.45], trim);
    box(group, [0.08, 0.08, 1.35], [side * 1.72, 1.72, 0.15], gold);
    for (let i = 0; i < 3; i += 1) {
      const shirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.52, 0.08),
        new THREE.MeshStandardMaterial({ color: [0x3c7180, 0xb06c43, 0x496b4c][i], roughness: 0.95 })
      );
      shirt.position.set(side * 1.72, 1.34, -0.32 + i * 0.43);
      group.add(shirt);
    }
  }
  // Storefront sign is a small canvas texture to stay crisp at mobile resolution.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.fillStyle = '#263d4b';
  context.fillRect(0, 0, 512, 96);
  context.fillStyle = '#f3dfbd';
  context.font = 'bold 36px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('ORIYABA STYLE HOUSE', 256, 48, 490);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const signMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
  box(group, [3.3, 0.52, 0.1], [0, 2.25, 2.43], signMaterial);
  scene.add(group);
  colliders.push(
    { minX: x - 2.25, maxX: x + 2.25, minZ: z - 2.4, maxZ: z - 2.22, minY: 0, maxY: 2.8 },
    { minX: x - 2.25, maxX: x - 2.07, minZ: z - 2.4, maxZ: z + 2.4, minY: 0, maxY: 2.8 },
    { minX: x + 2.07, maxX: x + 2.25, minZ: z - 2.4, maxZ: z + 2.4, minY: 0, maxY: 2.8 },
    { minX: x - 2.25, maxX: x - 0.98, minZ: z + 2.22, maxZ: z + 2.4, minY: 0, maxY: 2.8 },
    { minX: x + 0.98, maxX: x + 2.25, minZ: z + 2.22, maxZ: z + 2.4, minY: 0, maxY: 2.8 },
    { minX: x - 1.0, maxX: x + 1.0, minZ: z - 1.6, maxZ: z - 0.9, minY: 0, maxY: 1.05 }
  );
}


function makeResidentialCompound(scene, x, z, colliders) {
  const wall = new THREE.MeshStandardMaterial({ color: 0xc5b79e, roughness: 0.98 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x6c5540, roughness: 0.95 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x35434a, roughness: 0.98 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x938b7c, roughness: 1 });
  const compound = new THREE.Group();
  compound.position.set(x, 0, z);
  // A modest shared courtyard, with a wide opening facing the main street.
  box(compound, [6.2, 0.12, 5.0], [0, 0.02, 0], floor);
  box(compound, [0.18, 1.35, 5.0], [-3.0, 0.68, 0], wall);
  box(compound, [0.18, 1.35, 5.0], [3.0, 0.68, 0], wall);
  box(compound, [6.2, 1.35, 0.18], [0, 0.68, -2.4], wall);
  box(compound, [1.7, 1.35, 0.18], [-2.15, 0.68, 2.4], wall);
  box(compound, [1.7, 1.35, 0.18], [2.15, 0.68, 2.4], wall);
  for (const side of [-1, 1]) {
    box(compound, [0.22, 1.65, 0.22], [side * 2.95, 0.82, 2.38], trim);
  }

  // Small family home set behind the shared yard, with an obvious front door.
  box(compound, [3.0, 2.55, 2.35], [0, 1.28, -1.55], wall);
  box(compound, [3.25, 0.22, 2.6], [0, 2.67, -1.55], roof);
  box(compound, [0.78, 1.72, 0.09], [0, 0.88, -0.32], trim);
  for (const side of [-1, 1]) {
    box(compound, [0.58, 0.58, 0.08], [side * 0.92, 1.72, -0.32], roof);
  }
  // Water drum and a bench add familiar shared-compound details.
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.82, 9),
    new THREE.MeshStandardMaterial({ color: 0x315d78, roughness: 0.9 }));
  drum.position.set(-2.15, 0.43, -1.55);
  compound.add(drum);
  box(compound, [1.25, 0.12, 0.38], [2.0, 0.52, 1.0], trim);
  box(compound, [0.1, 0.5, 0.1], [1.55, 0.26, 1.0], trim);
  box(compound, [0.1, 0.5, 0.1], [2.45, 0.26, 1.0], trim);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 96;
  const context = signCanvas.getContext('2d');
  context.fillStyle = '#354b50';
  context.fillRect(0, 0, 512, 96);
  context.fillStyle = '#f4e7cf';
  context.font = 'bold 34px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('FAMILY COMPOUND', 256, 48, 490);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  box(compound, [3.0, 0.42, 0.12], [0, 1.82, 2.48],
    new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.95 }));
  scene.add(compound);

  colliders.push(
    { minX: x - 3.1, maxX: x - 2.9, minZ: z - 2.5, maxZ: z + 2.5, minY: 0, maxY: 1.45 },
    { minX: x + 2.9, maxX: x + 3.1, minZ: z - 2.5, maxZ: z + 2.5, minY: 0, maxY: 1.45 },
    { minX: x - 3.1, maxX: x + 3.1, minZ: z - 2.5, maxZ: z - 2.3, minY: 0, maxY: 1.45 },
    { minX: x - 3.1, maxX: x - 1.25, minZ: z + 2.3, maxZ: z + 2.5, minY: 0, maxY: 1.45 },
    { minX: x + 1.25, maxX: x + 3.1, minZ: z + 2.3, maxZ: z + 2.5, minY: 0, maxY: 1.45 },
    { minX: x - 1.55, maxX: x + 1.55, minZ: z - 2.8, maxZ: z - 0.3, minY: 0, maxY: 2.8 },
    { minX: x - 2.48, maxX: x - 1.82, minZ: z - 1.9, maxZ: z - 1.2, minY: 0, maxY: 0.95 },
    { minX: x + 1.35, maxX: x + 2.65, minZ: z + 0.78, maxZ: z + 1.22, minY: 0, maxY: 0.85 }
  );
}

function makeBarberShop(scene, x, z, colliders) {
  const shop = new THREE.Group();
  shop.position.set(x, 0, z);
  const wall = new THREE.MeshStandardMaterial({ color: 0xb5a184, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263d4b, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x694832, roughness: 1 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0x8ba5aa, metalness: 0.25, roughness: 0.28 });
  box(shop, [4.4, 0.12, 4.5], [0, 0.02, 0], wood);
  box(shop, [4.4, 2.7, 0.18], [0, 1.35, -2.16], wall);
  box(shop, [0.18, 2.7, 4.5], [-2.11, 1.35, 0], wall);
  box(shop, [0.18, 2.7, 4.5], [2.11, 1.35, 0], wall);
  box(shop, [1.25, 2.7, 0.18], [-1.57, 1.35, 2.16], wall);
  box(shop, [1.25, 2.7, 0.18], [1.57, 1.35, 2.16], wall);
  box(shop, [4.55, 0.18, 0.3], [0, 2.75, 2.2], dark);
  box(shop, [4.55, 0.18, 0.3], [0, 2.75, -2.2], dark);
  // Barber chair, mirror and a low counter are all represented in the collision map.
  box(shop, [0.78, 0.18, 0.72], [0, 0.72, -0.45], dark);
  box(shop, [0.72, 0.72, 0.18], [0, 1.12, -0.78], dark);
  box(shop, [0.12, 0.12, 0.12], [0, 0.42, -0.45], wood);
  box(shop, [1.15, 1.25, 0.08], [0, 1.65, -1.92], mirror);
  box(shop, [1.5, 0.68, 0.42], [1.25, 0.42, -1.35], wood);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#263d4b';
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#f4e7cf';
  ctx.font = 'bold 38px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORIYABA BARBER', 256, 48, 490);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  box(shop, [3.2, 0.48, 0.1], [0, 2.2, 2.28],
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }));
  scene.add(shop);
  colliders.push(
    { minX: x - 2.2, maxX: x + 2.2, minZ: z - 2.25, maxZ: z - 2.07, minY: 0, maxY: 2.7 },
    { minX: x - 2.2, maxX: x - 1.0, minZ: z - 2.25, maxZ: z + 2.25, minY: 0, maxY: 2.7 },
    { minX: x + 1.0, maxX: x + 2.2, minZ: z - 2.25, maxZ: z + 2.25, minY: 0, maxY: 2.7 },
    { minX: x - 2.2, maxX: x - 0.95, minZ: z + 2.07, maxZ: z + 2.25, minY: 0, maxY: 2.7 },
    { minX: x + 0.95, maxX: x + 2.2, minZ: z + 2.07, maxZ: z + 2.25, minY: 0, maxY: 2.7 },
    { minX: x - 0.48, maxX: x + 0.48, minZ: z - 1.0, maxZ: z - 0.05, minY: 0, maxY: 1.5 },
    { minX: x + 0.5, maxX: x + 2.0, minZ: z - 1.65, maxZ: z - 1.05, minY: 0, maxY: 1.0 }
  );
}

export function createOriyabaExpansion(scene) {
  const colliders = [];
  const pedestrians = [];
  const routeA = [{ x: -4.7, z: 16 }, { x: 4.7, z: 16 }, { x: 4.7, z: 21 }, { x: -4.7, z: 21 }];
  const routeB = [{ x: -4.5, z: -17 }, { x: 4.5, z: -17 }, { x: 4.5, z: -12 }, { x: -4.5, z: -12 }];
  const routeC = [{ x: -4.4, z: 28 }, { x: 4.4, z: 28 }, { x: 4.4, z: 32 }, { x: -4.4, z: 32 }];
  const routeD = [{ x: -3.5, z: 34.5 }, { x: 3.5, z: 34.5 }, { x: 3.5, z: 37.5 }, { x: -3.5, z: 37.5 }];

  // Small market row along the eastern pavement, away from the opening mission route.
  makeShopStall(scene, 8.55, 16.0, 0x9a553e, 'FRUITS', colliders);
  makeShopStall(scene, 8.55, 19.0, 0x3d7771, 'PROVISIONS', colliders);
  makeShopStall(scene, 8.55, 22.0, 0x9b7940, 'SNACKS', colliders);
  // One stationary trader stands in front of each stall and can be approached.
  for (const [z, shirt] of [[16.0, 0x8a4e35], [19.0, 0x3d665c], [22.0, 0x725a35]]) {
    const vendor = makePedestrian(scene, 7.0, z, shirt,
      [{ x: 7.0, z }, { x: 7.0, z }], 1, 'vendor');
    vendor.group.rotation.y = Math.PI / 2;
    pedestrians.push(vendor);
  }

  // Public-service buildings occupy the open eastern plots, not the mansion estate.
  makePublicBuilding(scene, 21.0, -3.0, 'POLICE OUTPOST', 0x71808a, colliders, false);
  makePublicBuilding(scene, 21.0, 39.0, 'COMMUNITY CLINIC', 0xb6b8a9, colliders, true);
  // A walk-in clothing and appearance shop gives Phase 2 a real in-world destination.
  makeStyleShop(scene, 20.5, 19.5, colliders);
  // One additional family courtyard and a walk-in barber complete this stretch
  // of the neighbourhood without adding expensive high-poly scenery.
  makeResidentialCompound(scene, 21.5, -21.0, colliders);
  makeBarberShop(scene, 21.1, -10.0, colliders);

  // Everyday compound details: water drums, laundry lines and benches.
  const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x315d78, roughness: 0.82 });
  const drumLid = new THREE.MeshStandardMaterial({ color: 0x252d35, roughness: 0.9 });
  for (const [x, z] of [[-7.7, 16], [-7.7, 25], [7.7, -23]]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.9, 9), drumMaterial);
    drum.position.set(x, 0.47, z);
    scene.add(drum);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 9), drumLid);
    lid.position.set(x, 0.95, z);
    scene.add(lid);
    colliders.push({
      minX: x - 0.4, maxX: x + 0.4,
      minZ: z - 0.4, maxZ: z + 0.4,
      minY: 0, maxY: 1.05
    });
  }
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x684a34, roughness: 1 });
  for (const [x, z] of [[-7.5, 6], [7.5, -7], [-7.5, 34]]) {
    const bench = new THREE.Group();
    box(bench, [1.35, 0.12, 0.42], [0, 0.55, 0], benchMaterial);
    for (const sx of [-0.5, 0.5]) box(bench, [0.1, 0.55, 0.1], [sx, 0.28, 0], benchMaterial);
    bench.position.set(x, 0, z);
    scene.add(bench);
    colliders.push({
      minX: x - 0.72, maxX: x + 0.72,
      minZ: z - 0.26, maxZ: z + 0.26,
      minY: 0, maxY: 0.85
    });
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
  pedestrians.push(makePedestrian(scene, -3.5, 35.0, 0xc18a36, routeD, 0.72, 'child'));
  pedestrians.push(makePedestrian(scene, 3.5, 36.0, 0x477b8b, routeD, 0.72, 'child'));
  // Visible public-service staff make both neighbourhood facilities feel occupied.
  pedestrians.push(makePedestrian(scene, 20.0, 0.05, 0x284d70,
    [{ x: 19.0, z: 0.05 }, { x: 23.0, z: 0.05 }], 1, 'police'));
  pedestrians.push(makePedestrian(scene, 20.0, 42.0, 0x477b70,
    [{ x: 19.0, z: 42.0 }, { x: 23.0, z: 42.0 }], 1, 'clinic'));
  pedestrians.push(makePedestrian(scene, 20.5, 19.6, 0x8b5938,
    [{ x: 20.5, z: 19.6 }, { x: 20.5, z: 19.6 }], 1, 'style'));
  pedestrians.push(makePedestrian(scene, 21.1, -8.65, 0x3e5367,
    [{ x: 21.1, z: -8.65 }, { x: 21.1, z: -8.65 }], 1, 'barber'));

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
      const nextX = person.position.x + (dx / distance) * step;
      const nextZ = person.position.z + (dz / distance) * step;
      const blockedByWorld = colliders.some((wall) => {
        if (wall.active === false || wall.maxY <= 0 || wall.minY >= 1.9) return false;
        const closestX = Math.max(wall.minX, Math.min(nextX, wall.maxX));
        const closestZ = Math.max(wall.minZ, Math.min(nextZ, wall.maxZ));
        return (nextX - closestX) ** 2 + (nextZ - closestZ) ** 2 < 0.34 ** 2;
      });
      const blockedByPlayer = playerPosition
        && Math.hypot(nextX - playerPosition.x, nextZ - playerPosition.z) < 0.82;
      const blockedByCrowd = pedestrians.some((other) => other !== pedestrian
        && Math.hypot(nextX - other.group.position.x, nextZ - other.group.position.z)
          < 0.34 + (other.group.userData.collisionRadius ?? 0.43));
      if (blockedByWorld || blockedByPlayer || blockedByCrowd) {
        pedestrian.pause = 0.18;
        pedestrian.legs.forEach((leg) => { leg.rotation.x *= 0.7; });
        pedestrian.arms.forEach((arm) => { arm.rotation.x *= 0.7; });
        continue;
      }
      person.position.x = nextX;
      person.position.z = nextZ;
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

  return { colliders, actors: pedestrians.map((person) => person.group), talkTargets: pedestrians, update };
}
