import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarterDistrict } from '../world/createStarterDistrict.js';
import { createProtagonists } from '../characters/createProtagonists.js';
import { createMissionManager } from '../missions/missionManager.js';

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

  createStarterDistrict(scene);

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

  function createMissionPerson(x, z, shirtColor) {
    const person = new THREE.Group();
    person.position.set(x, 0, z);
    const skin = new THREE.MeshStandardMaterial({ color: 0x805039, roughness: 0.92 });
    const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.9 });
    const trousers = new THREE.MeshStandardMaterial({ color: 0x202631, roughness: 0.95 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.55, 3, 7), shirt);
    torso.position.y = 1.03;
    person.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 9, 7), skin);
    head.position.y = 1.62;
    person.add(head);
    const legs = new THREE.CylinderGeometry(0.105, 0.12, 0.62, 6);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legs, trousers);
      leg.position.set(side * 0.13, 0.42, 0);
      person.add(leg);
    }
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 6, 20),
      new THREE.MeshStandardMaterial({ color: 0xd6a75e, emissive: 0x8b5720, emissiveIntensity: 0.75 })
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.07;
    person.add(marker);
    scene.add(person);
    return { group: person, marker };
  }

  const suspiciousMen = [
    createMissionPerson(-0.72, -14.5, 0x693d3b),
    createMissionPerson(0.72, -14.5, 0x353e50)
  ];
  suspiciousMen.forEach((person) => { person.group.visible = false; });
  const recipient = createMissionPerson(-5.6, -32, 0x4b5365);
  recipient.group.visible = false;

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
  const encounterPosition = new THREE.Vector3(0, 0, -14.5);

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
  const initialTarget = new THREE.Vector3(0, 1.25, 3);
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
  const buildLabel = document.querySelector('.build-label');
  const interactionLabel = document.querySelector('#interaction-label');
  const dialogueTag = document.querySelector('.dialogue-tag');
  const missionHud = document.querySelector('#mission-hud');
  const missionTitle = document.querySelector('#mission-title');
  const missionObjective = document.querySelector('#mission-objective');
  const missionReward = document.querySelector('#mission-reward');
  const missionNotice = document.querySelector('#mission-notice');
  const encounterChoice = document.querySelector('#encounter-choice');
  const approachButtons = document.querySelectorAll('[data-approach]');
  let encounterChoiceOpen = false;
  let nearPackage = false;
  let nearRecipient = false;
  let dialoguePurpose = null;
  let missionNoticeTimer = 0;

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

  function moveToDelivery() {
    suspiciousMen.forEach((person) => { person.group.visible = false; });
    missionManager.setStage('deliver-package', 'Take the sealed package to the older man.');
    recipient.group.visible = true;
    showMissionNotice('The men are behind you. Find the older man.');
  }

  function handleApproachChoice(event) {
    const approach = event.currentTarget.dataset.approach;
    encounterChoiceOpen = false;
    if (encounterChoice) encounterChoice.hidden = true;
    missionManager.chooseApproach(approach);
    if (approach === 'run') {
      showMissionNotice('Run! Get clear of the two men.');
      return;
    }
    if (approach === 'talk') {
      openDialogue('TWO SUSPICIOUS MEN', 'STREET ENCOUNTER', [
        'One of the men blocks your way. “Where are you taking that package?”',
        'You keep your voice calm. “Just a delivery. I have no trouble with anybody.”',
        'The second man studies you, then steps aside. “Go. And be careful who you work for.”'
      ], 'talk-men');
      return;
    }
    openDialogue('TWO SUSPICIOUS MEN', 'SCRIPTED STREET CONFRONTATION', [
      'You refuse to back down. The men move toward you and a brief struggle breaks out.',
      'After a tense moment, you manage to get past them. Your package is still with you.'
    ], 'fight-men');
  }

  approachButtons.forEach((button) => button.addEventListener('click', handleApproachChoice));
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
    if (!gameStarted || dialogueOpen || encounterChoiceOpen || !onGround) return;
    jumpVelocity = 6.2;
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
    } else if (completedPurpose === 'talk-men' || completedPurpose === 'fight-men') {
      moveToDelivery();
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
      missionManager.setStage('reach-encounter', 'Take the package down the road to the delivery address.');
      showMissionNotice('PACKAGE COLLECTED · KEEP IT SAFE');
      return;
    }

    if (stage === 'deliver-package' && nearRecipient) {
      openDialogue('THE OLDER MAN', 'UNKNOWN CONTACT', [
        'Who sent you?',
        'Kola. He said I should bring this here.',
        'Kola? Hmm… I thought that matter was already settled.',
        'Here is your payment. Now leave. And forget you came here.'
      ], 'recipient');
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
    const target = new THREE.Vector3(0, 1.25, 3);
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
    cameraOffset.set(13, 8.65, 15);
    const target = new THREE.Vector3(0, 1.35, 3);
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
      const npcDistance = Math.hypot(
        activeCharacter.group.position.x - npc.position.x,
        activeCharacter.group.position.z - npc.position.z
      );
      nearNpc = npcDistance <= 2.8;
      const playerPosition = activeCharacter.group.position;
      nearPackage = packagePickup.visible && Math.hypot(playerPosition.x - packagePickup.position.x, playerPosition.z - packagePickup.position.z) <= 2.5;
      nearRecipient = recipient.group.visible && Math.hypot(playerPosition.x - recipient.group.position.x, playerPosition.z - recipient.group.position.z) <= 2.8;
      const missionState = missionManager.getState();

      if (missionState.stage === 'reach-encounter') {
        const encounterDistance = Math.hypot(playerPosition.x - encounterPosition.x, playerPosition.z - encounterPosition.z);
        if (encounterDistance <= 2.9) {
          suspiciousMen.forEach((person) => { person.group.visible = true; });
          encounterChoiceOpen = true;
          if (encounterChoice) encounterChoice.hidden = false;
          missionManager.setStage('choose-approach', 'Choose how to handle the two men.');
          showMissionNotice('TWO MEN BLOCK YOUR WAY');
        }
      } else if (missionState.stage === 'escape') {
        const encounterDistance = Math.hypot(playerPosition.x - encounterPosition.x, playerPosition.z - encounterPosition.z);
        if (encounterDistance >= 7) moveToDelivery();
      }

      if (interactionPrompt) {
        let promptText = '';
        let promptVisible = false;
        if (missionState.stage === 'meet-kola' && nearNpc) {
          promptText = 'TALK TO KOLA';
          promptVisible = true;
        } else if (missionState.stage === 'collect-package' && nearPackage) {
          promptText = 'COLLECT PACKAGE';
          promptVisible = true;
        } else if (missionState.stage === 'deliver-package' && nearRecipient) {
          promptText = 'DELIVER PACKAGE';
          promptVisible = true;
        }
        interactionPrompt.hidden = !promptVisible || dialogueOpen || encounterChoiceOpen;
        if (interactionLabel) interactionLabel.textContent = promptText;
      }

      npcMarker.rotation.z += delta * 0.8;
      npcMarker.position.y = 0.08 + Math.sin(frameTime * 0.003) * 0.035;
      packageMarker.rotation.z += delta * 0.8;
      packageMarker.position.y = 0.08 + Math.sin(frameTime * 0.003 + 1) * 0.035;
      recipient.marker.rotation.z += delta * 0.8;
      suspiciousMen.forEach((person, index) => {
        person.marker.rotation.z += delta * 0.7;
        person.marker.position.y = 0.07 + Math.sin(frameTime * 0.003 + index) * 0.025;
      });

      const movementLocked = dialogueOpen || encounterChoiceOpen;
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
        const speed = isRunning ? 7.0 : 4.8;
        activeCharacter.group.position.x = THREE.MathUtils.clamp(activeCharacter.group.position.x + movement.x * speed * delta, -8.7, 8.7);
        activeCharacter.group.position.z = THREE.MathUtils.clamp(activeCharacter.group.position.z + movement.z * speed * delta, -43, 43);
        activeCharacter.group.rotation.y = Math.atan2(movement.x, movement.z);
        activeCharacter.walkTime += delta * (isRunning ? 14.5 : 9.5);
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
        activeCharacter.group.position.y += jumpVelocity * delta;
        activeCharacter.body.rotation.x = -0.08;
        jumpVelocity -= 15 * delta;
        if (activeCharacter.group.position.y <= 0) {
          activeCharacter.group.position.y = 0;
          activeCharacter.body.rotation.x = 0;
          jumpVelocity = 0;
          onGround = true;
        }
      }
    }

    const target = new THREE.Vector3(
      activeCharacter.group.position.x,
      activeCharacter.group.position.y + 1.35,
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
      approachButtons.forEach((button) => button.removeEventListener('click', handleApproachChoice));
      window.clearTimeout(actionPressTimer);
      window.clearTimeout(missionNoticeTimer);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('pointerdown', handleCameraDown);
      renderer.domElement.removeEventListener('pointermove', handleCameraMove);
      renderer.domElement.removeEventListener('pointerup', handleCameraUp);
      renderer.domElement.removeEventListener('pointercancel', handleCameraUp);
      controls?.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
