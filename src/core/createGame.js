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
  camera.position.set(20, 17, 25);

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

  const hemisphereLight = new THREE.HemisphereLight(0x8297c5, 0x29251f, 1.35);
  scene.add(hemisphereLight);

  const moonLight = new THREE.DirectionalLight(0x9bb8ed, 1.15);
  moonLight.position.set(-18, 30, 12);
  scene.add(moonLight);

  createStarterDistrict(scene);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 11;
  controls.maxDistance = 58;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.18;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.panSpeed = 0.45;
  controls.update();

  const clock = new THREE.Clock();
  let animationFrame = 0;
  let running = false;

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

    controls.update();
    renderer.render(scene, camera);

    // The capped delta is ready for future gameplay systems and physics.
    void delta;
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
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose?.();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
