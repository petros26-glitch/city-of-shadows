import * as THREE from "three";
import { createCityGame } from "./city.js";

const STORAGE_KEY = "cos-player-character-v1";
const state = {
  name: "",
  gender: "male",
  age: 20,
  skin: "#6f402d",
  hair: "short"
};

const $ = (selector) => document.querySelector(selector);
const homeScreen = $("#home-screen");
const creatorScreen = $("#creator-screen");
const savedScreen = $("#saved-screen");
const toast = $("#toast");
let toastTimer;
let scene, camera, renderer, character, head, hairMesh, bodyMesh;
let targetRotation = 0;
let currentRotation = 0;
let cameraTarget = 0;
let dragStart = null;
let previewReady = false;
let destroyCity = null;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function showScreen(screen) {
  [homeScreen, creatorScreen, savedScreen].forEach((item) => item.classList.add("hidden"));
  screen.classList.remove("hidden");
  if (screen === creatorScreen) {
    requestAnimationFrame(() => resizePreview());
  }
}

function loadSavedCharacter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function updateContinueButton() {
  $("#continue-button").disabled = !loadSavedCharacter();
}

function setActive(selector, attribute, value) {
  document.querySelectorAll(selector).forEach((button) => {
    button.classList.toggle("selected", button.getAttribute(attribute) === value);
  });
}

function readForm() {
  state.name = $("#character-name").value.trim();
  state.age = Number($("#age-input").value);
  return { ...state };
}

function fillForm(data) {
  Object.assign(state, data);
  $("#character-name").value = state.name || "";
  $("#age-input").value = state.age || 20;
  $("#age-value").textContent = String(state.age || 20);
  setActive("[data-gender]", "data-gender", state.gender);
  setActive("[data-hair]", "data-hair", state.hair);
  setActive("[data-skin]", "data-skin", state.skin);
  updateCharacterAppearance();
}

function showSavedCharacter(data) {
  $("#saved-name").textContent = data.name.toUpperCase();
  $("#saved-details").textContent = `${data.gender === "male" ? "Male" : "Female"} · Age ${data.age} · ${data.hair} hairstyle`;
  showScreen(savedScreen);
}

function saveCharacter() {
  const data = readForm();
  if (!data.name) {
    notify("Enter a character name first.");
    $("#character-name").focus();
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateContinueButton();
    showSavedCharacter(data);
    notify("Character saved on this device.");
  } catch {
    notify("This browser could not save your character. Check device storage settings.");
  }
}

function createMaterial(color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function addMesh(parent, geometry, material, position, scale) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildCharacter() {
  character = new THREE.Group();
  const skinMaterial = createMaterial(state.skin);
  const shirtMaterial = createMaterial(state.gender === "male" ? "#292a31" : "#4b2027");
  const trousersMaterial = createMaterial("#17191f");
  const shoeMaterial = createMaterial("#0c0d11");
  const hairMaterial = createMaterial("#171116");

  // Stylized placeholder mannequin: replaceable later with a rigged character model.
  bodyMesh = addMesh(character, new THREE.CapsuleGeometry(0.34, 0.7, 5, 10), shirtMaterial, [0, 1.35, 0], [1, 1, 0.72]);
  addMesh(character, new THREE.CylinderGeometry(0.13, 0.15, 0.28, 10), skinMaterial, [0, 1.88, 0]);
  head = addMesh(character, new THREE.SphereGeometry(0.25, 16, 12), skinMaterial, [0, 2.18, 0], [0.88, 1.08, 0.85]);

  const legGeometry = new THREE.CapsuleGeometry(0.105, 0.62, 4, 8);
  addMesh(character, legGeometry, trousersMaterial, [-0.16, 0.48, 0], [1, 1, 1]);
  addMesh(character, legGeometry, trousersMaterial, [0.16, 0.48, 0], [1, 1, 1]);
  addMesh(character, new THREE.BoxGeometry(0.2, 0.11, 0.34), shoeMaterial, [-0.16, 0.08, 0.055]);
  addMesh(character, new THREE.BoxGeometry(0.2, 0.11, 0.34), shoeMaterial, [0.16, 0.08, 0.055]);

  const armGeometry = new THREE.CapsuleGeometry(0.09, 0.58, 4, 8);
  addMesh(character, armGeometry, shirtMaterial, [-0.43, 1.38, 0], [1, 1, 1]);
  addMesh(character, armGeometry, shirtMaterial, [0.43, 1.38, 0], [1, 1, 1]);
  addMesh(character, new THREE.SphereGeometry(0.095, 10, 8), skinMaterial, [-0.43, 1.02, 0]);
  addMesh(character, new THREE.SphereGeometry(0.095, 10, 8), skinMaterial, [0.43, 1.02, 0]);

  hairMesh = new THREE.Group();
  character.add(hairMesh);
  character.add(new THREE.Group());
  scene.add(character);
  updateHair(hairMaterial);
}

function updateHair(material = createMaterial("#171116")) {
  if (!hairMesh) return;
  hairMesh.clear();
  if (state.hair === "shaved") {
    addMesh(hairMesh, new THREE.SphereGeometry(0.253, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), material, [0, 2.2, 0], [0.99, 0.78, 0.9]);
  } else if (state.hair === "afro") {
    addMesh(hairMesh, new THREE.SphereGeometry(0.29, 14, 10), material, [0, 2.39, 0], [1.08, 0.85, 1]);
  } else {
    addMesh(hairMesh, new THREE.SphereGeometry(0.255, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.43), material, [0, 2.29, 0], [1, 0.65, 0.95]);
  }
}

function updateCharacterAppearance() {
  if (!previewReady || !character) return;
  scene.remove(character);
  buildCharacter();
}

function initPreview() {
  const container = $("#three-preview");
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
  camera.position.set(0, 1.65, 6.6);
  camera.lookAt(0, 1.2, 0);

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd8c6c0, 0x29212a, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffd5b0, 2.1);
  keyLight.position.set(-3, 5, 4);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xc43a43, 1.3);
  rimLight.position.set(3, 3, -3);
  scene.add(rimLight);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshStandardMaterial({ color: 0x393039, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.015;
  scene.add(floor);

  buildCharacter();
  previewReady = true;
  $("#preview-status").textContent = "3D preview ready · drag to rotate";
  renderer.setAnimationLoop(() => {
    currentRotation += (targetRotation - currentRotation) * 0.08;
    if (character) character.rotation.y = currentRotation;
    renderer.render(scene, camera);
  });
}

function resizePreview() {
  const container = $("#three-preview");
  if (!renderer || !container || !container.clientWidth || !container.clientHeight) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function setView(view) {
  const angles = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 };
  targetRotation = angles[view] ?? 0;
  document.querySelectorAll(".view-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}

function bindEvents() {
  $("#new-game-button").addEventListener("click", () => {
    const saved = loadSavedCharacter();
    fillForm(saved || { name: "", gender: "male", age: 20, skin: "#6f402d", hair: "short" });
    showScreen(creatorScreen);
  });

  $("#continue-button").addEventListener("click", () => {
    const saved = loadSavedCharacter();
    if (saved) showSavedCharacter(saved);
  });

  $("#back-home-button").addEventListener("click", () => showScreen(homeScreen));
  $("#saved-home-button").addEventListener("click", () => showScreen(homeScreen));
  $("#enter-city-button").addEventListener("click", () => {
    const saved = loadSavedCharacter();
    if (!saved) { notify("Create and save your character first."); return; }
    showScreen($("#city-screen"));
    requestAnimationFrame(() => {
      if (destroyCity) destroyCity();
      try {
        destroyCity = createCityGame($("#city-stage"), $("#city-controls"), saved, () => {
          if (destroyCity) destroyCity();
          destroyCity = null;
          showScreen(homeScreen);
        });
      } catch (error) {
        console.error("City could not start:", error);
        notify("The neighbourhood could not start. Try refreshing the page.");
      }
    });
  });
  $("#leave-city-button").addEventListener("click", () => {
    if (destroyCity) destroyCity();
    destroyCity = null;
    showScreen(homeScreen);
  });
  $("#edit-character-button").addEventListener("click", () => {
    fillForm(loadSavedCharacter() || state);
    showScreen(creatorScreen);
  });
  $("#save-character-button").addEventListener("click", saveCharacter);

  $("#age-input").addEventListener("input", (event) => {
    state.age = Number(event.target.value);
    $("#age-value").textContent = String(state.age);
  });

  document.querySelectorAll("[data-gender]").forEach((button) => button.addEventListener("click", () => {
    state.gender = button.dataset.gender;
    setActive("[data-gender]", "data-gender", state.gender);
    updateCharacterAppearance();
  }));
  document.querySelectorAll("[data-hair]").forEach((button) => button.addEventListener("click", () => {
    state.hair = button.dataset.hair;
    setActive("[data-hair]", "data-hair", state.hair);
    updateCharacterAppearance();
  }));
  document.querySelectorAll("[data-skin]").forEach((button) => button.addEventListener("click", () => {
    state.skin = button.dataset.skin;
    setActive("[data-skin]", "data-skin", state.skin);
    updateCharacterAppearance();
  }));
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

  const stage = $("#character-stage");
  stage.addEventListener("pointerdown", (event) => {
    dragStart = { x: event.clientX, rotation: targetRotation };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragStart) return;
    const delta = event.clientX - dragStart.x;
    targetRotation = dragStart.rotation + delta * 0.012;
    document.querySelectorAll(".view-button").forEach((button) => button.classList.remove("active"));
  });
  stage.addEventListener("pointerup", () => { dragStart = null; });
  stage.addEventListener("pointercancel", () => { dragStart = null; });
  window.addEventListener("resize", resizePreview);
}

bindEvents();
updateContinueButton();

try {
  initPreview();
} catch (error) {
  console.error("3D preview could not start:", error);
  $("#preview-status").textContent = "3D preview unavailable in this browser. Try a browser with WebGL enabled.";
}
