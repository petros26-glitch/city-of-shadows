import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarterDistrict } from '../world/createStarterDistrict.js';

export function createGame(root) {
  if (!root) throw new Error('The game root element was not found.');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d17);
  scene.fog = new THREE.Fog(0x080d17, 42, 115);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / Math.max(window.innerHeight, 1),
    0.1,
    180
  );
  camera.position.set(13, 10, 18);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'default',
      stencil: false,
      depth: true
    });
  } catch (error) {
    throw new Error('WebGL is unavailable or disabled.', { cause: error });
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
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

  // Temporary player model: a lightweight placeholder until the character
  // selection and final character models are added.
  const player = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x8f5738, roughness: 0.88 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xc18a42, roughness: 0.9 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x202a39, roughness: 0.95 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.43, 0.72, 3, 7), shirt);
  torso.position.y = 1.18;
  player.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 8), skin);
  head.position.y = 1.98;
  player.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.315, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
  hairCap.position.y = 2.04;
  player.add(hairCap);

  const legGeometry = new THREE.CapsuleGeometry(0.16, 0.48, 2, 5);
  const leftLeg = new THREE.Mesh(legGeometry, trousers);
  leftLeg.position.set(-0.2, 0.43, 0);
  player.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeometry, trousers);
  rightLeg.position.set(0.2, 0.43, 0);
  player.add(rightLeg);

  const armGeometry = new THREE.CapsuleGeometry(0.105, 0.48, 2, 5);
  const leftArm = new THREE.Mesh(armGeometry, shirt);
  leftArm.position.set(-0.51, 1.2, 0);
  leftArm.rotation.z = -0.16;
  player.add(leftArm);
  const rightArm = new THREE.Mesh(armGeometry, shirt);
  rightArm.position.set(0.51, 1.2, 0);
  rightArm.rotation.z = 0.16;
  player.add(rightArm);

  player.position.set(0, 0, 3);
  scene.add(player);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.35, 3);
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

  const joystick = document.querySelector('#move-stick');
  const joystickBase = document.querySelector('#move-joystick');
  const jumpButton = document.querySelector('#action-jump');
  const actionButton = document.querySelector('#action-interact');
  const stickState = { x: 0, y: 0, pointerId: null };
  const keys = new Set();
  const clock = new THREE.Clock();
  const cameraOffset = camera.position.clone().sub(controls.target);
  let animationFrame = 0;
  let running = false;
  let jumpVelocity = 0;
  let onGround = true;
  let walkTime = 0;

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
    if (!onGround) return;
    jumpVelocity = 6.2;
    onGround = false;
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
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
  actionButton?.addEventListener('pointerdown', () => {
    actionButton.classList.add('is-pressed');
    window.setTimeout(() => actionButton.classList.remove('is-pressed'), 140);
  });
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', resetStick);

  function resize() {
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(width, height);
  }

  function animate() {
    if (!running) return;
    animationFrame = window.requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    let inputX = stickState.x;
    let inputZ = stickState.y;
    if (keys.has('a') || keys.has('arrowleft')) inputX -= 1;
    if (keys.has('d') || keys.has('arrowright')) inputX += 1;
    if (keys.has('w') || keys.has('arrowup')) inputZ -= 1;
    if (keys.has('s') || keys.has('arrowdown')) inputZ += 1;

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
      const speed = 5.2;
      player.position.x = THREE.MathUtils.clamp(player.position.x + movement.x * speed * delta, -8.7, 8.7);
      player.position.z = THREE.MathUtils.clamp(player.position.z + movement.z * speed * delta, -43, 43);
      player.rotation.y = Math.atan2(movement.x, movement.z);
      walkTime += delta * 10;
      leftLeg.rotation.x = Math.sin(walkTime) * 0.48;
      rightLeg.rotation.x = -Math.sin(walkTime) * 0.48;
      leftArm.rotation.x = -Math.sin(walkTime) * 0.32;
      rightArm.rotation.x = Math.sin(walkTime) * 0.32;
    } else {
      leftLeg.rotation.x *= 0.8;
      rightLeg.rotation.x *= 0.8;
      leftArm.rotation.x *= 0.8;
      rightArm.rotation.x *= 0.8;
    }

    if (!onGround) {
      player.position.y += jumpVelocity * delta;
      jumpVelocity -= 15 * delta;
      if (player.position.y <= 0) {
        player.position.y = 0;
        jumpVelocity = 0;
        onGround = true;
      }
    }

    const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z);
    const targetDelta = target.sub(controls.target);
    camera.position.add(targetDelta);
    controls.target.copy(target);
    controls.update();
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
      joystickBase?.removeEventListener('pointerdown', handleStickDown);
      joystickBase?.removeEventListener('pointermove', handleStickMove);
      joystickBase?.removeEventListener('pointerup', handleStickUp);
      joystickBase?.removeEventListener('pointercancel', handleStickUp);
      jumpButton?.removeEventListener('pointerdown', jump);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
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
