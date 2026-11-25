import * as THREE from 'three';

const mat = (color, roughness = 0.86, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(parent, geometry, material, position, rotation = null) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  if (rotation) item.rotation.set(...rotation);
  parent.add(item);
  return item;
}

function createCharacter(config) {
  const { id, name, description, skinColor, shirtColor, jacketColor, trouserColor, hairColor, accentColor, female = false } = config;
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const skin = mat(skinColor, 0.9);
  const shirt = mat(shirtColor);
  const jacket = mat(jacketColor, 0.9);
  const trim = mat(accentColor, 0.72, 0.08);
  const trousers = mat(trouserColor, 0.95);
  const hair = mat(hairColor, 1);
  const shoes = mat(0x171b22, 0.72);
  const sole = mat(0x080a0e, 0.92);
  const whites = mat(0xf3e9d8, 0.72);
  const eyes = mat(0x171313, 0.55);
  const lips = mat(0x49251f, 0.9);

  // Layered shirt, open jacket, lapels and pockets.
  mesh(body, new THREE.CapsuleGeometry(0.37, 0.62, 3, 9), shirt, [0, 1.31, 0]);
  mesh(body, new THREE.BoxGeometry(0.36, 0.70, 0.15), jacket, [-0.205, 1.31, 0.205]);
  mesh(body, new THREE.BoxGeometry(0.36, 0.70, 0.15), jacket, [0.205, 1.31, 0.205]);
  mesh(body, new THREE.BoxGeometry(0.035, 0.56, 0.018), trim, [0, 1.29, 0.29]);
  mesh(body, new THREE.BoxGeometry(0.18, 0.16, 0.07), shirt, [-0.105, 1.68, 0.23], [0, 0, -0.28]);
  mesh(body, new THREE.BoxGeometry(0.18, 0.16, 0.07), shirt, [0.105, 1.68, 0.23], [0, 0, 0.28]);
  for (const side of [-1, 1]) {
    mesh(body, new THREE.BoxGeometry(0.18, 0.13, 0.025), trim, [side * 0.23, 1.20, 0.292]);
    mesh(body, new THREE.BoxGeometry(0.10, 0.018, 0.02), trim, [side * 0.23, 1.25, 0.31]);
  }
  mesh(body, new THREE.BoxGeometry(0.58, 0.075, 0.39), trousers, [0, 0.91, 0]);
  mesh(body, new THREE.BoxGeometry(0.11, 0.085, 0.025), trim, [0, 0.91, 0.205]);
  mesh(body, new THREE.CylinderGeometry(0.105, 0.12, 0.20, 8), skin, [0, 1.79, 0.01]);

  // Face with visible eyes, brows, nose and mouth.
  const head = new THREE.Group();
  head.position.set(0, 1.86, 0.015);
  body.add(head);
  mesh(head, new THREE.SphereGeometry(0.285, 14, 12), skin, [0, 0.22, 0.015]);
  for (const side of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(0.062, 8, 7), skin, [side * 0.282, 0.22, 0]);
    mesh(head, new THREE.SphereGeometry(0.041, 8, 6), whites, [side * 0.105, 0.245, 0.270]);
    mesh(head, new THREE.SphereGeometry(0.022, 7, 6), eyes, [side * 0.105, 0.245, 0.305]);
    mesh(head, new THREE.BoxGeometry(0.105, 0.025, 0.025), hair, [side * 0.105, 0.315, 0.273], [0, 0, side * -0.08]);
  }
  mesh(head, new THREE.SphereGeometry(0.045, 8, 7), skin, [0, 0.17, 0.292]);
  mesh(head, new THREE.BoxGeometry(0.105, 0.018, 0.018), lips, [0, 0.075, 0.278]);

  if (female) {
    // Rounded braided crown with two hanging side braids.
    mesh(head, new THREE.SphereGeometry(0.302, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, [0, 0.32, -0.018]);
    mesh(head, new THREE.TorusGeometry(0.205, 0.055, 6, 14, Math.PI), hair, [0, 0.39, -0.005], [Math.PI / 2, 0, Math.PI]);
    for (const side of [-1, 1]) {
      const braid = new THREE.Group();
      braid.position.set(side * 0.245, 0.10, -0.025);
      braid.rotation.z = side * -0.10;
      head.add(braid);
      for (let i = 0; i < 4; i += 1) mesh(braid, new THREE.SphereGeometry(0.064, 7, 6), hair, [0, -i * 0.115, 0]);
      mesh(braid, new THREE.SphereGeometry(0.055, 7, 6), trim, [0, -0.49, 0]);
    }
  } else {
    // Close fade and short textured top.
    mesh(head, new THREE.SphereGeometry(0.298, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.49), hair, [0, 0.34, -0.012]);
    mesh(head, new THREE.BoxGeometry(0.32, 0.075, 0.22), hair, [0, 0.49, 0.035]);
    mesh(head, new THREE.BoxGeometry(0.42, 0.055, 0.08), hair, [0, 0.29, 0.22]);
  }

  // Limbs rotate from their actual shoulder and hip joints.
  function makeLeg(x) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.88, 0);
    body.add(pivot);
    mesh(pivot, new THREE.CapsuleGeometry(0.145, 0.47, 2, 7), trousers, [0, -0.30, 0]);
    mesh(pivot, new THREE.CapsuleGeometry(0.115, 0.28, 2, 7), trousers, [0, -0.68, 0.005]);
    mesh(pivot, new THREE.BoxGeometry(0.30, 0.12, 0.43), shoes, [0, -0.84, 0.075]);
    mesh(pivot, new THREE.BoxGeometry(0.305, 0.035, 0.435), sole, [0, -0.91, 0.075]);
    return pivot;
  }
  function makeArm(x, side) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.59, 0);
    pivot.rotation.z = side * 0.10;
    body.add(pivot);
    mesh(pivot, new THREE.CapsuleGeometry(0.105, 0.43, 2, 7), jacket, [0, -0.27, 0]);
    mesh(pivot, new THREE.CapsuleGeometry(0.095, 0.12, 2, 7), skin, [0, -0.57, 0.015]);
    mesh(pivot, new THREE.BoxGeometry(0.22, 0.10, 0.13), trim, [0, -0.07, 0.015]);
    return pivot;
  }

  const leftLeg = makeLeg(-0.19);
  const rightLeg = makeLeg(0.19);
  const leftArm = makeArm(-0.43, -1);
  const rightArm = makeArm(0.43, 1);
  // Keep the playable model close to real human scale (about 1.8 m tall).
  group.position.set(0, 0, 3);
  group.scale.setScalar(0.71);
  group.userData.collisionRadius = 0.4;
  group.userData.collisionHeight = 1.9;
  group.visible = false;


  // Lightweight appearance options are built once and toggled without replacing
  // the character rig, keeping customisation inexpensive on mobile devices.
  const hairstyleOptions = {};
  const afroStyle = new THREE.Group();
  mesh(afroStyle, new THREE.SphereGeometry(0.34, 10, 8), hair, [0, 0.37, -0.01]);
  mesh(afroStyle, new THREE.SphereGeometry(0.25, 9, 7), hair, [0, 0.48, 0.02]);
  hairstyleOptions.afro = afroStyle;
  head.add(afroStyle);
  const twistsStyle = new THREE.Group();
  for (let side = -1; side <= 1; side += 1) {
    mesh(twistsStyle, new THREE.CapsuleGeometry(0.055, 0.22, 2, 6), hair, [side * 0.15, 0.43, 0.02], [0, 0, side * 0.16]);
  }
  hairstyleOptions.twists = twistsStyle;
  head.add(twistsStyle);
  const braidsStyle = new THREE.Group();
  for (const side of [-1, 1]) {
    const braid = new THREE.Group();
    braid.position.set(side * 0.24, 0.12, -0.01);
    for (let i = 0; i < 5; i += 1) {
      mesh(braid, new THREE.SphereGeometry(0.055, 6, 5), hair, [0, -i * 0.095, 0]);
    }
    braidsStyle.add(braid);
  }
  hairstyleOptions.braids = braidsStyle;
  head.add(braidsStyle);
  const accessories = new THREE.Group();
  body.add(accessories);
  const accessoryOptions = {};
  const chainOption = new THREE.Group();
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 5, 18), trim);
  chain.rotation.x = Math.PI / 2;
  chain.position.set(0, 1.53, 0.29);
  chainOption.add(chain);
  accessoryOptions.chain = chainOption;
  accessories.add(chainOption);
  const capOption = new THREE.Group();
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
  capCrown.position.set(0, 2.39, 0.01);
  capOption.add(capCrown);
  const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.045, 12), hair);
  capBrim.position.set(0, 2.34, 0.06);
  capOption.add(capBrim);
  accessoryOptions.cap = capOption;
  accessories.add(capOption);
  const glassesOption = new THREE.Group();
  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 4, 12), trim);
    lens.position.set(side * 0.105, 2.105, 0.295);
    glassesOption.add(lens);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.018), trim);
  bridge.position.set(0, 2.105, 0.295);
  glassesOption.add(bridge);
  accessoryOptions.glasses = glassesOption;
  accessories.add(glassesOption);
  const watchOption = new THREE.Group();
  const watch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.08), trim);
  watch.position.set(-0.47, 1.04, 0.05);
  watchOption.add(watch);
  accessoryOptions.watch = watchOption;
  accessories.add(watchOption);
  const outfitPalettes = {
    street: [shirtColor, jacketColor, trouserColor],
    smart: [0xf0e6d2, 0x263b50, 0x202a39],
    native: [0xc98c3f, 0x8a4a2e, 0x352d27],
    casual: [0x397b86, 0x397b86, 0x263142],
    dark: [0x292d35, 0x171c25, 0x171c25]
  };
  const shoePalettes = { black: 0x171b22, brown: 0x68432c, white: 0xe7e3da, red: 0x8e3434, blue: 0x315b88 };
  const hairPalettes = { black: 0x171717, brown: 0x4b2e22, auburn: 0x713b2d, grey: 0x77736d };
  const appearance = { hairstyle: 'natural', outfit: 'street', shoes: 'black', hair: 'black', accessory: 'none' };
  function applyCustomization(next = {}) {
    Object.assign(appearance, next);
    const palette = outfitPalettes[appearance.outfit] || outfitPalettes.street;
    shirt.color.setHex(palette[0]);
    jacket.color.setHex(palette[1]);
    trousers.color.setHex(palette[2]);
    shoes.color.setHex(shoePalettes[appearance.shoes] || shoePalettes.black);
    hair.color.setHex(hairPalettes[appearance.hair] || hairPalettes.black);
    Object.entries(hairstyleOptions).forEach(([key, option]) => { option.visible = appearance.hairstyle === key; });
    Object.entries(accessoryOptions).forEach(([key, option]) => { option.visible = appearance.accessory === key; });
    return { ...appearance };
  }
  applyCustomization();

  return { id, name, age: 18, description, group, body, head, leftLeg, rightLeg, leftArm, rightArm, walkTime: 0, applyCustomization, appearance };
}

export function createProtagonists(scene) {
  const protagonists = [
    createCharacter({
      id: 'male', name: 'MALE PROTAGONIST',
      description: '18 YEARS OLD  ·  THE DEFAULT HERO',
      skinColor: 0x895438, shirtColor: 0xc18a42, jacketColor: 0x34485a,
      trouserColor: 0x202a39, hairColor: 0x171717, accentColor: 0xd6a75e
    }),
    createCharacter({
      id: 'female', name: 'FEMALE PROTAGONIST',
      description: '18 YEARS OLD  ·  A SECOND PATH, THE SAME STORY',
      skinColor: 0x75452f, shirtColor: 0xd0a06a, jacketColor: 0x6b3f50,
      trouserColor: 0x263142, hairColor: 0x171313, accentColor: 0xd6a75e,
      female: true
    })
  ];
  protagonists.forEach((character) => scene.add(character.group));
  return protagonists;
}
