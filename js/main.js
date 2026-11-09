import * as THREE from "three";
import { createCityGame } from "./city.js?v=19";

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
const WALLET_KEY = "cos-player-wallet-v1";
const INVENTORY_KEY = "cos-player-inventory-v1";
const EQUIPMENT_KEY = "cos-player-equipment-v1";
const NEEDS_KEY = "cos-player-needs-v1";
let wallet = 500;
let inventory = {};
let equipment = { top: "", shoes: "" };
let needs = { hunger: 100, hydration: 100, energy: 100 };


function loadShopData() {
  try {
    const savedWallet = localStorage.getItem(WALLET_KEY);
    wallet = savedWallet === null ? 500 : Number(savedWallet);
    if (!Number.isFinite(wallet) || wallet < 0) wallet = 500;
    inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "{}") || {};
    equipment = JSON.parse(localStorage.getItem(EQUIPMENT_KEY) || '{"top":"","shoes":""}') || { top:"", shoes:"" };
    needs = JSON.parse(localStorage.getItem(NEEDS_KEY) || '{"hunger":100,"hydration":100,"energy":100}') || { hunger:100, hydration:100, energy:100 };
  } catch { wallet = 500; inventory = {}; equipment = { top:"", shoes:"" }; needs = { hunger:100, hydration:100, energy:100 }; }
}
function renderShop() {
  $("#shop-cash").textContent = "₦" + wallet.toLocaleString("en-NG");
  const entries = Object.entries(inventory).filter(([,count]) => count > 0);
  $("#shop-inventory").textContent = entries.length
    ? entries.map(([item,count]) => item[0].toUpperCase()+item.slice(1)+" × "+count).join(" · ")
    : "No items yet";
}
function itemName(item) {
  return ({ meal:"Street Meal", water:"Bottled Water", hoodie:"Street Hoodie", sneakers:"Fresh Sneakers" })[item] || item;
}
function savePlayerData() {
  localStorage.setItem(WALLET_KEY, String(wallet));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment));
  localStorage.setItem(NEEDS_KEY, JSON.stringify(needs));
}
function openInventory() {
  loadShopData();
  renderInventory();
  $("#inventory-message").textContent = "Choose WEAR or REMOVE for clothing, or USE for food and drinks.";
  $("#inventory-panel").classList.remove("hidden");
}
function closeInventory() { $("#inventory-panel").classList.add("hidden"); }
function renderInventory() {
  $("#inventory-cash").textContent = "₦" + wallet.toLocaleString("en-NG");
  const rows = Object.entries(inventory).filter(([,count]) => count > 0);
  $("#wardrobe-current").textContent = "EQUIPPED · " +
    (equipment.top ? itemName(equipment.top) : "STARTER TOP") + " · " +
    (equipment.shoes ? itemName(equipment.shoes) : "STARTER SHOES");
  $("#inventory-list").replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = "Your inventory is empty. Visit the neighbourhood shop to buy items.";
    $("#inventory-list").appendChild(empty);
    return;
  }
  rows.forEach(([item,count]) => {
    const row = document.createElement("article");
    row.className = "inventory-row";
    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = itemName(item);
    const quantity = document.createElement("span");
    quantity.textContent = "Owned · " + count + (equipment.top === item || equipment.shoes === item ? " · EQUIPPED" : "");
    info.append(name, quantity);
    const action = document.createElement("button");
    action.className = "inventory-action";
    const consumable = item === "meal" || item === "water";
    action.textContent = consumable ? "USE" : (equipment.top === item || equipment.shoes === item ? "REMOVE" : "WEAR");
    action.addEventListener("click", () => {
      if (consumable) {
        inventory[item] = Math.max(0, (inventory[item] || 0) - 1);
        if (item === "meal") needs.hunger = Math.min(100, needs.hunger + 35);
        if (item === "water") needs.hydration = Math.min(100, needs.hydration + 40);
        $("#inventory-message").textContent = itemName(item) + " used. Your needs have been restored.";
      } else {
        const slot = item === "hoodie" ? "top" : item === "sneakers" ? "shoes" : "";
        if (!slot) return;
        equipment[slot] = equipment[slot] === item ? "" : item;
        window.dispatchEvent(new CustomEvent("cos-equipment-changed", { detail: { ...equipment } }));
        $("#inventory-message").textContent = equipment[slot] ? itemName(item) + " is now being worn." : itemName(item) + " removed. Starter clothing restored.";
      }
      savePlayerData();
      renderInventory();
    });
    row.append(info, action);
    $("#inventory-list").appendChild(row);
  });
}
function openShop() {
  loadShopData();
  renderShop();
  $("#shop-message").textContent = "Choose an item to buy. Purchases go into your inventory.";
  $("#shop-panel").classList.remove("hidden");
}
function closeShop() { $("#shop-panel").classList.add("hidden"); }
function buyShopItem(button) {
  const item = button.dataset.item;
  const price = Number(button.dataset.price);
  if (!item || !Number.isFinite(price) || price <= 0) return;
  if (wallet < price) {
    $("#shop-message").textContent = "Not enough cash for this item.";
    return;
  }
  wallet -= price;
  inventory[item] = (inventory[item] || 0) + 1;
  savePlayerData();
  renderShop();
  renderInventory();
  $("#shop-message").textContent = "Purchase complete. " + item + " added to your bag.";
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function showScreen(screen) {
  [homeScreen, creatorScreen, savedScreen, $("#city-screen")].forEach((item) => item.classList.add("hidden"));
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
  $("#shop-close-button").addEventListener("click", closeShop);
  $("#inventory-close-button").addEventListener("click", closeInventory);
  $("#inventory-panel").addEventListener("click", event => { if (event.target.id === "inventory-panel") closeInventory(); });
  $("#game-inventory-button").addEventListener("click", openInventory);
  $("#game-menu-button").addEventListener("click", () => $("#game-menu-panel").classList.remove("hidden"));
  $("#game-menu-resume-button").addEventListener("click", () => $("#game-menu-panel").classList.add("hidden"));
  $("#game-menu-inventory-button").addEventListener("click", () => { $("#game-menu-panel").classList.add("hidden"); openInventory(); });
  $("#game-menu-settings-button").addEventListener("click", () => { $("#game-menu-panel").classList.add("hidden"); $("#info-title").innerHTML = "GAME <em>SETTINGS.</em>"; $("#info-copy").textContent = "Current build uses low-power graphics and device-appropriate controls."; $("#info-panel").classList.remove("hidden"); });
  $("#game-menu-home-button").addEventListener("click", () => {
    $("#game-menu-panel").classList.add("hidden");
    if (screen.orientation && typeof screen.orientation.unlock === "function") { try { screen.orientation.unlock(); } catch {} }
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (destroyCity) destroyCity(); destroyCity = null; showScreen(homeScreen);
  });
  $("#menu-settings-button").addEventListener("click", () => {
    $("#info-title").innerHTML = 'GAME <em>SETTINGS.</em>';
    $("#info-copy").textContent = "The settings screen is being expanded. Current builds use automatic low-power graphics settings and device-appropriate touch or keyboard controls.";
    $("#info-panel").classList.remove("hidden");
  });
  $("#menu-about-button").addEventListener("click", () => {
    $("#info-title").innerHTML = 'ABOUT THE <em>GAME.</em>';
    $("#info-copy").textContent = "CITY OF SHADOWS is an open-world African street-survival and crime-drama game project. Created by Dsquare. Your choices shape your life in the city.";
    $("#info-panel").classList.remove("hidden");
  });
  $("#info-close-button").addEventListener("click", () => $("#info-panel").classList.add("hidden"));
  $("#shop-panel").addEventListener("click", event => { if (event.target.id === "shop-panel") closeShop(); });
  document.querySelectorAll(".shop-buy-button").forEach(button => button.addEventListener("click", () => buyShopItem(button)));
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
    // Android browsers may allow landscape locking only after entering fullscreen.
    // Keep both requests inside this tap gesture; unsupported browsers can still rotate manually.
    const fullscreenRequest = document.documentElement.requestFullscreen
      ? document.documentElement.requestFullscreen().catch(() => null)
      : Promise.resolve(null);
    if (screen.orientation && typeof screen.orientation.lock === "function") {
      fullscreenRequest.then(() => screen.orientation.lock("landscape")).catch(() => {
        notify("For landscape play, please rotate your phone sideways.");
      });
    }

    const saved = loadSavedCharacter();
    if (!saved) {
      notify("Create and save your character first.");
      return;
    }

    const cityScreen = $("#city-screen");
    const cityStage = $("#city-stage");
    showScreen(cityScreen);
    cityStage.textContent = "LOADING YOUR NEIGHBOURHOOD…";

    requestAnimationFrame(() => {
      if (destroyCity) {
        destroyCity();
        destroyCity = null;
      }
      try {
        loadShopData();
        saved.equipment = { ...equipment };
        saved.needs = { ...needs };
        destroyCity = createCityGame(cityStage, $("#city-controls"), saved, () => {
          if (destroyCity) destroyCity();
          destroyCity = null;
          showScreen(homeScreen);
        }, openShop, openInventory);
      } catch (error) {
        console.error("City could not start:", error);
        cityStage.textContent = "THE CITY COULD NOT LOAD. PLEASE REFRESH AND TRY AGAIN.";
        notify("City loading error: " + (error?.message || "unknown error"));
      }
    });
  });
  $("#leave-city-button").addEventListener("click", () => {
    if (screen.orientation && typeof screen.orientation.unlock === "function") {
      try { screen.orientation.unlock(); } catch {}
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
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
loadShopData();
updateContinueButton();

try {
  initPreview();
} catch (error) {
  console.error("3D preview could not start:", error);
  $("#preview-status").textContent = "3D preview unavailable in this browser. Try a browser with WebGL enabled.";
}
