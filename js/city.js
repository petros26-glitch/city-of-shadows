import * as THREE from "three";

export function createCityGame(container, controls, characterData, onExit, onShopInteract, onInventoryInteract, onNeedsUpdate) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#171923");
  scene.fog = new THREE.Fog("#171923", 22, 95);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 130);
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.replaceChildren(renderer.domElement);
  const shopPrompt = document.createElement("button");
  shopPrompt.type = "button";
  shopPrompt.className = "door-interact-prompt";
  shopPrompt.textContent = "ENTER SHOP";
  shopPrompt.setAttribute("aria-label", "Enter the 24/7 shop");
  shopPrompt.hidden = true;
  shopPrompt.addEventListener("click", () => {
    if (typeof onShopInteract === "function") onShopInteract();
  });
  container.appendChild(shopPrompt);
  const vehiclePrompt = document.createElement("button");
  vehiclePrompt.type = "button"; vehiclePrompt.className = "door-interact-prompt"; vehiclePrompt.textContent = "ENTER VEHICLE"; vehiclePrompt.hidden = true;
  container.appendChild(vehiclePrompt);
  const marketPrompt = document.createElement("button");
  marketPrompt.type = "button";
  marketPrompt.className = "door-interact-prompt";
  marketPrompt.textContent = "BROWSE MARKET";
  marketPrompt.setAttribute("aria-label", "Browse the city market");
  marketPrompt.hidden = true;
  marketPrompt.addEventListener("click", () => {
    if (typeof onShopInteract === "function") onShopInteract();
  });
  container.appendChild(marketPrompt);

  scene.add(new THREE.HemisphereLight(0xc8d4e5, 0x40352e, 2));
  const sun = new THREE.DirectionalLight(0xffd2a0, 1.5);
  sun.position.set(-18, 28, 12);
  scene.add(sun);

  const groundMat = new THREE.MeshStandardMaterial({ color: "#55534e", roughness: 1 });
  const roadMat = new THREE.MeshStandardMaterial({ color: "#24262b", roughness: 1 });
  const pavementMat = new THREE.MeshStandardMaterial({ color: "#77716a", roughness: 1 });
  const lineMat = new THREE.MeshBasicMaterial({ color: "#c5a66c" });
  const buildingMats = ["#62534d", "#76645a", "#4e5358", "#746d61", "#514b50"].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  const windowMat = new THREE.MeshStandardMaterial({ color: "#d6a76b", emissive: "#6b4324", emissiveIntensity: 0.35 });
  const greenMat = new THREE.MeshStandardMaterial({ color: "#344b36" });
  const shopWallMat = new THREE.MeshStandardMaterial({ color: "#3b3433", roughness: 0.9 });
  const shopTrimMat = new THREE.MeshStandardMaterial({ color: "#c79b55", metalness: 0.25, roughness: 0.55 });
  const shopGlassMat = new THREE.MeshStandardMaterial({ color: "#263e49", emissive: "#10212a", metalness: 0.35, roughness: 0.25 });

  function block(geometry, material, x, y, z, parent = scene) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  block(new THREE.PlaneGeometry(180, 180), groundMat, 0, -0.08, 0).rotation.x = -Math.PI / 2;
  block(new THREE.BoxGeometry(15, 0.12, 120), roadMat, 0, 0, 0);
  block(new THREE.BoxGeometry(120, 0.12, 15), roadMat, 0, 0.01, 0);
  block(new THREE.BoxGeometry(2.2, 0.16, 120), pavementMat, -8.6, 0.03, 0);
  block(new THREE.BoxGeometry(2.2, 0.16, 120), pavementMat, 8.6, 0.03, 0);
  block(new THREE.BoxGeometry(120, 0.16, 2.2), pavementMat, 0, 0.04, -8.6);
  block(new THREE.BoxGeometry(120, 0.16, 2.2), pavementMat, 0, 0.04, 8.6);

  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    block(new THREE.BoxGeometry(0.18, 0.025, 3.2), lineMat, 0, 0.075, i * 5);
    block(new THREE.BoxGeometry(3.2, 0.025, 0.18), lineMat, i * 5, 0.08, 0);
  }

  // Small first neighbourhood: varied low-rise shops and homes around two streets.
  const lots = [
    [-17,-17,9,8,8],[-29,-18,8,11,10],[-17,-32,10,7,7],[-31,-34,8,9,8],
    [17,-17,10,10,8],[31,-19,8,8,10],[18,-33,9,7,7],[31,-34,8,10,8],
    [-18,17,9,8,8],[-31,19,8,10,10],[-18,33,10,7,7],[-31,34,8,9,8],
    [18,18,10,9,8],[31,19,8,11,10],[18,34,9,8,7],[31,34,8,8,8]
  ];
  const buildingColliders = lots.map(([x,z,w,h,d]) => ({
    minX:x-w/2, maxX:x+w/2, minZ:z-d/2, maxZ:z+d/2
  }));
  lots.forEach(([x,z,w,h,d], i) => {
    const mat = buildingMats[i % buildingMats.length];
    block(new THREE.BoxGeometry(w,h,d), mat, x, h/2, z);
    block(new THREE.BoxGeometry(w+0.35,0.35,d+0.35), pavementMat, x, h+0.15, z);
    const rows = Math.max(1, Math.floor(h/2.8));
    for (let r=0;r<rows;r++) {
      for (let c=0;c<2;c++) {
        const wx = x + (c ? 1 : -1) * w * 0.23;
        const wz = z + d/2 + 0.012;
        block(new THREE.BoxGeometry(0.85,0.8,0.05), windowMat, wx, 1.6+r*2.25, wz);
      }
    }
    if (i % 4 === 0) {
      const sign = block(new THREE.BoxGeometry(w*0.65,0.55,0.18), lineMat, x, 2.2, z+d/2+0.14);
    }
  });

  // Street trees and simple streetlights. Their trunks and foliage
  // are solid gameplay obstacles, not just decoration.
  const environmentColliders = [];
  for (const [x,z] of [[-10,-20],[10,-20],[-10,20],[10,20],[-10,-38],[10,38]]) {
    block(new THREE.CylinderGeometry(0.18,0.25,2.2,7), pavementMat, x, 1.1, z);
    block(new THREE.SphereGeometry(1.15,8,6), greenMat, x, 2.8, z);
    environmentColliders.push({ x, z, radius: 1.45 });
  }
  for (const [x,z] of [[-7,-14],[7,-14],[-7,14],[7,14]]) {
    block(new THREE.CylinderGeometry(0.07,0.09,4.3,6), lineMat, x, 2.15, z);
    block(new THREE.BoxGeometry(0.8,0.12,0.2), lineMat, x+0.3, 4.2, z);
    environmentColliders.push({ x, z, radius: 0.48 });
  }


  // A clearly marked corner store beside the main road, visible from the starting area.
  const shopDoorPoint = new THREE.Vector3(11.65,1.25,-0.72);
  const shopBuilding = block(new THREE.BoxGeometry(5.4,4.2,5.2), shopWallMat, 13.2,2.1,-3.2);
  block(new THREE.BoxGeometry(5.7,0.28,5.5), shopTrimMat, 13.2,4.28,-3.2);
  block(new THREE.BoxGeometry(1.25,2.35,0.12), shopGlassMat, 11.65,1.2,-0.52);
  block(new THREE.BoxGeometry(1.4,1.15,0.12), shopGlassMat, 14.25,2.15,-0.52);
  block(new THREE.BoxGeometry(4.7,0.78,0.22), shopTrimMat, 13.2,3.35,-0.48);
  const shopSignCanvas = document.createElement("canvas");
  shopSignCanvas.width = 512; shopSignCanvas.height = 128;
  const shopSignContext = shopSignCanvas.getContext("2d");
  shopSignContext.fillStyle = "#171116"; shopSignContext.fillRect(0,0,512,128);
  shopSignContext.fillStyle = "#f5d59a"; shopSignContext.font = "bold 64px Arial";
  shopSignContext.textAlign = "center"; shopSignContext.textBaseline = "middle";
  shopSignContext.fillText("24/7 SHOP",256,66);
  const shopSignTexture = new THREE.CanvasTexture(shopSignCanvas);
  const shopSign = new THREE.Mesh(new THREE.PlaneGeometry(4.45,0.7),new THREE.MeshBasicMaterial({map:shopSignTexture}));
  shopSign.position.set(13.2,3.35,-0.34); scene.add(shopSign);
  block(new THREE.BoxGeometry(5.8,0.12,0.9), pavementMat,13.2,0.08,0.15);
  buildingColliders.push({ minX:10.5, maxX:15.9, minZ:-5.85, maxZ:-0.72 });


  // Expanded street market: compact stalls, produce, canopies and visible shopfront signs.
  const marketColors = ["#a33b32","#d19a38","#557b4b","#496b86"];
  const marketColliders = [];
  function marketStall(x,z,index,label) {
    const color = new THREE.MeshStandardMaterial({ color: marketColors[index % marketColors.length], roughness: 0.9 });
    const wood = new THREE.MeshStandardMaterial({ color: "#68452f", roughness: 1 });
    const produce = new THREE.MeshStandardMaterial({ color: index % 2 ? "#d6a33a" : "#9c3d32", roughness: 0.8 });
    block(new THREE.BoxGeometry(3.2,0.18,1.65),wood,x,1.05,z);
    block(new THREE.BoxGeometry(3.45,0.16,1.9),color,x,2.65,z);
    block(new THREE.BoxGeometry(0.12,1.55,0.12),wood,x-1.48,1.35,z-0.72);
    block(new THREE.BoxGeometry(0.12,1.55,0.12),wood,x+1.48,1.35,z-0.72);
    block(new THREE.BoxGeometry(0.12,1.55,0.12),wood,x-1.48,1.35,z+0.72);
    block(new THREE.BoxGeometry(0.12,1.55,0.12),wood,x+1.48,1.35,z+0.72);
    for(let k=0;k<5;k++) block(new THREE.SphereGeometry(0.19,7,5),produce,x-1.05+(k%3)*0.55,1.28+(k%2)*0.08,z-0.18+Math.floor(k/3)*0.48);
    const signCanvas=document.createElement("canvas"); signCanvas.width=512; signCanvas.height=128;
    const ctx=signCanvas.getContext("2d"); ctx.fillStyle="#171116";ctx.fillRect(0,0,512,128);
    ctx.fillStyle="#f6dfb5";ctx.font="bold 54px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,256,66);
    const texture=new THREE.CanvasTexture(signCanvas);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.65),new THREE.MeshBasicMaterial({map:texture}));
    sign.position.set(x,2.08,z-0.84);scene.add(sign);
    marketColliders.push({minX:x-1.7,maxX:x+1.7,minZ:z-1.0,maxZ:z+1.0});
  }
  marketStall(-18,-6,0,"FRESH FOOD");
  marketStall(-18,0,1,"FRUIT & VEG");
  marketStall(-18,6,2,"MARKET GOODS");
  const marketSignCanvas=document.createElement("canvas");marketSignCanvas.width=768;marketSignCanvas.height=160;
  const marketCtx=marketSignCanvas.getContext("2d");marketCtx.fillStyle="#171116";marketCtx.fillRect(0,0,768,160);
  marketCtx.strokeStyle="#c79b55";marketCtx.lineWidth=8;marketCtx.strokeRect(8,8,752,144);
  marketCtx.fillStyle="#f4d8a5";marketCtx.font="bold 76px Arial";marketCtx.textAlign="center";marketCtx.textBaseline="middle";marketCtx.fillText("CITY MARKET",384,82);
  const marketSign=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(marketSignCanvas)}));
  marketSign.position.set(-18,4.1,8.8);scene.add(marketSign);
  buildingColliders.push(...marketColliders);
  const marketDoorPoint = new THREE.Vector3(-15.7,1.2,0);

  // Lightweight low-poly vehicles share one builder for parked cars and moving traffic.
  const vehicles = [];
  const trafficCars = [];
  const vehicleMaterials=["#8b252c","#263b50","#b18a42"].map(color=>new THREE.MeshStandardMaterial({color,roughness:0.72}));
  const tyreMaterial=new THREE.MeshStandardMaterial({color:"#111216",roughness:1});
  function buildCar(x,z,index,rotation=0){
    const car=new THREE.Group();
    const paint=vehicleMaterials[index%vehicleMaterials.length];
    block(new THREE.BoxGeometry(2.15,0.68,4.0),paint,0,0.68,0,car);
    block(new THREE.BoxGeometry(1.72,0.7,1.9),shopGlassMat,0,1.32,-0.15,car);
    for(const side of [-1,1])for(const end of [-1,1]){
      const wheel=block(new THREE.CylinderGeometry(0.34,0.34,0.2,8),tyreMaterial,side*1.08,0.43,end*1.28,car);
      wheel.rotation.z=Math.PI/2;
    }
    car.position.set(x,0,z);car.rotation.y=rotation;scene.add(car);
    return car;
  }
  function parkedCar(x,z,index,rotation=0){
    const car=buildCar(x,z,index,rotation); vehicles.push({car,drivable:true});
    environmentColliders.push({x,z,radius:1.55,vehicle:car});
  }
  parkedCar(3.2,11.4,0,0);
  parkedCar(27.2,5.0,1,Math.PI/2);
  parkedCar(-28.0,7.0,2,Math.PI/2);
  // Traffic loops around the two main roads. Cars are simple, light and non-blocking props.
  for(let i=0;i<4;i++){
    const horizontal=i<2, lane=i%2===0?2.5:-2.5, start=-48+i*19;
    const car=buildCar(horizontal?start:lane, horizontal?lane:start, (i+1)%3, horizontal?Math.PI/2:0);
    const direction=i%2===0?1:-1;
    if(direction<0) car.rotation.y += Math.PI;
    trafficCars.push({car,horizontal,lane,speed:i%2===0?2.6:3.2,direction});
  }

  const skin = new THREE.MeshStandardMaterial({ color: characterData?.skin || "#6f402d" });
  const equippedTop = ["hoodie","jacket"].includes(characterData?.equipment?.top);
  const equippedShoes = characterData?.equipment?.shoes === "sneakers";
  const shirt = new THREE.MeshStandardMaterial({ color: characterData?.equipment?.top === "jacket" ? "#343b45" : equippedTop ? "#7b2630" : (characterData?.gender === "female" ? "#55242c" : "#292a31") });
  const pants = new THREE.MeshStandardMaterial({ color: characterData?.equipment?.pants === "jeans" ? "#263d61" : "#17191f" });
  const shoes = new THREE.MeshStandardMaterial({ color: "#08090c", roughness: 0.72 });
  const playerShoes = new THREE.MeshStandardMaterial({ color: equippedShoes ? "#e0ded8" : "#08090c", roughness: 0.72 });
  const hair = new THREE.MeshStandardMaterial({ color: "#171116" });

  function makeHumanoid(group, shirtMaterial, skinMaterial, trouserMaterial, shoeMaterial, hairMaterial, hairStyle = "short") {
    const body = block(new THREE.CapsuleGeometry(0.34,0.7,4,8), shirtMaterial, 0,1.35,0,group);
    const neck = block(new THREE.CylinderGeometry(0.12,0.14,0.22,8), skinMaterial, 0,1.86,0,group);
    const head = block(new THREE.SphereGeometry(0.24,10,8), skinMaterial, 0,2.08,0,group);
    const cap = block(new THREE.SphereGeometry(0.25,9,7), hairMaterial, 0,2.24,0,group);
    cap.scale.y = hairStyle === "afro" ? 1.05 : 0.7;
    cap.scale.x = hairStyle === "afro" ? 1.2 : 1;
    cap.visible = hairStyle !== "shaved";
    const arms=[], legs=[];
    for (const side of [-1,1]) {
      const arm = new THREE.Group();
      arm.position.set(side*0.43,1.68,0);
      group.add(arm);
      block(new THREE.CapsuleGeometry(0.085,0.48,3,7),shirtMaterial,0,-0.32,0,arm);
      block(new THREE.SphereGeometry(0.095,8,6),skinMaterial,0,-0.65,0.015,arm);
      arms.push(arm);

      const leg = new THREE.Group();
      leg.position.set(side*0.17,0.83,0);
      group.add(leg);
      block(new THREE.CapsuleGeometry(0.105,0.48,3,7),trouserMaterial,0,-0.29,0,leg);
      block(new THREE.BoxGeometry(0.22,0.13,0.38),shoeMaterial,0,-0.61,0.07,leg);
      legs.push(leg);
    }
    return { body, head, arms, legs };
  }

  const player = new THREE.Group();
  const playerParts = makeHumanoid(player,shirt,skin,pants,playerShoes,hair,characterData?.hair || "short");
  const equipmentChanged = event => {
    const current = event.detail || {};
    shirt.color.set(current.top === "jacket" ? "#343b45" : current.top === "hoodie" ? "#7b2630" : (characterData?.gender === "female" ? "#55242c" : "#292a31"));
    pants.color.set(current.pants === "jeans" ? "#263d61" : "#17191f");
    playerShoes.color.set(current.shoes === "sneakers" ? "#e0ded8" : "#08090c");
  };
  window.addEventListener("cos-equipment-changed", equipmentChanged);
  scene.add(player);
  player.position.set(0,0,4);

  // Lightweight pedestrians give the first neighbourhood everyday street activity.
  const pedestrianMaterials = [
    new THREE.MeshStandardMaterial({ color:"#31506a" }),
    new THREE.MeshStandardMaterial({ color:"#7b4a2d" }),
    new THREE.MeshStandardMaterial({ color:"#4c5940" }),
    new THREE.MeshStandardMaterial({ color:"#6c3540" })
  ];
  const pedestrianSkin = new THREE.MeshStandardMaterial({ color:"#895b43" });
  const pedestrians = [];
  const pedestrianRadius = 0.62;
  const playerRadius = 0.58;
  const pedestrianRoutes = [
    { a:[-5, -5], b:[-5, 5], speed:0.72 },
    { a:[5, 5], b:[5, -5], speed:0.62 },
    { a:[-5, 10], b:[5, 10], speed:0.55 },
    { a:[10, 5], b:[10, -5], speed:0.66 },
    { a:[-10, 5], b:[-10, -5], speed:0.58 },
    { a:[5, -10], b:[-5, -10], speed:0.52 }
  ];
  pedestrianRoutes.forEach((route,index) => {
    const npc = new THREE.Group();
    const parts = makeHumanoid(npc, pedestrianMaterials[index % pedestrianMaterials.length], pedestrianSkin, pants, shoes, hair);
    npc.position.set(route.a[0],0,route.a[1]);
    npc.rotation.y = Math.atan2(route.b[0]-route.a[0], route.b[1]-route.a[1]);
    scene.add(npc);
    pedestrians.push({ npc, parts, route, progress:0, direction:1, phase:index*1.7, radius:pedestrianRadius, health:100, alive:true });
  });

  // A living sparring opponent with a complete low-poly body.
  const opponent = new THREE.Group();
  const opponentMat = new THREE.MeshStandardMaterial({ color: "#8e3438" });
  const opponentSkin = new THREE.MeshStandardMaterial({ color: "#80513b" });
  const opponentParts = makeHumanoid(opponent,opponentMat,opponentSkin,pants,shoes,hair);
  const opponentTorso = opponentParts.body;
  opponent.position.set(0,0,6.5);
  scene.add(opponent);
  let opponentHealth = 100;
  let playerHealth = 100;
  const survival = { hunger: characterData?.needs?.hunger ?? 100, hydration: characterData?.needs?.hydration ?? 100, energy: characterData?.needs?.energy ?? 100 };
  let needsClock = 0;
  const initialNeedsHud = document.querySelector("#needs-hud");
  if (initialNeedsHud) initialNeedsHud.textContent = `HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
  let attackCooldown = 0;
  let opponentAttackCooldown = 0;
  let dodgeTime = 0;
  let dodgeDistance = 0;
  let dodgeDirX = 0;
  let dodgeDirZ = 1;
  let opponentFlash = 0;
  let walkClock = 0;

  // Floating opponent health bar, rendered as a lightweight canvas sprite.
  const healthCanvas = document.createElement("canvas");
  healthCanvas.width = 256;
  healthCanvas.height = 80;
  const healthContext = healthCanvas.getContext("2d");
  const healthTexture = new THREE.CanvasTexture(healthCanvas);
  const healthSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: healthTexture, transparent: true, depthTest: false
  }));
  healthSprite.scale.set(2.35, 0.74, 1);
  healthSprite.position.set(0, 3.05, 0);
  opponent.add(healthSprite);
  function updateOpponentHealthBar() {
    const ctx = healthContext;
    ctx.clearRect(0, 0, 256, 80);
    ctx.fillStyle = "rgba(8,10,14,0.88)";
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 64, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText("OPPONENT", 128, 34);
    ctx.fillStyle = "#35383e";
    ctx.fillRect(28, 46, 200, 13);
    ctx.fillStyle = opponentHealth > 25 ? "#35c46a" : "#e34b4b";
    ctx.fillRect(28, 46, 200 * (opponentHealth / 100), 13);
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(opponentHealth + "%", 128, 68);
    healthTexture.needsUpdate = true;
  }
  updateOpponentHealthBar();
  let playerAttackTime = 0;
  let playerAttackSide = 1;
  let playerKickTime = 0;
  let blockHeld = false;
  let opponentPunchTime = 0;
  let opponentPunchSide = 1;
  let opponentHitReaction = 0;

  const keys = new Set();
  const openInventory = () => {
    if (typeof onInventoryInteract === "function") onInventoryInteract();
  };
  const inventoryKey = e => {
    if (e.key.toLowerCase() === "i" && !e.repeat) {
      e.preventDefault();
      openInventory();
    }
  };
  window.addEventListener("keydown", inventoryKey);
  let joystick = { x: 0, y: 0 };
  let driveJoystick = { x: 0, y: 0 };
  let drivingVehicle = null;
  let driveForward = false, driveReverse = false;
  const driveControls = controls.querySelector(".drive-controls");
  const driveForwardButton = controls.querySelector(".drive-forward");
  const driveReverseButton = controls.querySelector(".drive-reverse");
  const driveExitButton = controls.querySelector(".drive-exit");
  const driveJoy = controls.querySelector(".drive-joystick");
  const driveKnob = controls.querySelector(".drive-joystick-knob");
  function setDriving(active, vehicle = null) {
    drivingVehicle = active ? vehicle : null;
    if (driveControls) driveControls.classList.toggle("active", active);
    const cityControls = document.querySelector("#city-controls");
    if (cityControls) cityControls.classList.toggle("driving-mode", active);
    if (vehiclePrompt) vehiclePrompt.hidden = active;
    player.visible = !active;
    driveForward = false; driveReverse = false;
    driveJoystick = { x: 0, y: 0 };
    driveKnob.style.transform = "translate(0,0)";
    if (active) controls.querySelector("#combat-readout").textContent = "DRIVING · JOYSTICK / A-D TO STEER · HOLD ACCELERATE OR REVERSE";
    else controls.querySelector("#combat-readout").textContent = "ON FOOT · PUNCH · KICK · BLOCK · DODGE";
  }
  function enterNearestVehicle() {
    if (drivingVehicle) return;
    let nearest = null, distance = 8.5;
    for (const entry of vehicles) {
      const d = Math.hypot(player.position.x-entry.car.position.x, player.position.z-entry.car.position.z);
      if (d < distance) { nearest = {car:entry.car,traffic:false}; distance = d; }
    }
    for (const entry of trafficCars) {
      if (entry.hijacked) continue;
      const d = Math.hypot(player.position.x-entry.car.position.x, player.position.z-entry.car.position.z);
      if (d < distance) { nearest = {car:entry.car,traffic:true,trafficEntry:entry}; distance = d; }
    }
    if (!nearest) return;
    if (nearest.traffic) {
      nearest.trafficEntry.hijacked = true;
      vehicles.push({car:nearest.car,drivable:true,hijacked:true});
      environmentColliders.push({x:nearest.car.position.x,z:nearest.car.position.z,radius:1.55,vehicle:nearest.car});
    }
    player.position.set(nearest.car.position.x,0,nearest.car.position.z-2.7);
    setDriving(true,nearest.car);
  }
  function exitVehicle() {
    if (!drivingVehicle) return;
    const car = drivingVehicle;
    const side = new THREE.Vector3(Math.cos(car.rotation.y),0,-Math.sin(car.rotation.y));
    const candidates = [side.clone().multiplyScalar(2.7), side.clone().multiplyScalar(-2.7), new THREE.Vector3(0,0,3.2), new THREE.Vector3(0,0,-3.2)];
    const isBlocked = position => {
      if (Math.abs(position.x)>42 || Math.abs(position.z)>42) return true;
      if (buildingColliders.some(b=>position.x+playerRadius>b.minX&&position.x-playerRadius<b.maxX&&position.z+playerRadius>b.minZ&&position.z-playerRadius<b.maxZ)) return true;
      if (environmentColliders.some(o=>Math.hypot(position.x-o.x,position.z-o.z)<o.radius+playerRadius)) return true;
      if (vehicles.some(v=>v.car!==car&&Math.hypot(position.x-v.car.position.x,position.z-v.car.position.z)<2.8)) return true;
      if (trafficCars.some(t=>t.car!==car&&!t.hijacked&&Math.hypot(position.x-t.car.position.x,position.z-t.car.position.z)<2.8)) return true;
      if (pedestrians.some(p=>p.alive&&Math.hypot(position.x-p.npc.position.x,position.z-p.npc.position.z)<playerRadius+p.radius)) return true;
      return Math.hypot(position.x-opponent.position.x,position.z-opponent.position.z)<playerRadius+0.62;
    };
    const safe = candidates.map(offset=>car.position.clone().add(offset)).find(position=>!isBlocked(position));
    if (!safe) {
      const readout=controls.querySelector("#combat-readout");
      if(readout)readout.textContent="CANNOT EXIT HERE · MOVE THE VEHICLE TO CLEAR SPACE";
      return;
    }
    player.position.copy(safe);
    player.position.y=0;
    setDriving(false);
  }
  vehiclePrompt.addEventListener("click",enterNearestVehicle);
  function bindPedal(button, setter) {
    if (!button) return;
    const down=e=>{e.preventDefault();e.stopPropagation();try{button.setPointerCapture(e.pointerId);}catch{}setter(true);button.classList.add("pressed");};
    const up=()=>{setter(false);button.classList.remove("pressed");};
    button.addEventListener("pointerdown",down); button.addEventListener("pointerup",up);
    button.addEventListener("pointercancel",up); button.addEventListener("lostpointercapture",up);
    return ()=>{button.removeEventListener("pointerdown",down);button.removeEventListener("pointerup",up);button.removeEventListener("pointercancel",up);button.removeEventListener("lostpointercapture",up);};
  }
  const unbindForward=bindPedal(driveForwardButton,v=>driveForward=v);
  const unbindReverse=bindPedal(driveReverseButton,v=>driveReverse=v);
  if(driveExitButton)driveExitButton.addEventListener("click",exitVehicle);
  let sprint = false;
  let cameraAngle = 0;
  let dragging = false;
  let lastX = 0;
  let animationId = 0;
  let previous = 0;

  const keyDown = e => {
    const key = e.key.toLowerCase();
    if (key === "e" && !e.repeat) { e.preventDefault(); if (drivingVehicle) exitVehicle(); else enterNearestVehicle(); }
    if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","shift","m"].includes(key)) {
      keys.add(key);
      if (key.startsWith("arrow") || key === " ") e.preventDefault();
    }
  };
  const keyUp = e => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown",keyDown);
  window.addEventListener("keyup",keyUp);
  const joy = controls.querySelector(".joystick");
  const knob = controls.querySelector(".joystick-knob");
  let joyPointer = null;
  function joyStart(e) {
    e.preventDefault(); e.stopPropagation();
    if (joyPointer !== null) return;
    joyPointer = e.pointerId;
    try { joy.setPointerCapture(joyPointer); } catch {}
    joyMove(e);
  }
  function joyMove(e) {
    if (joyPointer !== e.pointerId) return;
    e.preventDefault(); e.stopPropagation();
    const rect=joy.getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    let dx=e.clientX-cx, dy=e.clientY-cy, len=Math.hypot(dx,dy), max=rect.width*0.34;
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    joystick={x:dx/max,y:dy/max};
    knob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  function joyEnd(e) {
    if (joyPointer !== e.pointerId) return;
    joyPointer = null;
    joystick = { x: 0, y: 0 };
    knob.style.transform = "translate(0,0)";
  }
  joy.addEventListener("pointerdown",joyStart);
  window.addEventListener("pointermove",joyMove,{passive:false});
  window.addEventListener("pointerup",joyEnd);
  window.addEventListener("pointercancel",joyEnd);
  let driveJoyPointer=null;
  function driveJoyStart(e){
    e.preventDefault();e.stopPropagation();if(driveJoyPointer!==null)return;
    driveJoyPointer=e.pointerId;try{driveJoy.setPointerCapture(e.pointerId);}catch{}driveJoyMove(e);
  }
  function driveJoyMove(e){
    if(driveJoyPointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();
    const rect=driveJoy.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),max=rect.width*.34;
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    driveJoystick={x:dx/max,y:dy/max};driveKnob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  function driveJoyEnd(e){
    if(driveJoyPointer!==e.pointerId)return;driveJoyPointer=null;driveJoystick={x:0,y:0};driveKnob.style.transform="translate(0,0)";
  }
  driveJoy.addEventListener("pointerdown",driveJoyStart);
  window.addEventListener("pointermove",driveJoyMove,{passive:false});
  window.addEventListener("pointerup",driveJoyEnd);
  window.addEventListener("pointercancel",driveJoyEnd);
  const attackButton = controls.querySelector(".attack-button");
  const kickButton = controls.querySelector(".kick-button");
  const blockButton = controls.querySelector(".block-button");
  const dodgeButton = controls.querySelector(".dodge-button");
  const runButton = controls.querySelector(".sprint-button");

  function findMeleeTarget(maxRange) {
    const fx=Math.sin(player.rotation.y), fz=Math.cos(player.rotation.y);
    const targets=[...pedestrians.filter(p=>p.alive).map(person=>({kind:"pedestrian",person,npc:person.npc,health:person.health})),...(opponentHealth>0?[{kind:"opponent",npc:opponent,health:opponentHealth}]:[])];
    let best=null;
    for(const target of targets){
      const dx=target.npc.position.x-player.position.x, dz=target.npc.position.z-player.position.z;
      const distance=Math.hypot(dx,dz);
      if(distance>maxRange||distance<0.01||((fx*dx+fz*dz)/distance)<0.15)continue;
      if(!best||distance<best.distance)best={...target,distance};
    }
    return best;
  }
  function hitMeleeTarget(target,damage,kind){
    if(!target)return false;
    const hp=Math.max(0,target.health-damage);
    if(target.kind==="opponent"){
      opponentHealth=hp; updateOpponentHealthBar();
      opponentHitReaction=kind==="kick"?0.3:0.22; opponentFlash=kind==="kick"?0.18:0.16;
      opponentTorso.material.color.set("#f3c0a5");
      controls.querySelector("#combat-readout").textContent=hp>0?kind.toUpperCase()+" CONNECTED · OPPONENT "+hp+"%":"OPPONENT DEFEATED · 0% HEALTH";
    }else{
      const p=target.person; p.health=hp;
      p.parts.body.material.color.set("#f3c0a5");
      p.npc.rotation.y=Math.atan2(player.position.x-p.npc.position.x,player.position.z-p.npc.position.z);
      if(hp<=0){
        p.alive=false; p.npc.rotation.x=-0.95;
        p.parts.legs.forEach(leg=>leg.rotation.x=1.1);
        p.parts.arms.forEach(arm=>arm.rotation.x=-0.8);
        controls.querySelector("#combat-readout").textContent="PEDESTRIAN DEFEATED";
      }else controls.querySelector("#combat-readout").textContent=kind.toUpperCase()+" HIT · PEDESTRIAN "+hp+"%";
    }
    return true;
  }
  function attack(e){
    e.preventDefault();e.stopPropagation();if(attackCooldown>0)return;
    attackButton.classList.add("pressed");attackCooldown=0.48;playerAttackTime=0.34;playerAttackSide=playerAttackSide===0?1:0;
    if(!hitMeleeTarget(findMeleeTarget(3.35),20,"punch"))controls.querySelector("#combat-readout").textContent="PUNCH MISSED · FACE A PERSON AND GET CLOSER";
    setTimeout(()=>attackButton.classList.remove("pressed"),140);
  }
  function kick(e){
    e.preventDefault();e.stopPropagation();if(attackCooldown>0)return;
    kickButton.classList.add("pressed");attackCooldown=0.72;playerKickTime=0.48;
    if(!hitMeleeTarget(findMeleeTarget(3.8),35,"kick"))controls.querySelector("#combat-readout").textContent="KICK MISSED · FACE A PERSON AND GET CLOSER";
    setTimeout(()=>kickButton.classList.remove("pressed"),180);
  }

  function runStart(e) {
    e.preventDefault(); e.stopPropagation(); sprint = true; runButton.classList.add("pressed");
  }
  function runEnd() { sprint = false; runButton.classList.remove("pressed"); }

  function blockStart(e) {
    e.preventDefault();
    e.stopPropagation();
    blockHeld = true;
    blockButton.classList.add("pressed");
    controls.querySelector("#combat-readout").textContent = "BLOCKING · HOLD TO DEFEND";
  }
  function blockEnd() {
    blockHeld = false;
    blockButton.classList.remove("pressed");
  }

  function dodge(e) {
    e.preventDefault();
    e.stopPropagation();
    let moveX = joystick.x
      + (keys.has("d") || keys.has("arrowright") ? 1 : 0)
      - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    let moveZ = joystick.y
      + (keys.has("s") || keys.has("arrowdown") ? 1 : 0)
      - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    const inputLength = Math.hypot(moveX, moveZ);
    if (inputLength > 0.08) {
      moveX /= inputLength;
      moveZ /= inputLength;
      const sin = Math.sin(cameraAngle), cos = Math.cos(cameraAngle);
      dodgeDirX = moveX * cos + moveZ * sin;
      dodgeDirZ = -moveX * sin + moveZ * cos;
    } else {
      dodgeDirX = Math.sin(player.rotation.y);
      dodgeDirZ = Math.cos(player.rotation.y);
    }
    dodgeTime = 0.28;
    dodgeDistance = 2.2;
    dodgeButton.classList.add("pressed");
    setTimeout(() => dodgeButton.classList.remove("pressed"), 260);
  }

  attackButton.addEventListener("pointerdown", attack);
  kickButton.addEventListener("pointerdown", kick);
  blockButton.addEventListener("pointerdown", blockStart);
  blockButton.addEventListener("pointerup", blockEnd);
  blockButton.addEventListener("pointercancel", blockEnd);
  blockButton.addEventListener("lostpointercapture", blockEnd);
  dodgeButton.addEventListener("pointerdown", dodge);
  runButton.addEventListener("pointerdown", runStart);
  runButton.addEventListener("pointerup", runEnd);
  runButton.addEventListener("pointercancel", runEnd);
  runButton.addEventListener("lostpointercapture", runEnd);

  const stage = renderer.domElement;
  let cameraPointerId = null;

  // Drag directly on the 3D view to look around. The joystick and RUN
  // controls keep their own pointer, so they can be used simultaneously.
  function cameraDragStart(e) {
    if (e.target !== stage) return;
    if (cameraPointerId !== null) return;
    cameraPointerId = e.pointerId;
    dragging = true;
    lastX = e.clientX;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  }
  function cameraDragMove(e) {
    if (!dragging || e.pointerId !== cameraPointerId) return;
    cameraAngle -= (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
  }
  function cameraDragEnd(e) {
    if (e.pointerId !== cameraPointerId) return;
    dragging = false;
    cameraPointerId = null;
  }
  stage.addEventListener("pointerdown", cameraDragStart);
  stage.addEventListener("pointermove", cameraDragMove);
  stage.addEventListener("pointerup", cameraDragEnd);
  stage.addEventListener("pointercancel", cameraDragEnd);

  function resize(){
    const w=Math.max(container.clientWidth,1),h=Math.max(container.clientHeight,1);
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  }
  const observer=new ResizeObserver(resize); observer.observe(container); resize();

  function loop(time){
    animationId=requestAnimationFrame(loop);
    const dt=Math.min((time-previous)/1000||0,0.05);previous=time;
    const inventoryOpen = !document.querySelector("#inventory-panel").classList.contains("hidden");
    const shopOpen = !document.querySelector("#shop-panel").classList.contains("hidden");
    const gameMenuOpen = !document.querySelector("#game-menu-panel").classList.contains("hidden");
    if (inventoryOpen || shopOpen || gameMenuOpen) {
      renderer.render(scene,camera);
      return;
    }
    // Ambient traffic keeps moving even while the player is driving.
    trafficCars.forEach(t=>{
      if(t.hijacked || (drivingVehicle && t.car===drivingVehicle)) return;
      const axis=t.horizontal?"x":"z";
      t.car.position[axis]+=t.speed*t.direction*dt;
      if(t.car.position[axis]>52)t.car.position[axis]=-52;
      if(t.car.position[axis]<-52)t.car.position[axis]=52;
    });
    const moving = Math.hypot(joystick.x,joystick.y)>0.08 || ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].some(key=>keys.has(key));
    const fast = sprint||keys.has("shift")||keys.has("m");
    needsClock += dt;
    if (needsClock >= 5) {
      const elapsed = needsClock; needsClock = 0;
      survival.hunger = Math.max(0, survival.hunger - elapsed * 0.16);
      survival.hydration = Math.max(0, survival.hydration - elapsed * 0.23);
      survival.energy = Math.max(0, Math.min(100, survival.energy + (drivingVehicle ? elapsed * 0.25 : moving ? (fast ? -elapsed * 1.7 : elapsed * 0.18) : elapsed * 1.1)));
      if (typeof onNeedsUpdate === "function") onNeedsUpdate({ ...survival });
      const needsHud = document.querySelector("#needs-hud");
      if (needsHud) needsHud.textContent = `HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
    }
    if (drivingVehicle) {
      const car=drivingVehicle;
      const steer=driveJoystick.x+(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
      const analogThrottle=-driveJoystick.y;
      const throttle=Math.abs(analogThrottle)>.18?Math.sign(analogThrottle):(driveForward||keys.has("w")||keys.has("arrowup")?1:0)-(driveReverse||keys.has("s")||keys.has("arrowdown")?1:0);
      if(throttle!==0){
        car.rotation.y += steer*dt*1.05*Math.sign(throttle);
        const velocity=throttle*8.2*dt;
        const nx=THREE.MathUtils.clamp(car.position.x+Math.sin(car.rotation.y)*velocity,-44,44);
        const nz=THREE.MathUtils.clamp(car.position.z+Math.cos(car.rotation.y)*velocity,-44,44);
        const blockedBuilding=buildingColliders.some(b=>nx+1.15>b.minX&&nx-1.15<b.maxX&&nz+2.1>b.minZ&&nz-2.1<b.maxZ);
        const blockedStatic=environmentColliders.some(o=>!o.vehicle&&Math.hypot(nx-o.x,nz-o.z)<o.radius+1.2);
        const blockedParked=vehicles.some(v=>v.car!==car&&Math.hypot(nx-v.car.position.x,nz-v.car.position.z)<3.3);
        const blockedTraffic=trafficCars.some(t=>t.car!==car&&!t.hijacked&&Math.hypot(nx-t.car.position.x,nz-t.car.position.z)<3.3);
        if(!blockedBuilding&&!blockedStatic&&!blockedParked&&!blockedTraffic){car.position.x=nx;car.position.z=nz;}
      }
      const behind=new THREE.Vector3(-Math.sin(car.rotation.y)*8,4.2,-Math.cos(car.rotation.y)*8).add(car.position);
      camera.position.lerp(behind,0.14);camera.lookAt(car.position.x,1.1,car.position.z);
      renderer.render(scene,camera);
      controls.querySelector(".city-status").textContent=throttle>0?"DRIVING FORWARD":throttle<0?"REVERSING":"VEHICLE STOPPED";
      const readout=controls.querySelector("#combat-readout");if(readout)readout.textContent="STEER WITH JOYSTICK · HOLD ▲ TO ACCELERATE · HOLD ▼ TO REVERSE";
      return;
    }
    if (playerHealth <= 0) {
      const readout=controls.querySelector("#combat-readout");
      if(readout)readout.textContent="YOU ARE DOWN · RETURN TO MAIN MENU AND START AGAIN";
      renderer.render(scene,camera);
      return;
    }
    let x=joystick.x+(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
    let z=joystick.y+(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
    const length=Math.hypot(x,z);
    if(length>1){x/=length;z/=length;}
    const moving=length>0.08;
    const fast=sprint||keys.has("shift")||keys.has("m");

    if (survival.energy < 8 && fast) sprint = false;
    attackCooldown = Math.max(0, attackCooldown - dt);
    dodgeTime = Math.max(0, dodgeTime - dt);
    const tiredFactor = survival.energy < 15 ? 0.72 : 1;
    const speed=(fast?7.2:4.2) * tiredFactor * (dodgeTime>0 ? 2.2 : 1);
    const sin=Math.sin(cameraAngle),cos=Math.cos(cameraAngle);
    let dx=(x*cos+z*sin)*speed*dt;
    let dz=(-x*sin+z*cos)*speed*dt;
    if (dodgeTime > 0 && dodgeDistance > 0) {
      const dodgeStep = Math.min(dodgeDistance, 2.2 * dt / 0.28);
      dx += dodgeDirX * dodgeStep;
      dz += dodgeDirZ * dodgeStep;
      dodgeDistance -= dodgeStep;
    }
    // Resolve movement against building footprints. Axis-separated checks
    // allow the player to slide along a wall instead of passing through it.
    const nextX = THREE.MathUtils.clamp(player.position.x+dx,-42,42);
    const nextZ = THREE.MathUtils.clamp(player.position.z+dz,-42,42);
    const radius = playerRadius;
    const blockedByPedestrianX = pedestrians.some(person => person.alive &&
      Math.hypot(nextX-person.npc.position.x, player.position.z-person.npc.position.z) < radius + person.radius
    );
    const blockedByOpponentX = Math.hypot(nextX-opponent.position.x, player.position.z-opponent.position.z) < radius + 0.62;
    const blockedBuildingX = buildingColliders.some(b =>
      nextX+radius>b.minX && nextX-radius<b.maxX &&
      player.position.z+radius>b.minZ && player.position.z-radius<b.maxZ
    );
    const blockedTreeX = environmentColliders.some(o =>
      Math.hypot(nextX-o.x, player.position.z-o.z) < o.radius + radius
    );
    if (!blockedBuildingX && !blockedTreeX && !blockedByPedestrianX && !blockedByOpponentX) player.position.x=nextX;
    const blockedByPedestrianZ = pedestrians.some(person => person.alive &&
      Math.hypot(player.position.x-person.npc.position.x, nextZ-person.npc.position.z) < radius + person.radius
    );
    const blockedByOpponentZ = Math.hypot(player.position.x-opponent.position.x, nextZ-opponent.position.z) < radius + 0.62;
    const blockedBuildingZ = buildingColliders.some(b =>
      player.position.x+radius>b.minX && player.position.x-radius<b.maxX &&
      nextZ+radius>b.minZ && nextZ-radius<b.maxZ
    );
    const blockedTreeZ = environmentColliders.some(o =>
      Math.hypot(player.position.x-o.x, nextZ-o.z) < o.radius + radius
    );
    if (!blockedBuildingZ && !blockedTreeZ && !blockedByPedestrianZ && !blockedByOpponentZ) player.position.z=nextZ;
    if(moving) player.rotation.y=Math.atan2(dx,dz);

    // Animate arms and legs while walking or running.
    if (moving) walkClock += dt * (fast ? 12 : 8);
    const swing = moving ? Math.sin(walkClock)*0.55 : 0;
    playerParts.arms[0].rotation.x = swing;
    playerParts.arms[1].rotation.x = -swing;
    playerParts.legs[0].rotation.x = -swing;
    playerParts.legs[1].rotation.x = swing;

    // Punches and kicks use separate, readable limb animations.
    playerAttackTime = Math.max(0, playerAttackTime - dt);
    if (playerAttackTime > 0) {
      const punchProgress = 1 - playerAttackTime / 0.34;
      const punch = Math.sin(punchProgress * Math.PI);
      const punchExtension = punchProgress < 0.28 ? punchProgress / 0.28 : punchProgress > 0.72 ? (1-punchProgress)/0.28 : 1;
      playerParts.arms[playerAttackSide].rotation.x = -0.25 - 1.95 * Math.max(0,punchExtension);
      playerParts.arms[playerAttackSide].rotation.z =
        (playerAttackSide === 0 ? 1 : -1) * 0.2 * punch;
    } else {
      playerParts.arms[0].rotation.z = 0;
      playerParts.arms[1].rotation.z = 0;
    }
    playerKickTime = Math.max(0, playerKickTime - dt);
    if (playerKickTime > 0) {
      const kickProgress = 1 - playerKickTime / 0.48;
      const kickMotion = Math.sin(kickProgress * Math.PI);
      playerParts.legs[playerAttackSide].rotation.x = -0.18 - 1.85 * kickMotion;
      playerParts.arms[0].rotation.x = 0.55 * kickMotion;
      playerParts.arms[1].rotation.x = 0.55 * kickMotion;
    }
    if (blockHeld) {
      playerParts.arms[0].rotation.x = -1.05;
      playerParts.arms[1].rotation.x = -1.05;
    }

    // Pedestrians walk along short street routes and turn around at each end.
    pedestrians.forEach(person => {
      if (!person.alive) return;
      const route = person.route;
      const start = person.direction > 0 ? route.a : route.b;
      const end = person.direction > 0 ? route.b : route.a;
      const vx = end[0] - start[0], vz = end[1] - start[1];
      const distance = Math.hypot(vx,vz) || 1;
      const nextProgress = Math.min(1, person.progress + route.speed * dt / distance);
      const nextFrom = person.direction > 0 ? route.a : route.b;
      const nextTo = person.direction > 0 ? route.b : route.a;
      const nextNpcX = THREE.MathUtils.lerp(nextFrom[0],nextTo[0],nextProgress);
      const nextNpcZ = THREE.MathUtils.lerp(nextFrom[1],nextTo[1],nextProgress);
      const playerTooClose = Math.hypot(nextNpcX-player.position.x,nextNpcZ-player.position.z) < person.radius + playerRadius + 0.08;
      const opponentTooClose = Math.hypot(nextNpcX-opponent.position.x,nextNpcZ-opponent.position.z) < person.radius + 0.62;
      if (!playerTooClose && !opponentTooClose) person.progress = nextProgress;
      if (person.progress >= 1) {
        person.progress = 0;
        person.direction *= -1;
      }
      const from = person.direction > 0 ? route.a : route.b;
      const to = person.direction > 0 ? route.b : route.a;
      person.npc.position.x = THREE.MathUtils.lerp(from[0],to[0],person.progress);
      person.npc.position.z = THREE.MathUtils.lerp(from[1],to[1],person.progress);
      person.npc.rotation.y = Math.atan2(to[0]-from[0],to[1]-from[1]);
      const step = Math.sin(time*0.004 + person.phase)*0.32;
      person.parts.legs[0].rotation.x = step;
      person.parts.legs[1].rotation.x = -step;
      person.parts.arms[0].rotation.x = -step*0.55;
      person.parts.arms[1].rotation.x = step*0.55;
    });

    // Opponent AI: notice the player, approach, face them and throw punches.
    const opponentDx = player.position.x-opponent.position.x;
    const opponentDz = player.position.z-opponent.position.z;
    const opponentDistance = Math.hypot(opponentDx,opponentDz);
    if (playerHealth > 0 && opponentHealth > 0 && opponentDistance < 15) {
      opponent.rotation.y = Math.atan2(opponentDx,opponentDz);
      if (opponentDistance > 1.65) {
        const approach = Math.min(2.15*dt, opponentDistance-1.55);
        const ox = opponent.position.x + (opponentDx/opponentDistance)*approach;
        const oz = opponent.position.z + (opponentDz/opponentDistance)*approach;
        const opponentBlockedByBuilding = buildingColliders.some(b =>
          ox+0.5>b.minX && ox-0.5<b.maxX && oz+0.5>b.minZ && oz-0.5<b.maxZ
        );
        const opponentBlockedByTree = environmentColliders.some(o =>
          Math.hypot(ox-o.x, oz-o.z) < o.radius + 0.5
        );
        const opponentBlocked = opponentBlockedByBuilding || opponentBlockedByTree;
        if (!opponentBlocked) {
          opponent.position.x=ox;
          opponent.position.z=oz;
          const step = Math.sin(time*0.009)*0.38;
          opponentParts.legs[0].rotation.x=step;
          opponentParts.legs[1].rotation.x=-step;
          opponentParts.arms[0].rotation.x=-step*0.6;
          opponentParts.arms[1].rotation.x=step*0.6;
        }
      } else {
        opponentAttackCooldown=Math.max(0,opponentAttackCooldown-dt);
        opponentParts.arms[0].rotation.x = 0;
        opponentParts.arms[1].rotation.x = 0;
        opponentPunchTime = Math.max(0, opponentPunchTime - dt);
        if (opponentAttackCooldown===0) {
          opponentAttackCooldown=1.5;
          opponentPunchTime=0.34;
          opponentPunchSide=opponentPunchSide===0?1:0;
          const incomingDamage = blockHeld ? 2 : 8;
          playerHealth=Math.max(0,playerHealth-incomingDamage);
          controls.querySelector("#combat-readout").textContent = playerHealth===0
            ? "YOU ARE DOWN · RESTART THE NEIGHBOURHOOD TO TRY AGAIN"
            : blockHeld
              ? "BLOCKED · REDUCED DAMAGE · YOUR HEALTH " + playerHealth + "%"
              : "OPPONENT PUNCHES YOU · YOUR HEALTH " + playerHealth + "%";
        }
        if (opponentPunchTime > 0) {
          const punch = Math.sin((1-opponentPunchTime/0.34)*Math.PI);
          opponentParts.arms[opponentPunchSide].rotation.x = -1.75*punch;
          opponentParts.arms[opponentPunchSide].rotation.z =
            (opponentPunchSide===0?1:-1)*0.18*punch;
        }
      }
    }
    if (opponentHitReaction > 0) {
      opponentHitReaction = Math.max(0, opponentHitReaction - dt);
      const recoil = Math.sin((opponentHitReaction / 0.3) * Math.PI);
      opponent.position.x -= Math.sin(opponent.rotation.y) * recoil * dt * 2.2;
      opponent.position.z -= Math.cos(opponent.rotation.y) * recoil * dt * 2.2;
      opponent.rotation.x = opponentHealth <= 0 ? -0.72 : -0.16 * recoil;
      opponentParts.arms[0].rotation.x = 0.75 * recoil;
      opponentParts.arms[1].rotation.x = 0.75 * recoil;
      opponentParts.legs[0].rotation.x = -0.25 * recoil;
      opponentParts.legs[1].rotation.x = -0.25 * recoil;
    }
    const desired=new THREE.Vector3(player.position.x+Math.sin(cameraAngle)*7,4.1,player.position.z+Math.cos(cameraAngle)*7);
    camera.position.lerp(desired,0.12);
    camera.lookAt(player.position.x,1.15,player.position.z);

    // Display the shop interaction over the actual doorway when the player is close.
    const shopDistance = Math.hypot(player.position.x-shopDoorPoint.x, player.position.z-shopDoorPoint.z);
    shopPrompt.hidden = shopDistance > 5.2;
    if (!shopPrompt.hidden) {
      const projected = shopDoorPoint.clone().project(camera);
      const rect = container.getBoundingClientRect();
      const px = (projected.x * 0.5 + 0.5) * rect.width;
      const py = (-projected.y * 0.5 + 0.5) * rect.height;
      const onScreen = projected.z > -1 && projected.z < 1 && px > 12 && px < rect.width-12 && py > 12 && py < rect.height-12;
      shopPrompt.hidden = !onScreen;
      if (onScreen) {
        shopPrompt.style.left = px + "px";
        shopPrompt.style.top = py + "px";
      }
    }
    let nearestVehicle=null,nearestVehicleDistance=8.5;
    for(const entry of vehicles){
      const d=Math.hypot(player.position.x-entry.car.position.x,player.position.z-entry.car.position.z);
      if(d<nearestVehicleDistance){nearestVehicle={car:entry.car,traffic:false};nearestVehicleDistance=d;}
    }
    for(const entry of trafficCars){
      if(entry.hijacked)continue;
      const d=Math.hypot(player.position.x-entry.car.position.x,player.position.z-entry.car.position.z);
      if(d<nearestVehicleDistance){nearestVehicle={car:entry.car,traffic:true};nearestVehicleDistance=d;}
    }
    vehiclePrompt.hidden=!nearestVehicle||!!drivingVehicle;
    if(!vehiclePrompt.hidden){
      vehiclePrompt.textContent=nearestVehicle.traffic?"HIJACK MOVING CAR":"ENTER VEHICLE";
      vehiclePrompt.setAttribute("aria-label",nearestVehicle.traffic?"Hijack the nearby moving car":"Enter the nearby parked car");
      const target=nearestVehicle.car;
      const projected=target.position.clone().add(new THREE.Vector3(0,1.8,0)).project(camera),rect=container.getBoundingClientRect();
      const px=(projected.x*.5+.5)*rect.width,py=(-projected.y*.5+.5)*rect.height;
      const onScreen=projected.z>-1&&projected.z<1&&px>12&&px<rect.width-12&&py>12&&py<rect.height-12;
      vehiclePrompt.hidden=!onScreen;if(onScreen){vehiclePrompt.style.left=px+"px";vehiclePrompt.style.top=py+"px";}
    }
    const marketDistance = Math.hypot(player.position.x-marketDoorPoint.x, player.position.z-marketDoorPoint.z);
    marketPrompt.hidden = marketDistance > 5.2;
    if (!marketPrompt.hidden) {
      const projected = marketDoorPoint.clone().project(camera);
      const rect = container.getBoundingClientRect();
      const px = (projected.x * 0.5 + 0.5) * rect.width;
      const py = (-projected.y * 0.5 + 0.5) * rect.height;
      const onScreen = projected.z > -1 && projected.z < 1 && px > 12 && px < rect.width-12 && py > 12 && py < rect.height-12;
      marketPrompt.hidden = !onScreen;
      if (onScreen) { marketPrompt.style.left = px + "px"; marketPrompt.style.top = py + "px"; }
    }
    if (opponentFlash > 0) {
      opponentFlash -= dt;
      if (opponentFlash <= 0) opponentTorso.material.color.set(opponentHealth > 0 ? "#8e3438" : "#333333");
    }
    // Keep the defeated opponent visible at 0%; it stays down for this session.
    if (opponentHealth <= 0) {
      opponent.rotation.x = -0.72;
      opponentParts.legs[0].rotation.x = 1.15;
      opponentParts.legs[1].rotation.x = 1.15;
      opponentParts.arms[0].rotation.x = -0.8;
      opponentParts.arms[1].rotation.x = -0.8;
    }
    opponent.visible = true;
    renderer.render(scene,camera);
    const status=controls.querySelector(".city-status");
    status.textContent=moving?(fast?"RUNNING":"WALKING"):"EXPLORE THE NEIGHBOURHOOD";
  }
  animationId=requestAnimationFrame(loop);

  return function destroy(){
    cancelAnimationFrame(animationId);
    observer.disconnect();
    window.removeEventListener("keydown",keyDown);
    window.removeEventListener("keyup",keyUp);
    window.removeEventListener("keydown",inventoryKey);
    window.removeEventListener("cos-equipment-changed", equipmentChanged);
    if (inventoryButton) inventoryButton.removeEventListener("click", openInventory);
    joy.removeEventListener("pointerdown",joyStart);
    driveJoy.removeEventListener("pointerdown",driveJoyStart);
    window.removeEventListener("pointermove",driveJoyMove);
    window.removeEventListener("pointerup",driveJoyEnd);
    window.removeEventListener("pointercancel",driveJoyEnd);
    window.removeEventListener("pointermove",joyMove);
    window.removeEventListener("pointerup",joyEnd);
    window.removeEventListener("pointercancel",joyEnd);
    blockEnd();
    runEnd();
    runButton.removeEventListener("pointerdown", runStart);
    runButton.removeEventListener("pointerup", runEnd);
    runButton.removeEventListener("pointercancel", runEnd);
    runButton.removeEventListener("lostpointercapture", runEnd);
    attackButton.removeEventListener("pointerdown", attack);
    kickButton.removeEventListener("pointerdown", kick);
    blockButton.removeEventListener("pointerdown", blockStart);
    blockButton.removeEventListener("pointerup", blockEnd);
    blockButton.removeEventListener("pointercancel", blockEnd);
    blockButton.removeEventListener("lostpointercapture", blockEnd);
    dodgeButton.removeEventListener("pointerdown", dodge);
    stage.removeEventListener("pointerdown", cameraDragStart);
    stage.removeEventListener("pointermove", cameraDragMove);
    stage.removeEventListener("pointerup", cameraDragEnd);
    stage.removeEventListener("pointercancel", cameraDragEnd);

    shopPrompt.remove();
    marketPrompt.remove();
    vehiclePrompt.remove();
    if(unbindForward)unbindForward(); if(unbindReverse)unbindReverse();
    if(driveExitButton)driveExitButton.removeEventListener("click",exitVehicle);
    renderer.dispose();
    scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}});
    container.replaceChildren();
  };
}
