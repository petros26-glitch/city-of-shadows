import * as THREE from "three";
import { createCityGame } from "./city.js?v=54";

const STORAGE_KEY = "cos-player-character-v1";
const state = {
  name: "",
  gender: "male",
  age: 20,
  skin: "#6f402d",
  hair: "short",
  accessories: { glasses: false, chain: false, watch: false }
};

const $ = (selector) => document.querySelector(selector);
function bind(selector, eventName, handler) {
  const element = $(selector);
  if (!element) {
    console.error(`CITY OF SHADOWS: cannot bind ${eventName}; missing element ${selector}`);
    return null;
  }
  element.addEventListener(eventName, handler);
  return element;
}
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
let equipment = { top: "", pants: "", shoes: "" };
let needs = { hunger: 100, hydration: 100, energy: 100 };


function readStoredValue(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function readStoredJSON(key, fallback) {
  try {
    const raw = readStoredValue(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function loadShopData() {
  const rawWallet = readStoredValue(WALLET_KEY);
  const savedWallet = Number(rawWallet);
  wallet = rawWallet === null ? 500 : (Number.isFinite(savedWallet) && savedWallet >= 0 ? savedWallet : 500);
  const storedInventory = readStoredJSON(INVENTORY_KEY, {});
  inventory = {};
  if (storedInventory && typeof storedInventory === "object" && !Array.isArray(storedInventory)) {
    for (const [item, count] of Object.entries(storedInventory)) {
      if (["meal","water","hoodie","jacket","jeans","sneakers","medkit","fruit","rice","vegetables","fish"].includes(item) && Number.isFinite(Number(count)) && Number(count) > 0) inventory[item] = Math.floor(Number(count));
    }
  }
  const storedEquipment = readStoredJSON(EQUIPMENT_KEY, {});
  equipment = {
    top: ["hoodie","jacket"].includes(storedEquipment?.top) ? storedEquipment.top : "",
    pants: storedEquipment?.pants === "jeans" ? "jeans" : "",
    shoes: storedEquipment?.shoes === "sneakers" ? "sneakers" : ""
  };
  const storedNeeds = readStoredJSON(NEEDS_KEY, {});
  needs = {
    hunger: Number.isFinite(Number(storedNeeds?.hunger)) ? Math.min(100,Math.max(0,Number(storedNeeds.hunger))) : 100,
    hydration: Number.isFinite(Number(storedNeeds?.hydration)) ? Math.min(100,Math.max(0,Number(storedNeeds.hydration))) : 100,
    energy: Number.isFinite(Number(storedNeeds?.energy)) ? Math.min(100,Math.max(0,Number(storedNeeds.energy))) : 100
  };
}
function renderShop() {
  $("#shop-cash").textContent = "₦" + wallet.toLocaleString("en-NG");
  const entries = Object.entries(inventory).filter(([,count]) => count > 0);
  $("#shop-inventory").textContent = entries.length
    ? entries.map(([item,count]) => item[0].toUpperCase()+item.slice(1)+" × "+count).join(" · ")
    : "No items yet";
}
function itemName(item) {
  return ({ meal:"Street Meal", water:"Bottled Water", hoodie:"Street Hoodie", jacket:"Denim Jacket", jeans:"Blue Jeans", sneakers:"Fresh Sneakers", medkit:"First Aid Kit", fruit:"Fresh Fruit", rice:"Rice Bowl", vegetables:"Fresh Vegetables", fish:"Grilled Fish" })[item] || item;
}
function savePlayerData() {
  try {
    localStorage.setItem(WALLET_KEY, String(wallet));
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment));
    localStorage.setItem(NEEDS_KEY, JSON.stringify(needs));
    return true;
  } catch {
    return false;
  }
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
    (equipment.pants ? itemName(equipment.pants) : "STARTER TROUSERS") + " · " +
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
    quantity.textContent = "Owned · " + count + (Object.values(equipment).includes(item) ? " · EQUIPPED" : "");
    info.append(name, quantity);
    const action = document.createElement("button");
    action.className = "inventory-action";
    const consumable = ["meal","water","medkit","fruit","rice","vegetables","fish"].includes(item);
    action.textContent = consumable ? "USE" : (Object.values(equipment).includes(item) ? "REMOVE" : "WEAR");
    action.addEventListener("click", () => {
      if (consumable) {
        inventory[item] = Math.max(0, (inventory[item] || 0) - 1);
        if (["meal","rice","fish"].includes(item)) {
          const energy = item === "rice" ? 24 : item === "fish" ? 20 : 18;
          needs.energy = Math.min(100, needs.energy + energy);
          window.dispatchEvent(new CustomEvent("cos-restore-energy", { detail: { amount: energy } }));
          window.dispatchEvent(new CustomEvent("cos-restore-health", { detail: { amount: item === "rice" ? 8 : 10 } }));
        }
        if (item === "fruit") { needs.energy = Math.min(100, needs.energy + 12); window.dispatchEvent(new CustomEvent("cos-restore-energy", { detail: { amount: 12 } })); }
        if (item === "vegetables") { needs.energy = Math.min(100, needs.energy + 16); window.dispatchEvent(new CustomEvent("cos-restore-energy", { detail: { amount: 16 } })); }
        if (item === "water") { needs.energy = Math.min(100, needs.energy + 10); window.dispatchEvent(new CustomEvent("cos-restore-energy", { detail: { amount: 10 } })); }
        if (item === "medkit") window.dispatchEvent(new CustomEvent("cos-use-medkit"));
        savePlayerData();
        const needsHud = $("#needs-hud");
        if (needsHud) needsHud.textContent = "HEALTH · ENERGY " + Math.round(needs.energy) + "%";
        $("#inventory-message").textContent = itemName(item) + " used. Health and/or energy restored.";
      } else {
        const slot = ["hoodie","jacket"].includes(item) ? "top" : item === "jeans" ? "pants" : item === "sneakers" ? "shoes" : "";
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
function openShop(store = "corner") {
  loadShopData();
  renderShop();
  const market = store === "market";
  $("#shop-title").innerHTML = market ? 'CITY <em>MARKET.</em>' : 'THE <em>SHOP.</em>';
  $("#shop-intro").textContent = market ? "Fresh food and market supplies from local traders." : "Buy useful supplies, first aid and streetwear.";
  document.querySelectorAll(".shop-item[data-store]").forEach(row => { row.hidden = row.dataset.store !== (market ? "market" : "corner"); });
  $("#shop-message").textContent = market ? "Choose fresh goods from the market stalls." : "Choose an item to buy. Purchases go into your inventory.";
  $("#shop-panel").classList.remove("hidden");
}
function closeShop() { $("#shop-panel").classList.add("hidden"); }
let deliveryJobActive = false;
function openJobs() {
  $("#jobs-message").textContent = deliveryJobActive ? "DELIVERY ACTIVE · Reach the City Market on foot." : "Complete jobs to earn money for supplies and clothes.";
  $("#start-delivery-job-button").textContent = deliveryJobActive ? "IN PROGRESS" : "ACCEPT";
  $("#start-delivery-job-button").disabled = deliveryJobActive;
  $("#jobs-panel").classList.remove("hidden");
}
function closeJobs() { $("#jobs-panel").classList.add("hidden"); }
function startDeliveryJob() {
  if (deliveryJobActive) return;
  deliveryJobActive = true;
  closeJobs();
  window.dispatchEvent(new CustomEvent("cos-start-delivery-job"));
  notify("Delivery accepted. Reach the CITY MARKET on foot to earn ₦120.");
}
function completeDeliveryJob() {
  if (!deliveryJobActive) return;
  deliveryJobActive = false;
  wallet += 120;
  savePlayerData();
  renderShop();
  renderInventory();
  notify("DELIVERY COMPLETE · ₦120 added to your wallet.");
}
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
  document.body.classList.toggle("in-city", screen === $("#city-screen"));
  if (previewReady && renderer) renderer.setAnimationLoop(screen === creatorScreen ? renderPreviewFrame : null);
  if (screen === creatorScreen) {
    requestAnimationFrame(() => resizePreview());
  }
}

const LAYOUT_KEY = "cos-screen-layout-v1";
function applyScreenLayout(layout, requestLock = false) {
  const chosen = layout === "portrait" ? "portrait" : "landscape";
  document.body.classList.toggle("layout-portrait", chosen === "portrait");
  document.body.classList.toggle("layout-landscape", chosen === "landscape");
  try { localStorage.setItem(LAYOUT_KEY, chosen); } catch {}
  $("#layout-landscape-button")?.classList.toggle("active", chosen === "landscape");
  $("#layout-portrait-button")?.classList.toggle("active", chosen === "portrait");
  if (requestLock && screen.orientation && typeof screen.orientation.lock === "function") {
    const fullscreen = document.documentElement.requestFullscreen
      ? document.documentElement.requestFullscreen().catch(() => null) : Promise.resolve(null);
    fullscreen.then(() => screen.orientation.lock(chosen)).catch(() => notify("Layout saved. Rotate your device to " + chosen + " if it does not rotate automatically."));
  }
}
function requestLandscapeMode() {
  let saved = "landscape";
  try { saved = localStorage.getItem(LAYOUT_KEY) || "landscape"; } catch {}
  applyScreenLayout(saved, false);
}

function returnToMainMenu() {
  // Always reveal the original opening screen, even if a game cleanup step fails.
  $("#game-menu-panel").classList.add("hidden");
  $("#jobs-panel").classList.add("hidden");
  deliveryJobActive = false;
  $("#shop-panel").classList.add("hidden");
  $("#inventory-panel").classList.add("hidden");

  const cleanupCity = destroyCity;
  destroyCity = null;

  try {
    if (typeof cleanupCity === "function") cleanupCity();
  } catch (error) {
    console.error("City cleanup failed while returning to the main menu:", error);
  } finally {
    document.body.classList.remove("in-city");
    showScreen(homeScreen);
    updateContinueButton();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}

function loadSavedCharacter() {
  const data = readStoredJSON(STORAGE_KEY, null);
  if (!data || typeof data !== "object" || typeof data.name !== "string" || !data.name.trim()) return null;
  return {
    name: data.name.trim().slice(0,18),
    gender: data.gender === "female" ? "female" : "male",
    age: Number.isFinite(Number(data.age)) ? Math.min(25,Math.max(18,Math.round(Number(data.age)))) : 20,
    skin: ["#6f402d","#965d40","#bd805d","#d49b78"].includes(data.skin) ? data.skin : "#6f402d",
    hair: ["short","afro","shaved"].includes(data.hair) ? data.hair : "short",
    accessories: {
      glasses: data.accessories?.glasses === true,
      chain: data.accessories?.chain === true,
      watch: data.accessories?.watch === true
    }
  };
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
  state.age = Math.min(25, Math.max(18, Number($("#age-input").value) || 20));
  state.name = state.name.slice(0,18);
  return { ...state, accessories: { ...state.accessories } };
}

function fillForm(data) {
  const safe = data && typeof data === "object" ? data : {};
  Object.assign(state, {
    name: typeof safe.name === "string" ? safe.name.slice(0,18) : "",
    gender: safe.gender === "female" ? "female" : "male",
    age: Number.isFinite(Number(safe.age)) ? Math.min(25,Math.max(18,Math.round(Number(safe.age)))) : 20,
    skin: ["#6f402d","#965d40","#bd805d","#d49b78"].includes(safe.skin) ? safe.skin : "#6f402d",
    hair: ["short","afro","shaved"].includes(safe.hair) ? safe.hair : "short",
    accessories: {
      glasses: safe.accessories?.glasses === true,
      chain: safe.accessories?.chain === true,
      watch: safe.accessories?.watch === true
    }
  });
  $("#character-name").value = state.name;
  $("#age-input").value = state.age;
  $("#age-value").textContent = String(state.age);
  setActive("[data-gender]", "data-gender", state.gender);
  setActive("[data-hair]", "data-hair", state.hair);
  setActive("[data-skin]", "data-skin", state.skin);
  document.querySelectorAll("[data-accessory]").forEach(button => {
    const active = state.accessories[button.dataset.accessory] === true;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updateCharacterAppearance();
}

function showSavedCharacter(data) {
  $("#saved-name").textContent = data.name.toUpperCase();
  const accessories = Object.entries(data.accessories || {}).filter(([,active]) => active).map(([name]) => ({glasses:"Glasses",chain:"Gold chain",watch:"Wristwatch"}[name]));
  $("#saved-details").textContent = `${data.gender === "male" ? "Male" : "Female"} · Age ${data.age} · ${data.hair} hairstyle` + (accessories.length ? " · " + accessories.join(", ") : "");
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
  const accessoryGold = new THREE.MeshStandardMaterial({ color: "#d6ad55", metalness: 0.78, roughness: 0.28 });
  const accessoryDark = new THREE.MeshStandardMaterial({ color: "#17191f", metalness: 0.25, roughness: 0.35 });
  if (state.accessories.glasses) {
    addMesh(character, new THREE.TorusGeometry(0.078,0.012,6,20), accessoryDark, [-0.09,2.2,0.218]);
    addMesh(character, new THREE.TorusGeometry(0.078,0.012,6,20), accessoryDark, [0.09,2.2,0.218]);
    addMesh(character, new THREE.BoxGeometry(0.045,0.012,0.014), accessoryDark, [0,2.2,0.218]);
  }
  if (state.accessories.chain) {
    const chain = addMesh(character, new THREE.TorusGeometry(0.18,0.016,6,32), accessoryGold, [0,1.78,0.1]);
    chain.rotation.x = Math.PI / 2;
  }
  if (state.accessories.watch) {
    addMesh(character, new THREE.BoxGeometry(0.13,0.075,0.105), accessoryGold, [-0.49,1.08,0.015]);
    addMesh(character, new THREE.BoxGeometry(0.15,0.035,0.12), accessoryDark, [-0.49,1.08,0.015]);
  }
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
  character.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else object.material.dispose();
    }
  });
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
  const previewIsMobile = window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  renderer.setPixelRatio(previewIsMobile ? 0.7 : Math.min(window.devicePixelRatio || 1, 1));
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
  renderer.setAnimationLoop(renderPreviewFrame);
}

function renderPreviewFrame() {
  if (!renderer || !creatorScreen || creatorScreen.classList.contains("hidden") || document.hidden) return;
  currentRotation += (targetRotation - currentRotation) * 0.08;
  if (character) character.rotation.y = currentRotation;
  renderer.render(scene, camera);
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
  bind("#home-brand-link", "click", event => {
    event.preventDefault();
    requestLandscapeMode();
    returnToMainMenu();
  });
  bind("#game-menu-panel", "click", event => {
    if (event.target.id === "game-menu-panel") $("#game-menu-panel").classList.add("hidden");
  });
  bind("#shop-close-button", "click", closeShop);
  bind("#jobs-close-button", "click", closeJobs);
  bind("#jobs-panel", "click", event => { if (event.target.id === "jobs-panel") closeJobs(); });
  bind("#start-delivery-job-button", "click", startDeliveryJob);
  bind("#inventory-close-button", "click", closeInventory);
  bind("#inventory-panel", "click", event => { if (event.target.id === "inventory-panel") closeInventory(); });
  bind("#game-menu-button", "click", () => {
    $("#game-menu-panel").classList.remove("hidden");
    $("#game-menu-button").setAttribute("aria-expanded", "true");
    let saved = "landscape"; try { saved = localStorage.getItem(LAYOUT_KEY) || "landscape"; } catch {}
    applyScreenLayout(saved, false);
  });
  bind("#game-menu-shop-button", "click", () => { $("#game-menu-panel").classList.add("hidden"); openShop(); });
  bind("#game-menu-jobs-button", "click", () => { $("#game-menu-panel").classList.add("hidden"); openJobs(); });
  bind("#layout-landscape-button", "click", () => applyScreenLayout("landscape", true));
  bind("#layout-portrait-button", "click", () => applyScreenLayout("portrait", true));
  bind("#game-menu-resume-button", "click", () => { $("#game-menu-panel").classList.add("hidden"); $("#game-menu-button").setAttribute("aria-expanded", "false"); });
  bind("#game-menu-inventory-button", "click", () => { $("#game-menu-panel").classList.add("hidden"); $("#game-menu-button").setAttribute("aria-expanded", "false"); openInventory(); });
  bind("#game-menu-home-button", "click", () => {
    returnToMainMenu();
  });
  bind("#shop-panel", "click", event => { if (event.target.id === "shop-panel") closeShop(); });
  document.querySelectorAll(".shop-buy-button").forEach(button => button.addEventListener("click", () => buyShopItem(button)));
  bind("#new-game-button", "click", () => {
    requestLandscapeMode();
    const saved = loadSavedCharacter();
    fillForm({ name: "", gender: "male", age: 20, skin: "#6f402d", hair: "short", accessories: { glasses:false, chain:false, watch:false } });
    showScreen(creatorScreen);
  });

  bind("#continue-button", "click", () => {
    requestLandscapeMode();
    const saved = loadSavedCharacter();
    if (saved) showSavedCharacter(saved);
  });

  bind("#back-home-button", "click", () => { requestLandscapeMode(); returnToMainMenu(); });
  bind("#saved-home-button", "click", () => { requestLandscapeMode(); returnToMainMenu(); });
  bind("#enter-city-button", "click", () => {
    requestLandscapeMode();

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
        destroyCity = createCityGame(cityStage, $("#city-controls"), saved, openShop, openInventory, updatedNeeds => {
          needs = { ...updatedNeeds };
          savePlayerData();
        }, completeDeliveryJob);
      } catch (error) {
        console.error("City could not start:", error);
        cityStage.textContent = "THE CITY COULD NOT LOAD. PLEASE REFRESH AND TRY AGAIN.";
        notify("City loading error: " + (error?.message || "unknown error"));
      }
    });
  });
  bind("#edit-character-button", "click", () => {
    fillForm(loadSavedCharacter() || state);
    showScreen(creatorScreen);
  });
  bind("#save-character-button", "click", saveCharacter);

  bind("#age-input", "input", (event) => {
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
  document.querySelectorAll("[data-accessory]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.accessory;
    if (!Object.prototype.hasOwnProperty.call(state.accessories, key)) return;
    state.accessories[key] = !state.accessories[key];
    button.classList.toggle("selected", state.accessories[key]);
    button.setAttribute("aria-pressed", String(state.accessories[key]));
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
