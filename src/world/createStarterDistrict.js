import * as THREE from 'three';

const shared = {
  windowGeometry: new THREE.BoxGeometry(0.72, 0.92, 0.08),
  windowMaterial: new THREE.MeshStandardMaterial({
    color: 0xffc978,
    emissive: 0x9a571d,
    emissiveIntensity: 0.8,
    roughness: 0.55
  })
};

function addBox(parent, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

function addBuilding(scene, x, z, width, depth, height, color, seed, colliders) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  colliders.push({
    minX: x - width / 2 - 0.12, maxX: x + width / 2 + 0.12,
    minZ: z - depth / 2 - 0.12, maxZ: z + depth / 2 + 0.12,
    minY: 0, maxY: height + 0.3
  });

  const wallMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.02
  });

  addBox(group, [width, height, depth], [0, height / 2, 0], wallMaterial);

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x343943,
    roughness: 0.95
  });
  addBox(group, [width + 0.35, 0.28, depth + 0.35], [0, height + 0.14, 0], roofMaterial);

  const columns = Math.max(2, Math.floor(width / 2.1));
  const rows = Math.max(1, Math.floor((height - 1.8) / 2.15));
  const windowCount = columns * rows;
  const windows = new THREE.InstancedMesh(
    shared.windowGeometry,
    shared.windowMaterial,
    windowCount
  );
  const transform = new THREE.Object3D();
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      transform.position.set(
        -width / 2 + ((column + 1) * width) / (columns + 1),
        1.25 + row * 2.05,
        depth / 2 + 0.045
      );
      transform.scale.setScalar(0.82 + ((seed + row + column) % 3) * 0.08);
      transform.updateMatrix();
      windows.setMatrixAt(index, transform.matrix);
      index += 1;
    }
  }

  windows.instanceMatrix.needsUpdate = true;
  group.add(windows);
  return group;
}

function addStreetlight(scene, x, z, colliders) {
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x252c35,
    metalness: 0.65,
    roughness: 0.48
  });
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd99a,
    emissive: 0xffa53d,
    emissiveIntensity: 2.2
  });

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  // The pole and concrete footing are solid obstacles for the player.
  colliders.push({
    minX: x - 0.28, maxX: x + 0.28,
    minZ: z - 0.28, maxZ: z + 0.28,
    minY: 0, maxY: 5.6
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.16, 8),
    poleMaterial
  );
  base.position.y = 0.08;
  group.add(base);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.12, 5.5, 6),
    poleMaterial
  );
  pole.position.y = 2.75;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.09, 0.09),
    poleMaterial
  );
  arm.position.set(0.45, 5.35, 0);
  group.add(arm);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 6),
    lampMaterial
  );
  bulb.position.set(0.95, 5.25, 0);
  group.add(bulb);
}

export function createStarterDistrict(scene) {
  const colliders = [];
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 110),
    new THREE.MeshStandardMaterial({ color: 0x343b38, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x20252b,
    roughness: 0.96
  });
  addBox(scene, [13, 0.08, 92], [0, 0, 0], roadMaterial);

  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x77756d,
    roughness: 1
  });
  addBox(scene, [3.2, 0.22, 92], [-8.1, 0.02, 0], sidewalkMaterial);
  addBox(scene, [3.2, 0.22, 92], [8.1, 0.02, 0], sidewalkMaterial);

  // Selected residential access points get patterned stone paving while the
  // main carriageway remains asphalt. The lightweight canvas texture avoids
  // hundreds of individual tile meshes on lower-powered Android devices.
  const pavingCanvas = document.createElement('canvas');
  pavingCanvas.width = 256;
  pavingCanvas.height = 256;
  const pavingContext = pavingCanvas.getContext('2d');
  pavingContext.fillStyle = '#a79f8e';
  pavingContext.fillRect(0, 0, 256, 256);
  const pavingTones = ['#c0b7a5', '#b5ac9a', '#aaa18f', '#c8beaa'];
  const tileSize = 62;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      pavingContext.fillStyle = pavingTones[(row * 3 + column) % pavingTones.length];
      pavingContext.fillRect(column * 64 + 2, row * 64 + 2, tileSize, tileSize);
    }
  }
  const pavingTexture = new THREE.CanvasTexture(pavingCanvas);
  pavingTexture.colorSpace = THREE.SRGBColorSpace;
  pavingTexture.anisotropy = 1;
  const pavingMaterial = new THREE.MeshStandardMaterial({
    map: pavingTexture,
    color: 0xffffff,
    roughness: 1
  });
  // These short paved aprons lead from the roadside pavement towards selected
  // residential plots; other plots keep their plain concrete/earth frontage.
  for (const [side, z] of [[-1, -23], [-1, 11], [-1, 35], [1, -26], [1, 20], [1, 32]]) {
    const accessPath = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.35), pavingMaterial);
    accessPath.rotation.x = -Math.PI / 2;
    accessPath.position.set(side * 8.05, 0.145, z);
    scene.add(accessPath);
  }

  const markingMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9cda7,
    roughness: 1
  });
  for (let z = -40; z <= 40; z += 10) {
    addBox(scene, [0.22, 0.025, 4.2], [0, 0.055, z], markingMaterial);
  }

  const buildingPalette = [0x71665b, 0x625f58, 0x756b60, 0x555b60, 0x82735f];
  const positions = [-35, -23, -11, 11, 23, 35];

  positions.forEach((z, index) => {
    const height = 7 + ((index * 7) % 3) * 2.2;
    addBuilding(
      scene,
      -13.2 - (index % 2) * 1.5,
      z,
      8 + (index % 3),
      8,
      height,
      buildingPalette[index % buildingPalette.length],
      index,
      colliders
    );
    // The first right-side plot is reserved for the guarded mansion
    // used by the opening delivery mission.
    if (index !== 0) {
      addBuilding(
        scene,
        13.2 + (index % 2) * 1.5,
        z - 3,
        8 + ((index + 1) % 3),
        8,
        height + ((index % 2) * 2),
        buildingPalette[(index + 2) % buildingPalette.length],
        index + 3,
        colliders
      );
    }
  });

  [-29, -9, 11, 31].forEach((z) => {
    addStreetlight(scene, -7.1, z, colliders);
    addStreetlight(scene, 7.1, z - 5, colliders);
  });

  const distantMaterial = new THREE.MeshStandardMaterial({
    color: 0x303947,
    roughness: 1
  });
  for (let index = 0; index < 12; index += 1) {
    const width = 5 + (index % 3) * 2;
    const height = 9 + ((index * 5) % 5) * 3;
    const x = index % 2 === 0 ? -43 - (index % 4) : 43 + (index % 4);
    const z = -42 + index * 7;
    addBox(scene, [width, height, 7], [x, height / 2, z], distantMaterial);
    colliders.push({
      minX: x - width / 2, maxX: x + width / 2,
      minZ: z - 3.5, maxZ: z + 3.5,
      minY: 0, maxY: height
    });
  }

  // A small roadside kiosk gives the first district a recognisable local detail.
  const kiosk = new THREE.Group();
  kiosk.position.set(10.5, 0, 1);
  scene.add(kiosk);
  colliders.push({ minX: 8.6, maxX: 12.4, minZ: -0.4, maxZ: 2.4, minY: 0, maxY: 2.7 });
  addBox(kiosk, [3.8, 2.5, 2.8], [0, 1.25, 0], new THREE.MeshStandardMaterial({
    color: 0x9b6845,
    roughness: 0.95
  }));
  addBox(kiosk, [4.2, 0.18, 3.2], [0, 2.58, 0], new THREE.MeshStandardMaterial({
    color: 0x263d4b,
    roughness: 0.8
  }));

  return colliders;
}
