import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarterDistrict } from '../world/createStarterDistrict.js';
import { createOriyabaExpansion } from '../world/createOriyabaExpansion.js';
import { createProtagonists } from '../characters/createProtagonists.js';
import { createMissionManager } from '../missions/missionManager.js';
import { createRecipientResidence } from '../world/createRecipientResidence.js';
import { createCollisionWorld } from '../world/collisionWorld.js';

export function createGame(root) {
  if (!root) throw new Error('The game root element was not found.');

  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const maxPixelRatio = isTouchDevice ? 0.85 : 1.25;
  const frameInterval = isTouchDevice ? 1000 / 30 : 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d17);
  scene.fog = new THREE.Fog(0x080d17, 42, 115);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / Math.max(window.innerHeight, 1),
    0.1,
    180
  );
  camera.position.set(7, 4.5, 11);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
      stencil: false,
      depth: true
    });
  } catch (error) {
    throw new Error('WebGL is unavailable or disabled.', { cause: error });
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  renderer.domElement.className = 'game-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D view of the COS starter district');
  root.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x8297c5, 0x29251f, 1.35));
  const moonLight = new THREE.DirectionalLight(0x9bb8ed, 1.15);
  moonLight.position.set(-18, 30, 12);
  scene.add(moonLight);

  const districtColliders = createStarterDistrict(scene);
  const oriyabaExpansion = createOriyabaExpansion(scene);

  const protagonists = createProtagonists(scene);
  let selectedIndex = 0;
  let activeCharacter = protagonists[selectedIndex];
  let gameStarted = false;
  activeCharacter.group.visible = true;

  // A simple illuminated display plinth for the character preview.
  const selectionStage = new THREE.Group();
  const stageBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.8, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0x202b39, metalness: 0.55, roughness: 0.48 })
  );
  stageBase.position.y = 0.02;
  selectionStage.add(stageBase);
  const stageRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.48, 0.035, 6, 40),
    new THREE.MeshStandardMaterial({ color: 0xd6a75e, emissive: 0x8b5720, emissiveIntensity: 0.65, metalness: 0.45 })
  );
  stageRing.rotation.x = Math.PI / 2;
  stageRing.position.y = 0.13;
  selectionStage.add(stageRing);
  selectionStage.position.set(0, 0, 3);
  scene.add(selectionStage);

  // First roadside NPC: a lightweight local resident beside the kiosk.
  const npc = new THREE.Group();
  npc.position.set(7.15, 0, 1.2);
  const npcSkin = new THREE.MeshStandardMaterial({ color: 0x8a5638, roughness: 0.9 });
  const npcShirt = new THREE.MeshStandardMaterial({ color: 0x2d6470, roughness: 0.88 });
  const npcTrousers = new THREE.MeshStandardMaterial({ color: 0x252d3a, roughness: 0.95 });
  const npcHair = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1 });
  const npcBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.62, 3, 7), npcShirt);
  npcBody.position.y = 1.05;
  npc.add(npcBody);
  const npcHead = new THREE.Mesh(new THREE.SphereGeometry(0.23, 9, 7), npcSkin);
  npcHead.position.y = 1.67;
  npc.add(npcHead);
  const npcHairCap = new THREE.Mesh(new THREE.SphereGeometry(0.235, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.48), npcHair);
  npcHairCap.position.y = 1.72;
  npc.add(npcHairCap);
  const npcLegGeometry = new THREE.CylinderGeometry(0.105, 0.12, 0.62, 6);
  for (const x of [-0.13, 0.13]) {
    const leg = new THREE.Mesh(npcLegGeometry, npcTrousers);
    leg.position.set(x, 0.48, 0);
    npc.add(leg);
  }
  const npcArmGeometry = new THREE.CylinderGeometry(0.075, 0.085, 0.58, 6);
  for (const x of [-0.34, 0.34]) {
    const arm = new THREE.Mesh(npcArmGeometry, npcSkin);
    arm.position.set(x, 1.08, 0);
    arm.rotation.z = x < 0 ? -0.12 : 0.12;
    npc.add(arm);
  }
  const npcMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.035, 6, 24),
    new THREE.MeshStandardMaterial({ color: 0xd6a75e, emissive: 0x8b5720, emissiveIntensity: 0.8 })
  );
  npcMarker.rotation.x = Math.PI / 2;
  npcMarker.position.y = 0.08;
  npc.add(npcMarker);

  scene.add(npc);

  function createMissionPerson(x, z, shirtColor, role = 'street') {
    const person = new THREE.Group();
    person.position.set(x, 0, z);
    const skin = new THREE.MeshStandardMaterial({ color: role === 'older' ? 0x75462f : 0x805039, roughness: 0.92 });
    const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.9 });
    const trousers = new THREE.MeshStandardMaterial({ color: role === 'guard' ? 0x182c3a : 0x202631, roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: role === 'older' ? 0xc7a36c : 0xd6a75e, metalness: 0.12, roughness: 0.72 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.58, 3, 8), shirt);
    torso.position.y = role === 'secretary' ? 0.88 : 1.04;
    person.add(torso);
    if (role === 'older') {
      const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.18), trousers);
      jacket.position.set(0, 1.1, 0.19);
      person.add(jacket);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.48, 0.035), trim);
      tie.position.set(0, 1.23, 0.30);
      person.add(tie);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10), skin);
    head.position.y = role === 'secretary' ? 1.53 : 1.69;
    person.add(head);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 11, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
      role === 'older' ? new THREE.MeshStandardMaterial({ color: 0xaaa69a, roughness: 1 }) : dark
    );
    hair.position.y = role === 'secretary' ? 1.61 : 1.77;
    person.add(hair);
    if (role === 'secretary') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 9, 7), dark);
      bun.position.set(0, 1.62, -0.2);
      person.add(bun);
    }
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf2e8d9, roughness: 0.8 });
    const eyes = [];
    const pupils = [];
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 6), eyeWhite);
      eye.position.set(side * 0.085, role === 'secretary' ? 1.55 : 1.71, 0.214);
      person.add(eye);
      eyes.push(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 5), dark);
      pupil.position.set(side * 0.085, role === 'secretary' ? 1.55 : 1.71, 0.245);
      person.add(pupil);
      pupils.push(pupil);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 6), skin);
    nose.position.set(0, role === 'secretary' ? 1.48 : 1.64, 0.25);
    person.add(nose);
    const legGeometry = new THREE.CapsuleGeometry(0.105, 0.48, 2, 6);
    const legs = [];
    const shoes = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeometry, trousers);
      leg.position.set(side * 0.14, role === 'secretary' ? 0.38 : 0.43, role === 'secretary' ? 0.24 : 0);
      if (role === 'secretary') leg.rotation.x = Math.PI / 2;
      person.add(leg);
      legs.push(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.12, 0.34), dark);
      shoe.position.set(side * 0.14, 0.12, role === 'secretary' ? 0.58 : 0.07);
      person.add(shoe);
      shoes.push(shoe);
    }
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.34, role === 'secretary' ? 1.0 : 1.37, 0);
      if (role === 'secretary') arm.rotation.x = -Math.PI / 2;
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.42, 2, 6), role === 'older' ? trousers : shirt);
      sleeve.position.y = -0.25;
      arm.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 7, 6), skin);
      hand.position.set(0, -0.53, 0.02);
      arm.add(hand);
      person.add(arm);
      arms.push(arm);
    }
    if (role === 'guard') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.11, 10), dark);
      cap.position.set(0, 1.94, 0);
      person.add(cap);
      const capPeak = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.18), dark);
      capPeak.position.set(0, 1.91, 0.18);
      person.add(capPeak);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.025), trim);
      badge.position.set(0, 1.14, 0.31);
      person.add(badge);
    }
    if (role === 'older') {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.12, 9, 7), new THREE.MeshStandardMaterial({ color: 0x8c8981, roughness: 1 }));
      beard.scale.set(1, 0.7, 0.65);
      beard.position.set(0, 1.52, 0.22);
      person.add(beard);
    }
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 6, 20),
      new THREE.MeshStandardMaterial({ color: 0xd6a75e, emissive: 0x8b5720, emissiveIntensity: 0.75 })
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.07;
    person.add(marker);
    scene.add(person);
    return { group: person, marker, arms, legs, shoes, torso, head, hair, eyes, pupils, nose, role };
  }

  const residence = createRecipientResidence(scene);
  const gatekeeper = createMissionPerson(8.4, -37.2, 0x344d57, 'guard');
  gatekeeper.group.visible = false;
  gatekeeper.marker.visible = false;
  const recipient = createMissionPerson(16.5, -38.2, 0x4b5365, 'older');
  recipient.group.position.copy(residence.recipientPosition);
  recipient.group.visible = false;
  recipient.marker.visible = false;
  const secretary = createMissionPerson(16.5, -38.2, 0x9a8264, 'secretary');
  secretary.group.position.copy(residence.secretaryPosition);
  secretary.group.visible = false;
  secretary.marker.visible = false;
  const collisionWorld = createCollisionWorld([...districtColliders, ...oriyabaExpansion.colliders, ...residence.colliders]);
  const collisionActors = [npc, ...oriyabaExpansion.actors, gatekeeper.group, secretary.group, recipient.group];
  let nearbyExpansionNpc = null;

  const packagePickup = new THREE.Group();
  packagePickup.position.set(6.4, 0, -6.5);
  const packageBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.48, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x9a7047, roughness: 0.96 })
  );
  packageBox.position.y = 0.42;
  packagePickup.add(packageBox);
  const packageBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.5, 0.57),
    new THREE.MeshStandardMaterial({ color: 0x39312a, roughness: 1 })
  );
  packageBand.position.y = 0.42;
  packagePickup.add(packageBand);
  const packageMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.035, 6, 24),
    new THREE.MeshStandardMaterial({ color: 0xd6a75e, emissive: 0x8b5720, emissiveIntensity: 0.85 })
  );
  packageMarker.rotation.x = Math.PI / 2;
  packageMarker.position.y = 0.08;
  packagePickup.add(packageMarker);
  packagePickup.visible = false;
  scene.add(packagePickup);

  // Touch devices use a fixed-distance follow camera. A horizontal drag
  // on the open right side rotates the camera without enabling pinch zoom.
  const controls = isTouchDevice ? null : new OrbitControls(camera, renderer.domElement);
  let cameraPointerId = null;
  let lastCameraX = 0;

  function handleCameraDown(event) {
    if (!isTouchDevice || event.clientX < window.innerWidth * 0.42) return;
    cameraPointerId = event.pointerId;
    lastCameraX = event.clientX;
    renderer.domElement.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleCameraMove(event) {
    if (cameraPointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - lastCameraX;
    lastCameraX = event.clientX;
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * 0.008);
  }

  function handleCameraUp(event) {
    if (cameraPointerId !== event.pointerId) return;
    cameraPointerId = null;
  }
  const initialTarget = new THREE.Vector3(0, 1.1, 3);
  if (controls) {
    controls.target.copy(initialTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 7;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = 0.22;
    controls.rotateSpeed = 0.55;
    controls.enablePan = false;
    controls.zoomSpeed = 0.7;
    controls.update();
  } else {
    camera.lookAt(initialTarget);
  }

  const joystick = document.querySelector('#move-stick');
  const joystickBase = document.querySelector('#move-joystick');
  const jumpButton = document.querySelector('#action-jump');
  const actionButton = document.querySelector('#action-interact');
  const interactionPrompt = document.querySelector('#interaction-prompt');
  const dialoguePanel = document.querySelector('#dialogue-panel');
  const dialogueName = document.querySelector('#dialogue-name');
  const dialogueText = document.querySelector('#dialogue-text');
  const dialogueNextButton = document.querySelector('#dialogue-next');
  let dialogueLines = [];
  let dialogueIndex = 0;
  let dialogueOpen = false;
  let nearNpc = false;
  const stickState = { x: 0, y: 0, pointerId: null };
  const keys = new Set();
  const clock = new THREE.Clock();
  const cameraOffset = camera.position.clone().sub(initialTarget);
  const selectionScreen = document.querySelector('#character-select');
  const characterName = document.querySelector('#character-name');
  const characterDescription = document.querySelector('#character-description');
  const previousCharacterButton = document.querySelector('#character-previous');
  const nextCharacterButton = document.querySelector('#character-next');
  const confirmCharacterButton = document.querySelector('#character-confirm');
  const mobileControls = document.querySelector('#mobile-controls');
  const sceneHint = document.querySelector('.scene-hint');
  const locationLabel = document.querySelector('#location-label');
  const buildLabel = document.querySelector('.build-label');
  const interactionLabel = document.querySelector('#interaction-label');
  const dialogueTag = document.querySelector('.dialogue-tag');
  const missionHud = document.querySelector('#mission-hud');
  const missionTitle = document.querySelector('#mission-title');
  const missionObjective = document.querySelector('#mission-objective');
  const missionReward = document.querySelector('#mission-reward');
  const missionNotice = document.querySelector('#mission-notice');

  let nearPackage = false;
  let nearRecipient = false;
  let nearSecretary = false;
  let nearGatekeeper = false;
  let nearMansionDoor = false;
  let nearOfficeDoor = false;
  let nearExit = false;
  let nearLift = false;
  let playerFloorY = 0;
  let dialoguePurpose = null;
  let missionNoticeTimer = 0;
  let gatekeeperGestureTime = 0;
  let gatePassageDirection = null;
  let secretaryStandProgress = 1;
  let secretaryStandingUp = false;
  let secretaryWalking = false;
  let secretaryWalkTime = 0;

  function updateMissionHud(state) {
    if (missionHud) missionHud.hidden = state.status === 'inactive';
    if (missionTitle) missionTitle.textContent = state.mission;
    if (missionObjective) missionObjective.textContent = state.objective;
    if (missionReward) {
      missionReward.textContent = state.status === 'completed'
        ? 'REWARD RECEIVED · ₦500'
        : 'MISSION REWARD · ₦500';
    }
  }

  const missionManager = createMissionManager(updateMissionHud);

  function showMissionNotice(message) {
    if (!missionNotice) return;
    missionNotice.textContent = message;
    missionNotice.hidden = false;
    window.clearTimeout(missionNoticeTimer);
    missionNoticeTimer = window.setTimeout(() => {
      missionNotice.hidden = true;
    }, 2600);
  }

  function openDialogue(name, tag, lines, purpose) {
    dialogueOpen = true;
    resetStick();
    keys.clear();
    dialogueLines = lines;
    dialogueIndex = 0;
    dialoguePurpose = purpose;
    if (dialogueName) dialogueName.textContent = name;
    if (dialogueTag) dialogueTag.textContent = tag;
    if (dialogueText) dialogueText.textContent = dialogueLines[0];
    if (dialogueNextButton) dialogueNextButton.textContent = dialogueLines.length > 1 ? 'CONTINUE' : 'FINISH';
    if (dialoguePanel) dialoguePanel.hidden = false;
    if (interactionPrompt) interactionPrompt.hidden = true;
  }

  let animationFrame = 0;
  let running = false;
  let jumpVelocity = 0;
  let onGround = true;
  let walkTime = 0;
  let lastFrameTime = 0;

  function updateStick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const radius = rect.width * 0.34;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const scale = distance > radius ? radius / distance : 1;
    stickState.x = (dx * scale) / radius;
    stickState.y = (dy * scale) / radius;
    joystick.style.transform = `translate(${stickState.x * radius}px, ${stickState.y * radius}px)`;
  }

  function resetStick() {
    stickState.x = 0;
    stickState.y = 0;
    stickState.pointerId = null;
    joystick.style.transform = 'translate(0, 0)';
  }

  function handleStickDown(event) {
    event.preventDefault();
    stickState.pointerId = event.pointerId;
    joystickBase.setPointerCapture(event.pointerId);
    updateStick(event);
  }

  function handleStickMove(event) {
    if (stickState.pointerId !== event.pointerId) return;
    event.preventDefault();
    updateStick(event);
  }

  function handleStickUp(event) {
    if (stickState.pointerId !== event.pointerId) return;
    resetStick();
  }

  function jump() {
    if (!gameStarted || dialogueOpen
      || secretaryStandingUp || residence.isLiftRunning() || residence.isEnteringInterior()
      || residence.isExitingInterior() || residence.isOfficeDoorOpening() || residence.isGateOpening()
      || !onGround) return;
    jumpVelocity = 4.8;
    onGround = false;
  }

  function handleKeyDown(event) {
    if (!gameStarted) return;
    const key = event.key.toLowerCase();
    if (key === 'e') {
      event.preventDefault();
      interact();
      return;
    }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) {
      event.preventDefault();
      keys.add(key);
      if (key === ' ') jump();
    }
  }

  function handleKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  joystickBase?.addEventListener('pointerdown', handleStickDown);
  joystickBase?.addEventListener('pointermove', handleStickMove);
  joystickBase?.addEventListener('pointerup', handleStickUp);
  joystickBase?.addEventListener('pointercancel', handleStickUp);
  jumpButton?.addEventListener('pointerdown', jump);
  let actionPressTimer = 0;
  function closeDialogue() {
    const completedPurpose = dialoguePurpose;
    dialoguePurpose = null;
    dialogueOpen = false;
    if (dialoguePanel) dialoguePanel.hidden = true;
    if (interactionPrompt) interactionPrompt.hidden = true;

    if (completedPurpose === 'kola-offer') {
      packagePickup.visible = true;
      missionManager.setStage('collect-package', 'Collect the sealed package near the kiosk.');
      showMissionNotice('NEW OBJECTIVE · COLLECT THE SEALED PACKAGE');
    } else if (completedPurpose === 'gateman') {
      residence.openGate();
      gatePassageDirection = 'entry';
      gatekeeperGestureTime = 1.15;
      missionManager.setStage('enter-estate', 'Walk through the open gate, follow the driveway and enter through the mansion doorway.');
      showMissionNotice('GATE OPEN · ENTER THE ESTATE');
    } else if (completedPurpose === 'gate-access') {
      residence.openGate();
      gatekeeperGestureTime = 1.15;
      showMissionNotice(gatePassageDirection === 'exit'
        ? 'GATE OPEN · YOU MAY LEAVE THE ESTATE'
        : 'GATE OPEN · YOU MAY ENTER THE ESTATE');
    } else if (completedPurpose === 'secretary') {
      secretaryStandProgress = 0;
      secretaryStandingUp = true;
      secretaryWalking = false;
      missionManager.setStage('secretary-stand', 'The secretary stands up and prepares to show you the private office.');
      showMissionNotice('THE SECRETARY · PLEASE FOLLOW ME');
    } else if (completedPurpose === 'recipient') {
      missionManager.complete();
      showMissionNotice('MISSION COMPLETE · ₦500 RECEIVED');
    }
  }

  function interact() {
    if (!gameStarted) return;
    if (dialogueOpen) {
      dialogueIndex += 1;
      if (dialogueIndex >= dialogueLines.length) {
        closeDialogue();
        return;
      }
      if (dialogueText) dialogueText.textContent = dialogueLines[dialogueIndex];
      if (dialogueNextButton) dialogueNextButton.textContent =
        dialogueIndex === dialogueLines.length - 1 ? 'FINISH' : 'CONTINUE';
      return;
    }

    const stage = missionManager.getState().stage;
    if (stage === 'meet-kola' && nearNpc) {
      openDialogue('KOLA · KIOSK OWNER', 'LOCAL CONNECTION', [
        'Morning, my friend. You have been looking for work, abi?',
        'I know things have not been easy at home. Someone needs a package delivered, and the pay is good.',
        'Take this sealed package to an older man waiting at the other end of the district. Do not open it.',
        'Keep your eyes open on the way. I do not want trouble following you back here.'
      ], 'kola-offer');
      return;
    }

    if (stage === 'collect-package' && nearPackage) {
      packagePickup.visible = false;
      missionManager.setStage('reach-mansion', 'Take the sealed package to the large mansion at the end of the road.');
      gatekeeper.group.visible = true;
      showMissionNotice('PACKAGE COLLECTED · KEEP IT SAFE');
      return;
    }

    if (stage === 'reach-mansion' && nearGatekeeper) {
      openDialogue('GATEMAN', 'MANSION SECURITY', [
        'The uniformed gateman steps out of his security booth. “Good afternoon. Who are you looking for?”',
        '“I have a delivery for someone inside. Kola sent me.”',
        'He checks the visitor list, then presses the gate control and gives you a nod. “All right. I will open up for you.”',
        'The gate motor hums as both panels swing aside. “You can go in now. Follow the driveway and use the main entrance.”'
      ], 'gateman');
      return;
    }

    if (stage === 'completed' && nearGatekeeper) {
      const leavingEstate = activeCharacter.group.position.x > 10;
      gatePassageDirection = leavingEstate ? 'exit' : 'entry';
      openDialogue('GATEMAN', 'MANSION SECURITY', leavingEstate ? [
        'Good afternoon. Are you leaving the estate?',
        'Yes. I am heading out now.',
        'All right. I will open the gate. Walk through and I will secure it behind you.'
      ] : [
        'Welcome back. Are you visiting the estate?',
        'Yes. I need to go back inside.',
        'All right. I will open the gate. Walk through and I will secure it behind you.'
      ], 'gate-access');
      return;
    }

    if (stage === 'enter-estate' && nearMansionDoor) {
      resetStick();
      keys.clear();
      if (residence.enterInterior(activeCharacter.group)) {
        playerFloorY = 0;
        onGround = true;
        jumpVelocity = 0;
        // Lower, closer follow camera for the mansion interior so the player
        // remains visible and the view feels like a real third-person walkthrough.
        cameraOffset.set(0, 2.35, 5.2);
        if (controls) {
          controls.target.set(
            activeCharacter.group.position.x,
            activeCharacter.group.position.y + 1.1,
            activeCharacter.group.position.z
          );
          camera.position.copy(controls.target).add(cameraOffset);
          controls.update();
        }
        missionManager.setStage('take-lift', 'Use the elevator in the main lobby to reach the upstairs reception desk.');
        showMissionNotice('THE MAIN DOORS ARE OPENING');
      }
      return;
    }

    if (nearLift && playerFloorY < 2.5
      && ['take-lift', 'take-lift', 'meet-secretary', 'secretary-stand', 'follow-secretary', 'open-office-door', 'opening-office-door', 'meet-recipient', 'completed'].includes(stage)) {
      if (residence.startLiftRide(activeCharacter.group)) {
        playerFloorY = 0;
        onGround = true;
        jumpVelocity = 0;
        showMissionNotice('ELEVATOR · GOING UP');
      }
      return;
    }

    if (nearLift && playerFloorY > 2.5 && stage !== 'inactive') {
      if (residence.startLiftRide(activeCharacter.group)) {
        onGround = true;
        jumpVelocity = 0;
        showMissionNotice('ELEVATOR · RETURNING TO LOBBY');
      }
      return;
    }

    if (stage === 'meet-secretary' && nearSecretary) {
      openDialogue('PRIVATE SECRETARY', 'UPPER FLOOR · RECEPTION', [
        'Good afternoon. Welcome. How may I help you?',
        '“I have a delivery for the man in this office. Kola sent me.”',
        '“Of course. He is expecting something. Please, come with me.”',
        'She rises from her chair and gestures towards the private office corridor. “I will show you the way.”'
      ], 'secretary');
      return;
    }

    if (stage === 'open-office-door' && nearOfficeDoor) {
      residence.openOfficeDoor();
      missionManager.setStage('opening-office-door', 'Wait while the private office doors open.');
      showMissionNotice('PRIVATE OFFICE · OPENING DOORS');
      return;
    }

    if (stage === 'completed' && nearExit) {
      if (residence.exitInterior(activeCharacter.group)) {
        resetStick();
        keys.clear();
        showMissionNotice('MAIN ENTRANCE · EXITING THE MANSION');
      }
      return;
    }

    if (stage === 'meet-recipient' && nearRecipient) {
      openDialogue('THE OLDER MAN', 'PRIVATE OFFICE · UNKNOWN CONTACT', [
        'Who sent you?',
        'Kola. He said I should bring this here.',
        'Kola? Hmm… I thought that matter was already settled.',
        'Here is your payment. Now leave. And forget you came here.'
      ], 'recipient');
      return;
    }

    if (nearbyExpansionNpc) {
      const conversations = {
        resident: [
          'Morning, my friend. How you dey?',
          'This part of Oriyaba is always busy. The market stalls are just down the road.',
          'Take care of yourself out here.'
        ],
        vendor: [
          'Welcome, my friend. What are you looking for today?',
          'We have fresh produce, everyday provisions and small snacks here at the Oriyaba market.',
          'Take your time and have a look around.'
        ],
        child: [
          'Hello! Are you new around here?',
          'My friends and I play around this part of the street. Watch where you step!',
          'See you later!'
        ],
        police: [
          'Good day. I am on patrol around this neighbourhood.',
          'Keep the peace and report trouble at the police outpost.'
        ],
        clinic: [
          'Good afternoon. This is the community clinic.',
          'If anyone around here needs medical help, come and ask for the clinic staff.'
        ]
      };
      openDialogue(
        nearbyExpansionNpc.label,
        'ORIYABA · NEIGHBOURHOOD',
        conversations[nearbyExpansionNpc.role] || conversations.resident,
        'neighbour'
      );
    }
  }

  function handleDialogueNext() {
    interact();
  }

  function handleActionDown() {
    interact();
    actionButton?.classList.add('is-pressed');
    window.clearTimeout(actionPressTimer);
    actionPressTimer = window.setTimeout(() => {
      actionButton?.classList.remove('is-pressed');
    }, 140);
  }
  actionButton?.addEventListener('pointerdown', handleActionDown);
  dialogueNextButton?.addEventListener('click', handleDialogueNext);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', resetStick);

  function showSelectedCharacter() {
    activeCharacter = protagonists[selectedIndex];
    protagonists.forEach((character, index) => {
      character.group.visible = index === selectedIndex;
      character.group.position.set(0, 0, 3);
      character.group.rotation.set(0, 0, 0);
    });
    if (characterName) characterName.textContent = activeCharacter.name;
    if (characterDescription) characterDescription.textContent = activeCharacter.description;
    const target = new THREE.Vector3(0, 1.1, 3);
    camera.position.copy(target).add(cameraOffset);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
  }

  function moveCharacterSelection(direction) {
    if (gameStarted) return;
    selectedIndex = (selectedIndex + direction + protagonists.length) % protagonists.length;
    showSelectedCharacter();
  }

  function confirmCharacterSelection() {
    if (gameStarted) return;
    gameStarted = true;
    missionManager.start();
    showMissionNotice('MISSION STARTED · A FRESH START');
    activeCharacter.group.position.set(0, 0, 3);
    selectionStage.visible = false;
    if (selectionScreen) selectionScreen.hidden = true;
    if (mobileControls) mobileControls.hidden = false;
    if (sceneHint) sceneHint.hidden = false;
    if (buildLabel) buildLabel.hidden = false;
    if (locationLabel) locationLabel.hidden = false;
    cameraOffset.set(13, 8.65, 15);
    const target = new THREE.Vector3(0, 1.1, 3);
    camera.position.copy(target).add(cameraOffset);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
    keys.clear();
  }

  const handlePreviousCharacter = () => moveCharacterSelection(-1);
  const handleNextCharacter = () => moveCharacterSelection(1);
  previousCharacterButton?.addEventListener('click', handlePreviousCharacter);
  nextCharacterButton?.addEventListener('click', handleNextCharacter);
  confirmCharacterButton?.addEventListener('click', confirmCharacterSelection);
  showSelectedCharacter();

  function resize() {
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    renderer.setSize(width, height);
  }

  function animate() {
    if (!running) return;
    animationFrame = window.requestAnimationFrame(animate);
    const frameTime = window.performance.now();
    if (frameInterval && frameTime - lastFrameTime < frameInterval) {
      return;
    }
    lastFrameTime = frameTime;
    const delta = Math.min(clock.getDelta(), 0.05);

    if (gameStarted) {
      oriyabaExpansion.update(delta, activeCharacter.group.position);
      const npcDistance = Math.hypot(
        activeCharacter.group.position.x - npc.position.x,
        activeCharacter.group.position.z - npc.position.z
      );
      nearNpc = npcDistance <= 2.8;
      const playerPosition = activeCharacter.group.position;
      nearbyExpansionNpc = null;
      let closestExpansionNpcDistance = 2.5;
      for (const target of oriyabaExpansion.talkTargets) {
        if (!target.group.visible) continue;
        const distance = Math.hypot(
          playerPosition.x - target.group.position.x,
          playerPosition.z - target.group.position.z
        );
        if (distance < closestExpansionNpcDistance) {
          closestExpansionNpcDistance = distance;
          nearbyExpansionNpc = target;
        }
      }
      nearPackage = packagePickup.visible && Math.hypot(playerPosition.x - packagePickup.position.x, playerPosition.z - packagePickup.position.z) <= 2.5;
      nearRecipient = recipient.group.visible && Math.hypot(playerPosition.x - recipient.group.position.x, playerPosition.z - recipient.group.position.z) <= 2.25;
      nearSecretary = secretary.group.visible && missionManager.getState().stage === 'meet-secretary'
        && Math.hypot(playerPosition.x - secretary.group.position.x, playerPosition.z - secretary.group.position.z) <= 2.5;
      nearGatekeeper = gatekeeper.group.visible && Math.hypot(playerPosition.x - gatekeeper.group.position.x, playerPosition.z - gatekeeper.group.position.z) <= 2.8;
      nearMansionDoor = !residence.isInterior() && playerPosition.x >= 16.35 && playerPosition.x <= 17.65 && playerPosition.z >= -34.45 && playerPosition.z <= -32.85;
      nearOfficeDoor = residence.isNearOfficeDoor(playerPosition.x, playerPosition.z);
      nearExit = residence.isNearExit(playerPosition.x, playerPosition.z);
            nearLift = residence.isNearLift(playerPosition.x, playerPosition.z);
      const missionState = missionManager.getState();
      if (locationLabel) {
        if (residence.isInterior()) {
          locationLabel.textContent = playerFloorY >= 3.8
            ? (playerPosition.z < -7.1 ? 'PRIVATE RESIDENCE · PRIVATE OFFICE' : 'PRIVATE RESIDENCE · UPSTAIRS RECEPTION')
            : 'PRIVATE RESIDENCE · MAIN LOBBY';
        } else if (missionState.stage === 'reach-mansion' || missionState.stage === 'enter-estate') {
          locationLabel.textContent = 'ORIYABA · GUARDED ESTATE';
        } else {
          locationLabel.textContent = 'ORIYABA · STREET DISTRICT';
        }
      }

      if (interactionPrompt) {
        let promptText = '';
        let promptVisible = false;
        if (missionState.stage === 'meet-kola' && nearNpc) {
          promptText = 'TALK TO KOLA';
          promptVisible = true;
        } else if (nearbyExpansionNpc) {
          promptText = 'TALK TO ' + nearbyExpansionNpc.label;
          promptVisible = true;
        } else if (missionState.stage === 'collect-package' && nearPackage) {
          promptText = 'COLLECT PACKAGE';
          promptVisible = true;
        } else if ((missionState.stage === 'reach-mansion' && nearGatekeeper)
          || (missionState.stage === 'completed' && nearGatekeeper)) {
          promptText = 'TALK TO GATEMAN';
          promptVisible = true;
        } else if (missionState.stage === 'enter-estate' && nearMansionDoor) {
          promptText = 'ENTER MANSION';
          promptVisible = true;
        } else if (nearLift && playerFloorY < 2.5
          && ['take-lift', 'take-lift', 'meet-secretary', 'secretary-stand', 'follow-secretary', 'open-office-door', 'opening-office-door', 'meet-recipient', 'completed'].includes(missionState.stage)) {
          promptText = 'TAKE ELEVATOR UP';
          promptVisible = true;
        } else if (nearLift && playerFloorY > 2.5 && missionState.stage !== 'inactive') {
          promptText = 'TAKE ELEVATOR DOWN';
          promptVisible = true;
        } else if (missionState.stage === 'meet-secretary' && nearSecretary) {
          promptText = 'SPEAK TO SECRETARY';
          promptVisible = true;
        } else if (missionState.stage === 'open-office-door' && nearOfficeDoor) {
          promptText = 'OPEN PRIVATE OFFICE';
          promptVisible = true;
        } else if (missionState.stage === 'meet-recipient' && nearRecipient) {
          promptText = 'DELIVER PACKAGE';
          promptVisible = true;
        } else if (missionState.stage === 'completed' && nearExit) {
          promptText = 'EXIT MANSION';
          promptVisible = true;
        }
        interactionPrompt.hidden = !promptVisible || dialogueOpen || residence.isLiftRunning() || residence.isOfficeDoorOpening() || residence.isExitingInterior();
        if (interactionLabel) interactionLabel.textContent = promptText;
      }

      npcMarker.rotation.z += delta * 0.8;
      npcMarker.position.y = 0.08 + Math.sin(frameTime * 0.003) * 0.035;
      packageMarker.rotation.z += delta * 0.8;
      packageMarker.position.y = 0.08 + Math.sin(frameTime * 0.003 + 1) * 0.035;
      recipient.marker.rotation.z += delta * 0.8;
      residence.updateGate(delta);
      // Close the estate gate only after the player has fully cleared its opening.
      if (gatePassageDirection === 'entry'
        && playerPosition.x > 10.9 && Math.abs(playerPosition.z + 38) < 3.0) {
        residence.closeGate();
        gatePassageDirection = null;
        showMissionNotice('ESTATE GATE · SECURED');
      } else if (gatePassageDirection === 'exit'
        && playerPosition.x < 9.35 && Math.abs(playerPosition.z + 38) < 3.0) {
        residence.closeGate();
        gatePassageDirection = null;
        showMissionNotice('ESTATE GATE · CLOSED');
      }
      const enteringInterior = residence.isEnteringInterior();
      residence.updateEntry(delta);
      if (enteringInterior && !residence.isEnteringInterior()) {
        showMissionNotice('MANSION INTERIOR · YOU ARE INSIDE');
      }
      const officeDoorWasOpening = residence.isOfficeDoorOpening();
      residence.updateOfficeDoor(delta);
      if (officeDoorWasOpening && !residence.isOfficeDoorOpening()
        && missionManager.getState().stage === 'opening-office-door') {
        missionManager.setStage('meet-recipient', 'Enter the private office and deliver the sealed package to the man behind the desk.');
        recipient.group.visible = true;
        showMissionNotice('PRIVATE OFFICE · DOOR OPEN');
      }
      const exitingInterior = residence.isExitingInterior();
      residence.updateExit(delta);
      if (exitingInterior && !residence.isExitingInterior()) {
        playerFloorY = 0;
        onGround = true;
        jumpVelocity = 0;
        cameraOffset.set(0, 4.2, 7.2);
        showMissionNotice('ORIYABA · BACK OUTSIDE THE MANSION');
      }
      if (gatekeeperGestureTime > 0) {
        gatekeeperGestureTime = Math.max(0, gatekeeperGestureTime - delta);
        const gesture = Math.sin((1.15 - gatekeeperGestureTime) * 5.2);
        if (gatekeeper.arms[1]) gatekeeper.arms[1].rotation.x = -Math.max(0, gesture) * 1.15;
      } else if (gatekeeper.arms[1]) {
        gatekeeper.arms[1].rotation.x = THREE.MathUtils.damp(gatekeeper.arms[1].rotation.x, 0, 7, delta);
      }
      if (secretary.group.visible && nearSecretary && missionManager.getState().stage === 'meet-secretary') {
        secretary.head.rotation.y = Math.atan2(
          playerPosition.x - secretary.group.position.x,
          playerPosition.z - secretary.group.position.z
        );
      }
      if (recipient.group.visible && nearRecipient) {
        recipient.group.rotation.y = Math.atan2(
          playerPosition.x - recipient.group.position.x,
          playerPosition.z - recipient.group.position.z
        );
      }

      if (residence.isLiftRunning()) {
        const liftStillRunning = residence.updateLift(delta, activeCharacter.group);
        if (!liftStillRunning) {
          playerFloorY = activeCharacter.group.position.y > 2.5 ? 4.35 : 0;
          onGround = true;
          jumpVelocity = 0;
          if (playerFloorY > 2.5 && missionManager.getState().status === 'active'
            && missionManager.getState().stage === 'take-lift') {
            secretary.group.visible = true;
            missionManager.setStage('meet-secretary', 'Go to the upstairs reception desk and speak to the secretary.');
            showMissionNotice('UPPER FLOOR · RECEPTION');
          } else if (playerFloorY === 0) {
            showMissionNotice('MAIN LOBBY · YOU ARE BACK DOWNSTAIRS');
          }
        }
      }

      const movementLocked = dialogueOpen || secretaryStandingUp || residence.isLiftRunning() || residence.isEnteringInterior() || residence.isExitingInterior() || residence.isOfficeDoorOpening() || residence.isGateOpening();
      let inputX = movementLocked ? 0 : stickState.x;
      let inputZ = movementLocked ? 0 : stickState.y;
      if (!movementLocked && (keys.has('a') || keys.has('arrowleft'))) inputX -= 1;
      if (!movementLocked && (keys.has('d') || keys.has('arrowright'))) inputX += 1;
      if (!movementLocked && (keys.has('w') || keys.has('arrowup'))) inputZ -= 1;
      if (!movementLocked && (keys.has('s') || keys.has('arrowdown'))) inputZ += 1;

      const inputLength = Math.hypot(inputX, inputZ);
      if (inputLength > 1) {
        inputX /= inputLength;
        inputZ /= inputLength;
      }

      if (inputLength > 0.08) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const movement = forward.multiplyScalar(-inputZ).add(right.multiplyScalar(inputX)).normalize();
        const isRunning = keys.has('shift') || Math.abs(stickState.x) > 0.82 || Math.abs(stickState.y) > 0.82;
        const speed = isRunning ? 5.4 : 3.0;
        const resolved = collisionWorld.moveCircle(
          activeCharacter.group.position,
          movement.x * speed * delta,
          movement.z * speed * delta,
          activeCharacter.group.position.y,
          collisionActors,
          activeCharacter.group
        );
        const insideMansion = residence.isInterior();
        activeCharacter.group.position.x = insideMansion
          ? (playerFloorY >= 3.8
            ? THREE.MathUtils.clamp(resolved.x, 96.95, 115.05)
            : THREE.MathUtils.clamp(resolved.x, 94.65, 117.35))
          : THREE.MathUtils.clamp(resolved.x, -8.7, 24);
        activeCharacter.group.position.z = insideMansion
          ? THREE.MathUtils.clamp(resolved.z, -14.15, 14.45)
          : THREE.MathUtils.clamp(resolved.z, -53, 43);
        if (onGround) {
          const supportedFloor = residence.getFloorY(
            activeCharacter.group.position.x,
            activeCharacter.group.position.z,
            playerFloorY
          );
          if (supportedFloor < playerFloorY - 0.08) {
            playerFloorY = supportedFloor;
            onGround = false;
            jumpVelocity = 0;
          } else {
            playerFloorY = supportedFloor;
            activeCharacter.group.position.y = playerFloorY;
          }
        }
        activeCharacter.group.rotation.y = Math.atan2(movement.x, movement.z);
        activeCharacter.walkTime += delta * (isRunning ? 10.0 : 6.3);
        const stride = Math.sin(activeCharacter.walkTime);
        const strideAmount = isRunning ? 0.72 : 0.48;
        activeCharacter.leftLeg.rotation.x = stride * strideAmount;
        activeCharacter.rightLeg.rotation.x = -stride * strideAmount;
        activeCharacter.leftArm.rotation.x = -stride * (isRunning ? 0.52 : 0.36);
        activeCharacter.rightArm.rotation.x = stride * (isRunning ? 0.52 : 0.36);
        activeCharacter.body.position.y = Math.abs(Math.cos(activeCharacter.walkTime * 2)) * (isRunning ? 0.075 : 0.035);
        activeCharacter.head.rotation.x = Math.sin(activeCharacter.walkTime) * 0.025;
      } else {
        activeCharacter.leftLeg.rotation.x = THREE.MathUtils.damp(activeCharacter.leftLeg.rotation.x, 0, 9, delta);
        activeCharacter.rightLeg.rotation.x = THREE.MathUtils.damp(activeCharacter.rightLeg.rotation.x, 0, 9, delta);
        activeCharacter.leftArm.rotation.x = THREE.MathUtils.damp(activeCharacter.leftArm.rotation.x, 0, 7, delta);
        activeCharacter.rightArm.rotation.x = THREE.MathUtils.damp(activeCharacter.rightArm.rotation.x, 0, 7, delta);
        activeCharacter.body.position.y = Math.sin(frameTime * 0.0018) * 0.018;
        activeCharacter.head.rotation.x = Math.sin(frameTime * 0.0011) * 0.012;
      }

      if (!onGround) {
        const previousY = activeCharacter.group.position.y;
        const nextY = previousY + jumpVelocity * delta;
        const landingPlatform = residence.getLandingY(
          activeCharacter.group.position.x,
          activeCharacter.group.position.z,
          previousY,
          nextY,
          jumpVelocity <= 0
        );
        activeCharacter.group.position.y = nextY;
        activeCharacter.body.rotation.x = -0.08;
        jumpVelocity -= 15 * delta;
        if (landingPlatform !== null) {
          playerFloorY = landingPlatform;
          activeCharacter.group.position.y = landingPlatform;
          activeCharacter.body.rotation.x = 0;
          jumpVelocity = 0;
          onGround = true;
        } else if (activeCharacter.group.position.y <= playerFloorY) {
          activeCharacter.group.position.y = playerFloorY;
          activeCharacter.body.rotation.x = 0;
          jumpVelocity = 0;
          onGround = true;
        }
      }

      if (secretaryStandingUp) {
        secretaryStandProgress = Math.min(1, secretaryStandProgress + delta / 0.72);
        const t = secretaryStandProgress * secretaryStandProgress * (3 - 2 * secretaryStandProgress);
        secretary.head.rotation.y = THREE.MathUtils.damp(secretary.head.rotation.y, 0, 8, delta);
        secretary.torso.position.y = THREE.MathUtils.lerp(0.88, 1.04, t);
        secretary.head.position.y = THREE.MathUtils.lerp(1.53, 1.69, t);
        secretary.hair.position.y = THREE.MathUtils.lerp(1.61, 1.77, t);
        secretary.eyes.forEach((eye) => { eye.position.y = THREE.MathUtils.lerp(1.55, 1.71, t); });
        secretary.pupils.forEach((pupil) => { pupil.position.y = THREE.MathUtils.lerp(1.55, 1.71, t); });
        secretary.nose.position.y = THREE.MathUtils.lerp(1.48, 1.64, t);
        secretary.legs.forEach((leg) => {
          leg.position.y = THREE.MathUtils.lerp(0.38, 0.43, t);
          leg.position.z = THREE.MathUtils.lerp(0.24, 0, t);
          leg.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        });
        secretary.shoes.forEach((shoe) => { shoe.position.z = THREE.MathUtils.lerp(0.58, 0.07, t); });
        secretary.arms.forEach((arm) => {
          arm.position.y = THREE.MathUtils.lerp(1.0, 1.37, t);
          arm.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0, t);
        });
        if (secretaryStandProgress >= 1) {
          secretaryStandingUp = false;
          secretaryWalking = true;
          secretary.group.rotation.y = Math.PI;
          missionManager.setStage('follow-secretary', 'Follow the secretary along the upper corridor to the private office door.');
          showMissionNotice('FOLLOW THE SECRETARY');
        }
      }

      if (secretaryWalking) {
        const destination = residence.secretaryEscortPosition;
        const dx = destination.x - secretary.group.position.x;
        const dz = destination.z - secretary.group.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance <= 0.12) {
          secretary.group.position.copy(destination);
          secretaryWalking = false;
          secretary.group.rotation.y = 0;
          secretary.legs.forEach((leg) => { leg.rotation.x = 0; });
          secretary.arms.forEach((arm) => { arm.rotation.x = 0; });
          missionManager.setStage('open-office-door', 'Walk up to the private office and open the door yourself.');
          showMissionNotice('THE SECRETARY · PRIVATE OFFICE');
        } else {
          const step = Math.min(distance, 1.75 * delta);
          secretary.group.position.x += (dx / distance) * step;
          secretary.group.position.z += (dz / distance) * step;
          secretary.group.rotation.y = Math.atan2(dx, dz);
          secretaryWalkTime += delta * 7.5;
          const stride = Math.sin(secretaryWalkTime) * 0.42;
          secretary.legs[0].rotation.x = stride;
          secretary.legs[1].rotation.x = -stride;
          secretary.arms[0].rotation.x = -stride * 0.7;
          secretary.arms[1].rotation.x = stride * 0.7;
        }
      }
    }

    const target = new THREE.Vector3(
      activeCharacter.group.position.x,
      activeCharacter.group.position.y + 1.1,
      activeCharacter.group.position.z
    );
    if (controls) {
      const targetDelta = target.clone().sub(controls.target);
      camera.position.add(targetDelta);
      controls.target.copy(target);
      controls.update();
    } else {
      // Keep a constant camera distance and angle while following the player.
      camera.position.copy(target).add(cameraOffset);
      camera.lookAt(target);
    }
    renderer.render(scene, camera);
  }

  function handleContextLost(event) {
    event.preventDefault();
    running = false;
    const panel = document.querySelector('#game-error');
    if (panel) {
      panel.hidden = false;
      panel.textContent = 'Graphics were interrupted. Please reload the page to restart the 3D preview.';
    }
  }

  renderer.domElement.addEventListener('pointerdown', handleCameraDown);
  renderer.domElement.addEventListener('pointermove', handleCameraMove);
  renderer.domElement.addEventListener('pointerup', handleCameraUp);
  renderer.domElement.addEventListener('pointercancel', handleCameraUp);

  renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
  window.addEventListener('resize', resize);

  return {
    start() {
      if (running) return;
      running = true;
      clock.start();
      animate();
    },
    destroy() {
      running = false;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetStick);
      previousCharacterButton?.removeEventListener('click', handlePreviousCharacter);
      nextCharacterButton?.removeEventListener('click', handleNextCharacter);
      confirmCharacterButton?.removeEventListener('click', confirmCharacterSelection);
      joystickBase?.removeEventListener('pointerdown', handleStickDown);
      joystickBase?.removeEventListener('pointermove', handleStickMove);
      joystickBase?.removeEventListener('pointerup', handleStickUp);
      joystickBase?.removeEventListener('pointercancel', handleStickUp);
      jumpButton?.removeEventListener('pointerdown', jump);
      actionButton?.removeEventListener('pointerdown', handleActionDown);
      dialogueNextButton?.removeEventListener('click', handleDialogueNext);
      window.clearTimeout(actionPressTimer);
      window.clearTimeout(missionNoticeTimer);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('pointerdown', handleCameraDown);
      renderer.domElement.removeEventListener('pointermove', handleCameraMove);
      renderer.domElement.removeEventListener('pointerup', handleCameraUp);
      renderer.domElement.removeEventListener('pointercancel', handleCameraUp);
      controls?.dispose();
      const disposedGeometries = new Set();
      const disposedMaterials = new Set();
      const disposedTextures = new Set();
      scene.traverse((object) => {
        if (object.geometry && !disposedGeometries.has(object.geometry)) {
          disposedGeometries.add(object.geometry);
          object.geometry.dispose();
        }
        const materials = Array.isArray(object.material)
          ? object.material
          : object.material ? [object.material] : [];
        for (const material of materials) {
          if (disposedMaterials.has(material)) continue;
          disposedMaterials.add(material);
          for (const value of Object.values(material)) {
            if (value && value.isTexture && !disposedTextures.has(value)) {
              disposedTextures.add(value);
              value.dispose();
            }
          }
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
