import * as THREE from 'three';

function material(color, roughness = 0.86, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(group, geometry, surface, position, rotation = null) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  group.add(mesh);
  return mesh;
}

function createCharacter({ id, name, description, skinColor, shirtColor, jacketColor, trouserColor, hairColor, female = false }) {
  const group = new THREE.Group();
  const skin = material(skinColor, 0.9);
  const shirt = material(shirtColor, 0.88);
  const jacket = material(jacketColor, 0.9);
  const trousers = material(trouserColor, 0.95);
  const hair = material(hairColor, 1);
  const shoes = material(0x171b22, 0.75);
  const accent = material(0xd6a75e, 0.65, 0.18);

  // Torso and layered clothing.
  addMesh(group, new THREE.CapsuleGeometry(0.39, 0.66, 3, 8), shirt, [0, 1.2, 0]);
  addMesh(group, new THREE.BoxGeometry(0.82, 0.72, 0.12), jacket, [0, 1.24, 0.22]);
  addMesh(group, new THREE.BoxGeometry(0.08, 0.62, 0.025), accent, [0, 1.23, 0.29]);

  // Head, ears and facial details.
  addMesh(group, new THREE.SphereGeometry(0.29, 12, 10), skin, [0, 2.02, 0.015]);
  addMesh(group, new THREE.SphereGeometry(0.065, 8, 6), skin, [-0.29, 2.02, 0]);
  addMesh(group, new THREE.SphereGeometry(0.065, 8, 6), skin, [0.29, 2.02, 0]);
  const eyeMaterial = material(0x171719, 0.55);
  addMesh(group, new THREE.SphereGeometry(0.026, 6, 5), eyeMaterial, [-0.105, 2.06, 0.277]);
  addMesh(group, new THREE.SphereGeometry(0.026, 6, 5), eyeMaterial, [0.105, 2.06, 0.277]);

  if (female) {
    // Braided crown and two compact braid shapes give the female lead a distinct silhouette.
    addMesh(group, new THREE.SphereGeometry(0.305, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, [0, 2.09, -0.015]);
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.CapsuleGeometry(0.055, 0.48, 2, 6), hair, [side * 0.255, 1.84, -0.015], [0, 0, side * -0.12]);
      addMesh(group, new THREE.SphereGeometry(0.07, 8, 6), accent, [side * 0.255, 1.55, -0.015]);
    }
  } else {
    // Short textured fade with a slightly raised top.
    addMesh(group, new THREE.SphereGeometry(0.30, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, [0, 2.12, -0.01]);
    addMesh(group, new THREE.BoxGeometry(0.36, 0.08, 0.24), hair, [0, 2.29, 0.015]);
  }

  const leftLeg = addMesh(group, new THREE.CapsuleGeometry(0.145, 0.48, 2, 6), trousers, [-0.19, 0.43, 0]);
  const rightLeg = addMesh(group, new THREE.CapsuleGeometry(0.145, 0.48, 2, 6), trousers, [0.19, 0.43, 0]);
  addMesh(group, new THREE.BoxGeometry(0.32, 0.13, 0.48), shoes, [-0.19, 0.12, 0.07]);
  addMesh(group, new THREE.BoxGeometry(0.32, 0.13, 0.48), shoes, [0.19, 0.12, 0.07]);

  const leftArm = addMesh(group, new THREE.CapsuleGeometry(0.105, 0.48, 2, 6), jacket, [-0.49, 1.2, 0], [0, 0, -0.14]);
  const rightArm = addMesh(group, new THREE.CapsuleGeometry(0.105, 0.48, 2, 6), jacket, [0.49, 1.2, 0], [0, 0, 0.14]);
  addMesh(group, new THREE.SphereGeometry(0.11, 8, 6), skin, [-0.5, 0.87, 0]);
  addMesh(group, new THREE.SphereGeometry(0.11, 8, 6), skin, [0.5, 0.87, 0]);

  group.position.set(0, 0, 3);
  group.visible = false;

  return {
    id,
    name,
    age: 18,
    description,
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    walkTime: 0
  };
}

export function createProtagonists(scene) {
  const protagonists = [
    createCharacter({
      id: 'male',
      name: 'MALE PROTAGONIST',
      description: '18 YEARS OLD  ·  THE DEFAULT HERO',
      skinColor: 0x895438,
      shirtColor: 0xc18a42,
      jacketColor: 0x34485a,
      trouserColor: 0x202a39,
      hairColor: 0x171717
    }),
    createCharacter({
      id: 'female',
      name: 'FEMALE PROTAGONIST',
      description: '18 YEARS OLD  ·  A SECOND PATH, THE SAME STORY',
      skinColor: 0x75452f,
      shirtColor: 0xd0a06a,
      jacketColor: 0x6b3f50,
      trouserColor: 0x263142,
      hairColor: 0x171313,
      female: true
    })
  ];

  protagonists.forEach((character) => scene.add(character.group));
  return protagonists;
}
