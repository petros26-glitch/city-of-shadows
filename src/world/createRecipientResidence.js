import * as THREE from 'three';

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

export function createRecipientResidence(scene) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x77766f, roughness: 0.95 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x343a42, roughness: 0.9 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xc4b79e, roughness: 0.92 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x252b35, roughness: 0.88 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb88b4d, metalness: 0.55, roughness: 0.38 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x243c50, metalness: 0.3, roughness: 0.25 });
  const lawn = new THREE.MeshStandardMaterial({ color: 0x344b37, roughness: 1 });
  const driveway = new THREE.MeshStandardMaterial({ color: 0x77746c, roughness: 1 });

  const estate = new THREE.Group();
  estate.position.set(0, 0, 0);
  scene.add(estate);

  // Walled estate grounds, set back from the road.
  box(estate, [13.5, 0.12, 22], [16.7, 0.02, -38], lawn);
  box(estate, [3.2, 0.1, 22], [10.3, 0.08, -38], driveway);
  box(estate, [0.45, 2.8, 22], [23.5, 1.4, -38], stone);
  box(estate, [13.5, 2.8, 0.45], [16.7, 1.4, -49], stone);
  box(estate, [13.5, 2.8, 0.45], [16.7, 1.4, -27], stone);
  box(estate, [0.45, 2.8, 6.5], [10, 1.4, -45.75], stone);
  box(estate, [0.45, 2.8, 5.5], [10, 1.4, -30.25], stone);

  // Tall gate pillars and two metal leaves that swing open after security clearance.
  for (const z of [-41.5, -34.5]) {
    box(estate, [0.8, 3.8, 0.8], [10, 1.9, z], darkStone);
    box(estate, [1.05, 0.25, 1.05], [10, 3.85, z], gold);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), gold);
    lamp.position.set(10, 4.1, z);
    estate.add(lamp);
  }
  const gateLeft = new THREE.Group();
  gateLeft.position.set(10, 0, -38);
  const leafA = box(gateLeft, [0.12, 2.35, 3.25], [0, 1.2, 1.63], darkStone);
  const leafB = box(gateLeft, [0.12, 2.35, 3.25], [0, 1.2, -1.63], darkStone);
  for (let i = 0; i < 6; i += 1) {
    box(gateLeft, [0.16, 2.55, 0.08], [0, 1.25, -2.8 + i * 1.12], gold);
  }
  estate.add(gateLeft);

  // Security gatehouse and canopy.
  box(estate, [2.6, 2.6, 2.3], [8.0, 1.3, -34.2], cream);
  box(estate, [2.9, 0.2, 2.6], [8.0, 2.7, -34.2], roof);
  box(estate, [0.08, 1.0, 1.0], [6.67, 1.65, -34.2], glass);

  // Main two-storey mansion exterior.
  box(estate, [9.2, 5.0, 8.4], [17.0, 2.5, -39.2], cream);
  box(estate, [9.65, 0.35, 8.85], [17.0, 5.15, -39.2], roof);
  box(estate, [1.8, 2.3, 0.12], [14.1, 1.75, -34.94], darkStone);
  box(estate, [1.4, 2.5, 0.16], [17.0, 3.25, -34.88], glass);
  box(estate, [1.4, 2.5, 0.16], [20.0, 3.25, -34.88], glass);
  box(estate, [1.4, 1.3, 0.16], [14.0, 4.0, -34.88], glass);
  box(estate, [1.4, 1.3, 0.16], [20.0, 4.0, -34.88], glass);
  box(estate, [2.2, 0.18, 1.4], [17.0, 5.2, -34.2], gold);

  // Decorative front steps and entrance columns.
  for (let i = 0; i < 4; i += 1) {
    box(estate, [3.1, 0.18, 0.42], [17.0, 0.12 + i * 0.18, -34.3 + i * 0.42], stone);
  }
  for (const x of [15.4, 18.6]) {
    box(estate, [0.28, 4.0, 0.28], [x, 2.0, -34.75], cream);
  }

  // Visible exterior staircase leading toward the upper floor.
  for (let i = 0; i < 8; i += 1) {
    box(estate, [1.15, 0.28, 0.72], [12.7 + i * 0.38, 0.18 + i * 0.28, -41.0], stone);
  }
  box(estate, [0.12, 2.5, 6.2], [11.9, 1.2, -38], darkStone);

  // Upstairs private office: an open-front playable room on a raised floor.
  const office = new THREE.Group();
  office.position.set(0, 4.25, 0);
  scene.add(office);
  box(office, [8.4, 0.25, 8.0], [17.0, 0, -39.0], cream);
  box(office, [8.4, 2.9, 0.25], [17.0, 1.45, -43.0], cream);
  box(office, [0.25, 2.9, 8.0], [12.8, 1.45, -39.0], cream);
  box(office, [0.25, 2.9, 8.0], [21.2, 1.45, -39.0], cream);
  box(office, [8.4, 0.2, 0.25], [17.0, 2.9, -35.0], roof);
  box(office, [2.8, 0.9, 1.0], [18.6, 0.65, -41.4], darkStone);
  box(office, [2.4, 0.12, 0.85], [18.6, 1.16, -41.4], gold);
  box(office, [0.12, 1.7, 2.0], [18.6, 2.05, -42.0], glass);
  box(office, [0.08, 1.0, 1.1], [14.2, 2.0, -42.82], glass);

  // Warm ceiling lights and a restrained estate entrance marker.
  const light = new THREE.PointLight(0xffc77c, 1.0, 9);
  light.position.set(17, 2.5, -38);
  office.add(light);

  return {
    gatekeeperPosition: new THREE.Vector3(8.35, 0, -34.6),
    openGate() {
      gateLeft.rotation.y = -Math.PI * 0.42;
    }
  };
}
