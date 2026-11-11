import * as THREE from "three";

export function createCityGame(container, controls, characterData, onShopInteract, onInventoryInteract, onNeedsUpdate, onJobComplete) {
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
  shopPrompt.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onShopInteract === "function") onShopInteract("corner");
  });
  container.appendChild(shopPrompt);
  const vehiclePrompt = document.createElement("button");
  vehiclePrompt.type = "button"; vehiclePrompt.className = "door-interact-prompt"; vehiclePrompt.textContent = "ENTER VEHICLE"; vehiclePrompt.hidden = true;
  container.appendChild(vehiclePrompt);
  const vehicleConditionHud = document.createElement("div");
  vehicleConditionHud.className = "vehicle-condition-hud";
  vehicleConditionHud.hidden = true;
  vehicleConditionHud.innerHTML = '<div class="vehicle-condition-heading"><span>VEHICLE CONDITION</span><strong>100%</strong></div><div class="vehicle-condition-track"><i></i></div><small>ENGINE HEALTH</small>';
  container.appendChild(vehicleConditionHud);
  const marketPrompt = document.createElement("button");
  marketPrompt.type = "button";
  marketPrompt.className = "door-interact-prompt";
  marketPrompt.textContent = "BROWSE MARKET";
  marketPrompt.setAttribute("aria-label", "Browse the city market");
  marketPrompt.hidden = true;
  marketPrompt.addEventListener("click", () => {
    if (typeof onShopInteract === "function") onShopInteract("market");
  });
  container.appendChild(marketPrompt);

  const respawnButton = document.createElement("button");
  respawnButton.type = "button";
  respawnButton.className = "city-respawn-button";
  respawnButton.textContent = "RESPAWN";
  respawnButton.hidden = true;
  respawnButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (playerHealth > 0) return;
    playerHealth = 100;
    player.position.set(0, 0, -3.5);
    player.rotation.set(0, 0, 0);
    joystick = { x: 0, y: 0 };
    keys.clear();
    sprint = false;
    dodgeTime = 0;
    dodgeDistance = 0;
    vehicleHitCooldown = 2.5;
    vehicleHitMessageTime = 0;
    vehicleHitMessage = "";
    attackCooldown = 0;
    blockHeld = false;
    playerAttackTime = 0;
    playerKickTime = 0;
    if (knob) knob.style.transform = "translate(0,0)";
    opponent.position.set(0, 0, 6.5);
    opponentAttackCooldown = 4;
    opponentPunchTime = 0;
    const healthHud = document.querySelector("#needs-hud");
    if (healthHud) healthHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
    const readout = controls.querySelector("#combat-readout");
    if (readout) readout.textContent = "YOU'RE BACK · KEEP AN EYE ON TRAFFIC";
    const status = controls.querySelector(".city-status");
    if (status) status.textContent = "RESPAWNED · KEEP EXPLORING";
    respawnButton.hidden = true;
  });
  controls.appendChild(respawnButton);

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
  const shopDoorPoint = new THREE.Vector3(12.05,1.25,-0.72);
  // Build the store from separate walls so the front entrance is a real opening,
  // not merely a gap in the invisible collision rectangle.
  block(new THREE.BoxGeometry(5.4,4.2,0.35),shopWallMat,13.2,2.1,-5.625);
  block(new THREE.BoxGeometry(0.35,4.2,4.9),shopWallMat,10.575,2.1,-3.2);
  block(new THREE.BoxGeometry(0.35,4.2,4.9),shopWallMat,15.825,2.1,-3.2);
  block(new THREE.BoxGeometry(1.0,4.2,0.35),shopWallMat,10.8,2.1,-0.775);
  block(new THREE.BoxGeometry(3.3,4.2,0.35),shopWallMat,14.45,2.1,-0.775);
  block(new THREE.BoxGeometry(5.4,0.35,5.2),shopWallMat,13.2,4.025,-3.2);
  // Keep the front doorway physically open; the previous glass panel blocked entry.
  block(new THREE.BoxGeometry(1.4,1.15,0.12),shopGlassMat,14.25,2.15,-0.52);
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
  buildingColliders.push({ minX:10.5, maxX:15.9, minZ:-5.85, maxZ:-0.72, shop:true });


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

  // A small open-roof safehouse the player can physically enter and use to rest.
  const safehouseX = 38.5, safehouseZ = -18;
  const safehouseWall = new THREE.MeshStandardMaterial({color:"#62534d",roughness:0.95});
  const safehouseFloor = new THREE.MeshStandardMaterial({color:"#9a8b78",roughness:1});
  block(new THREE.BoxGeometry(6.7,0.12,6.7),safehouseFloor,safehouseX,0.02,safehouseZ);
  block(new THREE.BoxGeometry(7,3.5,0.35),safehouseWall,safehouseX,1.75,safehouseZ-3.5);
  block(new THREE.BoxGeometry(0.35,3.5,7),safehouseWall,safehouseX-3.5,1.75,safehouseZ);
  block(new THREE.BoxGeometry(0.35,3.5,7),safehouseWall,safehouseX+3.5,1.75,safehouseZ);
  block(new THREE.BoxGeometry(2,3.5,0.35),safehouseWall,safehouseX-2.5,1.75,safehouseZ+3.5);
  block(new THREE.BoxGeometry(2,3.5,0.35),safehouseWall,safehouseX+2.5,1.75,safehouseZ+3.5);
  block(new THREE.BoxGeometry(2.1,0.22,0.5),shopTrimMat,safehouseX,3.25,safehouseZ+3.25);
  block(new THREE.BoxGeometry(1.8,0.55,2.5),buildingMats[1],safehouseX-1.2,0.42,safehouseZ-0.8);
  block(new THREE.BoxGeometry(1.1,0.7,0.8),shopTrimMat,safehouseX+1.7,0.42,safehouseZ+0.9);
  buildingColliders.push(
    {minX:safehouseX-3.5,maxX:safehouseX+3.5,minZ:safehouseZ-3.675,maxZ:safehouseZ-3.325},
    {minX:safehouseX-3.675,maxX:safehouseX-3.325,minZ:safehouseZ-3.5,maxZ:safehouseZ+3.5},
    {minX:safehouseX+3.325,maxX:safehouseX+3.675,minZ:safehouseZ-3.5,maxZ:safehouseZ+3.5},
    {minX:safehouseX-3.5,maxX:safehouseX-1.5,minZ:safehouseZ+3.325,maxZ:safehouseZ+3.675},
    {minX:safehouseX+1.5,maxX:safehouseX+3.5,minZ:safehouseZ+3.325,maxZ:safehouseZ+3.675}
  );
  const safehouseRestPoint = new THREE.Vector3(safehouseX,0,safehouseZ+2.0);
  const safehousePrompt = document.createElement("button");
  safehousePrompt.type = "button"; safehousePrompt.className = "door-interact-prompt";
  safehousePrompt.textContent = "REST · RECOVER NEEDS"; safehousePrompt.hidden = true;
  safehousePrompt.setAttribute("aria-label","Rest at the safehouse to recover energy and supplies");
  safehousePrompt.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();window.dispatchEvent(new CustomEvent("cos-rest-safehouse"));});
  container.appendChild(safehousePrompt);
  const jobMarker = new THREE.Group();
  const markerRing = new THREE.Mesh(new THREE.TorusGeometry(1.15,0.12,6,18),new THREE.MeshBasicMaterial({color:"#e4bd70"}));
  markerRing.rotation.x = Math.PI/2;
  markerRing.position.y = 0.18;
  jobMarker.add(markerRing);
  const markerBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.42,2.4,7,1,true),new THREE.MeshBasicMaterial({color:"#e4bd70",transparent:true,opacity:0.35,side:THREE.DoubleSide}));
  markerBeam.position.y = 1.35;
  jobMarker.add(markerBeam);
  jobMarker.position.set(marketDoorPoint.x,0,marketDoorPoint.z);
  jobMarker.visible = false;
  scene.add(jobMarker);
  let deliveryJobActive = false;
  const startDeliveryJob = () => {
    deliveryJobActive = true;
    jobMarker.visible = true;
    const status = controls.querySelector(".city-status");
    if (status) status.textContent = "DELIVERY JOB · FOLLOW THE GOLD MARKER TO CITY MARKET";
  };
  window.addEventListener("cos-start-delivery-job", startDeliveryJob);

  // Lightweight low-poly vehicles share one builder for parked cars and moving traffic.
  const vehicles = [];
  const trafficCars = [];
  const vehicleStates = new WeakMap();
  const explosionEffects = [];
  const vehicleMaterials=["#8b252c","#263b50","#b18a42"].map(color=>new THREE.MeshStandardMaterial({color,roughness:0.72}));
  const tyreMaterial=new THREE.MeshStandardMaterial({color:"#111216",roughness:1});
  function buildCar(x,z,index,rotation=0){
    const car=new THREE.Group();
    const paint=vehicleMaterials[index%vehicleMaterials.length];
    const bodyMaterial=paint.clone();
    const body=block(new THREE.BoxGeometry(2.15,0.68,4.0),bodyMaterial,0,0.68,0,car);
    block(new THREE.BoxGeometry(1.72,0.7,1.9),shopGlassMat,0,1.32,-0.15,car);
    for(const side of [-1,1])for(const end of [-1,1]){
      const wheel=block(new THREE.CylinderGeometry(0.34,0.34,0.2,8),tyreMaterial,side*1.08,0.43,end*1.28,car);
      wheel.rotation.z=Math.PI/2;
    }
    const smoke=new THREE.Group();
    const smokeMat=new THREE.MeshBasicMaterial({color:"#34383d",transparent:true,opacity:0.48});
    for(let i=0;i<3;i++){
      const puff=new THREE.Mesh(new THREE.SphereGeometry(0.22+i*0.07,7,6),smokeMat);
      puff.position.set((i-1)*0.2,0.15+i*0.2,0);
      smoke.add(puff);
    }
    smoke.position.set(0,1.18,1.05);smoke.visible=false;car.add(smoke);
    const flames=new THREE.Group();
    const flameMat=new THREE.MeshBasicMaterial({color:"#ff762e"});
    const flameCoreMat=new THREE.MeshBasicMaterial({color:"#ffd16a"});
    for(let i=0;i<3;i++){
      const flame=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.72,6),i===1?flameCoreMat:flameMat);
      flame.position.set((i-1)*0.38,0.32,0);
      flame.rotation.z=(i-1)*0.18;
      flames.add(flame);
    }
    flames.position.set(0,1.18,1.05);flames.visible=false;car.add(flames);
    car.position.set(x,0,z);car.rotation.y=rotation;scene.add(car);
    vehicleStates.set(car,{damage:0,destroyed:false,hitCooldown:0,body,bodyMaterial,baseColor:bodyMaterial.color.clone(),smoke,flames});
    return car;
  }
  function overlapsCar(x,z,radius,car,extra=0){
    // Test the player's circle against the car's oriented rectangular footprint.
    const dx=x-car.position.x,dz=z-car.position.z;
    const cos=Math.cos(car.rotation.y),sin=Math.sin(car.rotation.y);
    const localX=dx*cos-dz*sin,localZ=dx*sin+dz*cos;
    const halfWidth=1.38,halfLength=2.34;
    const closestX=THREE.MathUtils.clamp(localX,-halfWidth,halfWidth);
    const closestZ=THREE.MathUtils.clamp(localZ,-halfLength,halfLength);
    const outsideX=localX-closestX,outsideZ=localZ-closestZ;
    return outsideX*outsideX+outsideZ*outsideZ < (radius+extra)*(radius+extra);
  }
  function updateVehicleCondition(car){
    const state=vehicleStates.get(car);
    if(!state||drivingVehicle!==car){vehicleConditionHud.hidden=true;return;}
    const value=Math.max(0,100-Math.round(state.damage));
    vehicleConditionHud.hidden=false;
    vehicleConditionHud.querySelector("strong").textContent=value+"%";
    vehicleConditionHud.querySelector(".vehicle-condition-track i").style.width=value+"%";
    vehicleConditionHud.classList.toggle("warning",value<=60&&value>25);
    vehicleConditionHud.classList.toggle("critical",value<=25);
    vehicleConditionHud.querySelector("small").textContent=state.destroyed?"VEHICLE DESTROYED":value<=25?"CRITICAL · ENGINE FAILURE RISK":value<=60?"DAMAGED · REDUCED PERFORMANCE":"ENGINE HEALTH";
  }
  function createExplosion(position){
    const material=new THREE.MeshBasicMaterial({color:"#ff8a32",transparent:true,opacity:0.9});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),material);
    mesh.position.copy(position);mesh.position.y=1.1;mesh.scale.setScalar(0.5);scene.add(mesh);
    explosionEffects.push({mesh,material,age:0,duration:0.72});
  }
  function hitPedestrianWithVehicle(person,car,speed){
    if(!person.alive||(person.vehicleHitCooldown||0)>0)return false;
    person.vehicleHitCooldown=1.05;
    const impact=Math.abs(speed);
    const damage=Math.max(8,Math.round(impact*7));
    person.health=Math.max(0,person.health-damage);
    const dx=person.npc.position.x-car.position.x,dz=person.npc.position.z-car.position.z;
    const length=Math.hypot(dx,dz)||1;
    const push=impact>6?2.0:1.45;
    person.npc.position.x+=dx/length*push;
    person.npc.position.z+=dz/length*push;
    person.progress=0;
    if(person.health<=0){
      person.alive=false;person.respawnTime=18;person.npc.rotation.x=-0.95;
      person.parts.legs.forEach(leg=>leg.rotation.x=1.1);
      person.parts.arms.forEach(arm=>arm.rotation.x=-0.8);
    }else{
      person.parts.body.material.color.set("#f3c0a5");
    }
    const status=controls.querySelector(".city-status");
    if(status)status.textContent=person.health<=0?"PEDESTRIAN HIT · VEHICLE IMPACT":"PEDESTRIAN KNOCKED ASIDE";
    return true;
  }
  function hitPlayerWithVehicle(car,speed){
    if(playerHealth<=0||vehicleHitCooldown>0)return false;
    const impact=Math.abs(speed);
    vehicleHitCooldown=1.15;
    playerHealth=Math.max(0,playerHealth-Math.max(8,Math.round(impact*1.8)));
    const dx=player.position.x-car.position.x,dz=player.position.z-car.position.z;
    const length=Math.hypot(dx,dz)||1;
    player.position.x+=dx/length*1.45;
    player.position.z+=dz/length*1.45;
    const status=controls.querySelector(".city-status");
    if(status)status.textContent=playerHealth>0?"PLAYER HIT BY VEHICLE · HEALTH "+playerHealth+"%":"YOU WERE HIT BY A VEHICLE · YOU ARE DOWN";
    if(playerHealth<=0)respawnButton.hidden=false;
    return true;
  }
  function hitOpponentWithVehicle(car,speed){
    if(opponentHealth<=0||opponentVehicleHitCooldown>0)return false;
    const impact=Math.abs(speed);
    opponentVehicleHitCooldown=1.15;
    opponentHealth=Math.max(0,opponentHealth-Math.max(10,Math.round(impact*2.2)));
    const dx=opponent.position.x-car.position.x,dz=opponent.position.z-car.position.z;
    const length=Math.hypot(dx,dz)||1;
    opponent.position.x+=dx/length*1.55;
    opponent.position.z+=dz/length*1.55;
    opponentFlash=0.35;
    const status=controls.querySelector(".city-status");
    if(status)status.textContent=opponentHealth>0?"OPPONENT HIT BY VEHICLE":"OPPONENT KNOCKED DOWN";
    return true;
  }
  function vehicleImpactDamage(speed,kind="obstacle"){
    const impact=Math.abs(speed);
    if(impact<2.2)return 0.25;
    if(kind==="vehicle")return Math.min(3.2,0.35+(impact-2.2)*0.32);
    return Math.min(4.5,0.45+(impact-2.2)*0.42);
  }
  function explodeCar(car){
    const state=vehicleStates.get(car);
    if(!state||state.destroyed)return;
    state.destroyed=true;state.damage=100;state.smoke.visible=true;state.flames.visible=true;
    state.bodyMaterial.color.set("#25201e");
    createExplosion(car.position.clone());
    const occupied=drivingVehicle===car;
    if(occupied){
      player.position.copy(car.position);player.position.y=0;player.visible=true;
      drivingVehicle=null;setDriving(false);
      playerHealth=0;
      const readout=controls.querySelector("#combat-readout");
      if(readout)readout.textContent="VEHICLE EXPLODED · YOU ARE DOWN";
    }else{
      const distance=Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z);
      if(distance<6&&playerHealth>0)playerHealth=Math.max(0,playerHealth-Math.max(15,Math.round(90-distance*13)));
    }
    pedestrians.forEach(person=>{
      if(!person.alive)return;
      const distance=Math.hypot(person.npc.position.x-car.position.x,person.npc.position.z-car.position.z);
      if(distance<5)hitPedestrianWithVehicle(person,car,9);
    });
    vehicleConditionHud.hidden=true;
    const status=controls.querySelector(".city-status");
    if(status)status.textContent="VEHICLE DESTROYED · EXPLOSION";
  }
  function damageCar(car,amount,impactSpeed=0,reason="impact"){
    const state=vehicleStates.get(car);
    if(!state||state.destroyed)return;
    if(state.hitCooldown>0)return;
    state.hitCooldown=0.85;
    state.damage=Math.min(100,state.damage+Math.max(0,amount));
    const darken=state.damage/100*0.72;
    state.bodyMaterial.color.copy(state.baseColor).lerp(new THREE.Color("#211f1e"),darken);
    state.smoke.visible=state.damage>=30;
    state.flames.visible=state.damage>=76;
    if(drivingVehicle===car&&impactSpeed>2){
      playerHealth=Math.max(0,playerHealth-Math.max(2,Math.round(Math.abs(impactSpeed)*1.45)));
      if(playerHealth<=0){
        player.position.copy(car.position);player.position.y=0;player.visible=true;
        setDriving(false);
      }
    }
    if(drivingVehicle===car)updateVehicleCondition(car);
    const readout=controls.querySelector("#combat-readout");
    if(readout&&drivingVehicle===car)readout.textContent=state.damage>=76?"ENGINE CRITICAL · VEHICLE ON FIRE":"VEHICLE DAMAGED · "+Math.round(state.damage)+"% DAMAGE";
    if(state.damage>=100)explodeCar(car);
  }
  function overlapsBuilding(x,z,radius,b){
    // Leave a real opening in the shop's front wall so the player can reach
    // the door; vehicles still use the full solid building footprint.
    if(b.shop && x-radius>11.3 && x+radius<12.8 && z<0.15) return false;
    return x+radius>b.minX && x-radius<b.maxX && z+radius>b.minZ && z-radius<b.maxZ;
  }
  function overlapsVehicleBuilding(x,z,car,b){
    const cos=Math.abs(Math.cos(car.rotation.y)),sin=Math.abs(Math.sin(car.rotation.y));
    const halfX=cos*1.5+sin*2.5,halfZ=sin*1.5+cos*2.5;
    return x+halfX>b.minX && x-halfX<b.maxX && z+halfZ>b.minZ && z-halfZ<b.maxZ;
  }
  function playerBlockedByVehicle(x,z,radius){
    if(vehicles.some(entry=>overlapsCar(x,z,radius,entry.car,0.08))) return true;
    return trafficCars.some(entry=>!entry.hijacked&&overlapsCar(x,z,radius,entry.car,0.08));
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
  const wornAccessories = characterData?.accessories || {};
  const accessoryGold = new THREE.MeshStandardMaterial({ color:"#d6ad55", metalness:0.78, roughness:0.28 });
  const accessoryDark = new THREE.MeshStandardMaterial({ color:"#17191f", metalness:0.25, roughness:0.35 });
  const addPlayerAccessory = (geometry,material,x,y,z) => block(geometry,material,x,y,z,player);
  if (wornAccessories.glasses) {
    addPlayerAccessory(new THREE.TorusGeometry(0.078,0.012,6,20),accessoryDark,-0.09,2.1,0.205);
    addPlayerAccessory(new THREE.TorusGeometry(0.078,0.012,6,20),accessoryDark,0.09,2.1,0.205);
    addPlayerAccessory(new THREE.BoxGeometry(0.045,0.012,0.014),accessoryDark,0,2.1,0.205);
  }
  if (wornAccessories.chain) {
    const chain = addPlayerAccessory(new THREE.TorusGeometry(0.18,0.016,6,32),accessoryGold,0,1.72,0.1);
    chain.rotation.x = Math.PI / 2;
  }
  if (wornAccessories.watch) {
    addPlayerAccessory(new THREE.BoxGeometry(0.13,0.075,0.105),accessoryGold,-0.49,1.02,0.015);
    addPlayerAccessory(new THREE.BoxGeometry(0.15,0.035,0.12),accessoryDark,-0.49,1.02,0.015);
  }
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
    pedestrians.push({ npc, parts, route, progress:0, direction:1, phase:index*1.7, radius:pedestrianRadius, health:100, alive:true, respawnTime:0, shirtColor:["#31506a","#7b4a2d","#4c5940","#6c3540"][index%4] });
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
  let opponentRespawnTime = 0;
  let playerHealth = 100;
  const useMedkit = () => {
    playerHealth = Math.min(100, playerHealth + 45);
    respawnButton.hidden = playerHealth > 0;
    const healthHud = document.querySelector("#needs-hud");
    if (healthHud) healthHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
    const readout = controls.querySelector("#combat-readout");
    if (readout) readout.textContent = "FIRST AID USED · HEALTH " + playerHealth + "%";
  };
  const restoreHealth = event => {
    const amount = Math.max(0, Math.min(30, Number(event.detail?.amount) || 0));
    playerHealth = Math.min(100, playerHealth + amount);
    if (playerHealth > 0) respawnButton.hidden = true;
  };
  const restoreEnergy = event => {
    const amount = Math.max(0, Math.min(40, Number(event.detail?.amount) || 0));
    survival.energy = Math.min(100, survival.energy + amount);
    if (typeof onNeedsUpdate === "function") onNeedsUpdate({ ...survival });
  };
  window.addEventListener("cos-restore-energy", restoreEnergy);
  window.addEventListener("cos-restore-health", restoreHealth);
  window.addEventListener("cos-use-medkit", useMedkit);
  const restAtSafehouse = () => {
    playerHealth = Math.min(100, playerHealth + 35);
    survival.energy = Math.min(100,survival.energy+45);
    survival.hunger = 100;
    survival.hydration = 100;
    if (typeof onNeedsUpdate === "function") onNeedsUpdate({...survival});
    const healthHud = document.querySelector("#needs-hud");
    if (healthHud) healthHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
    const readout = controls.querySelector("#combat-readout");
    if (readout) readout.textContent = "SAFEHOUSE REST · ENERGY AND SUPPLIES RESTORED";
  };
  window.addEventListener("cos-rest-safehouse",restAtSafehouse);
  let vehicleHitCooldown = 0;
  let vehicleHitMessageTime = 0;
  let vehicleHitMessage = "";
  const survival = { hunger: characterData?.needs?.hunger ?? 100, hydration: characterData?.needs?.hydration ?? 100, energy: characterData?.needs?.energy ?? 100 };
  let needsClock = 0;
  const initialNeedsHud = document.querySelector("#needs-hud");
  if (initialNeedsHud) initialNeedsHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
  let attackCooldown = 0;
  let opponentAttackCooldown = 0;
  let opponentVehicleHitCooldown = 0;
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
  let vehicleSpeed = 0;
  let destroyed = false;
  const pendingUiTimers = new Set();
  function scheduleUiReset(callback, delay) {
    const timer = window.setTimeout(() => { pendingUiTimers.delete(timer); if (!destroyed) callback(); }, delay);
    pendingUiTimers.add(timer);
    return timer;
  }
  const driveControls = controls.querySelector(".drive-controls");
  const driveForwardButton = controls.querySelector(".drive-forward");
  const driveReverseButton = controls.querySelector(".drive-reverse");
  const driveExitButton = controls.querySelector(".drive-exit");
  const driveHornButton = controls.querySelector(".drive-horn");
  let hornAudioContext = null;
  function honkVehicle() {
    if (!drivingVehicle) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) { controls.querySelector("#combat-readout").textContent = "HORN SOUND IS NOT SUPPORTED IN THIS BROWSER"; return; }
    try {
      hornAudioContext ||= new AudioContextClass();
      if (hornAudioContext.state === "suspended") hornAudioContext.resume();
      const oscillator = hornAudioContext.createOscillator();
      const gain = hornAudioContext.createGain();
      oscillator.type = "square"; oscillator.frequency.setValueAtTime(310,hornAudioContext.currentTime);
      gain.gain.setValueAtTime(0.12,hornAudioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,hornAudioContext.currentTime+0.24);
      oscillator.connect(gain); gain.connect(hornAudioContext.destination);
      oscillator.start(); oscillator.stop(hornAudioContext.currentTime+0.25);
      controls.querySelector("#combat-readout").textContent = "HORN · CLEAR THE ROAD";
    } catch { controls.querySelector("#combat-readout").textContent = "HORN UNAVAILABLE"; }
  }
  if (driveHornButton) driveHornButton.addEventListener("click",honkVehicle);
  const driveJoy = controls.querySelector(".drive-joystick");
  const driveKnob = controls.querySelector(".drive-joystick-knob");
  function setDriving(active, vehicle = null) {
    drivingVehicle = active ? vehicle : null;
    vehicleConditionHud.hidden=!active;
    if(active)updateVehicleCondition(vehicle);
    if (driveControls) driveControls.classList.toggle("active", active);
    const cityControls = document.querySelector("#city-controls");
    if (cityControls) cityControls.classList.toggle("driving-mode", active);
    if (vehiclePrompt) vehiclePrompt.hidden = active;
    player.visible = !active;
    driveForward = false; driveReverse = false;
    vehicleSpeed = 0;
    driveJoystick = { x: 0, y: 0 };
    driveKnob.style.transform = "translate(0,0)";
    if (active) controls.querySelector("#combat-readout").textContent = "DRIVING · JOYSTICK / A-D TO STEER · HOLD ACCELERATE OR REVERSE";
    else controls.querySelector("#combat-readout").textContent = "ON FOOT · PUNCH · KICK · BLOCK · DODGE";
  }
  function enterNearestVehicle() {
    if (drivingVehicle) return;
    let nearest = null, distance = 5.6;
    for (const entry of vehicles) {
      if(vehicleStates.get(entry.car)?.destroyed)continue;
      const d = Math.hypot(player.position.x-entry.car.position.x, player.position.z-entry.car.position.z);
      if (d < distance) { nearest = {car:entry.car,traffic:false}; distance = d; }
    }
    for (const entry of trafficCars) {
      if (entry.hijacked||vehicleStates.get(entry.car)?.destroyed) continue;
      const d = Math.hypot(player.position.x-entry.car.position.x, player.position.z-entry.car.position.z);
      if (d < distance) { nearest = {car:entry.car,traffic:true,trafficEntry:entry}; distance = d; }
    }
    if (!nearest) return;
    if (nearest.traffic) {
      nearest.trafficEntry.hijacked = true;
      vehicles.push({car:nearest.car,drivable:true,hijacked:true});
      environmentColliders.push({x:nearest.car.position.x,z:nearest.car.position.z,radius:1.55,vehicle:nearest.car});
    }
    const forward = new THREE.Vector3(Math.sin(nearest.car.rotation.y),0,Math.cos(nearest.car.rotation.y));
    player.position.copy(nearest.car.position).addScaledVector(forward,-2.7);
    player.position.y = 0;
    setDriving(true,nearest.car);
  }
  function exitVehicle() {
    if (!drivingVehicle) return;
    const car = drivingVehicle;
    const side = new THREE.Vector3(Math.cos(car.rotation.y),0,-Math.sin(car.rotation.y));
    const forward = new THREE.Vector3(Math.sin(car.rotation.y),0,Math.cos(car.rotation.y));
    const candidates = [side.clone().multiplyScalar(2.7), side.clone().multiplyScalar(-2.7), forward.clone().multiplyScalar(3.2), forward.clone().multiplyScalar(-3.2)];
    const isBlocked = position => {
      if (Math.abs(position.x)>42 || Math.abs(position.z)>42) return true;
      if (buildingColliders.some(b=>position.x+playerRadius>b.minX&&position.x-playerRadius<b.maxX&&position.z+playerRadius>b.minZ&&position.z-playerRadius<b.maxZ)) return true;
      if (environmentColliders.some(o=>o.vehicle ? overlapsCar(position.x,position.z,playerRadius,o.vehicle) : Math.hypot(position.x-o.x,position.z-o.z)<o.radius+playerRadius)) return true;
      if (vehicles.some(v=>v.car!==car&&overlapsCar(position.x,position.z,playerRadius,v.car,0.15))) return true;
      if (trafficCars.some(t=>t.car!==car&&!t.hijacked&&overlapsCar(position.x,position.z,playerRadius,t.car,0.15))) return true;
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
      if (hp <= 0) opponentRespawnTime = 16;
      opponentHitReaction=kind==="kick"?0.3:0.22; opponentFlash=kind==="kick"?0.18:0.16;
      opponentTorso.material.color.set("#f3c0a5");
      controls.querySelector("#combat-readout").textContent=hp>0?kind.toUpperCase()+" CONNECTED · OPPONENT "+hp+"%":"OPPONENT DEFEATED · 0% HEALTH";
    }else{
      const p=target.person; p.health=hp;
      p.parts.body.material.color.set("#f3c0a5");
      p.npc.rotation.y=Math.atan2(player.position.x-p.npc.position.x,player.position.z-p.npc.position.z);
      if(hp<=0){
        p.alive=false; p.respawnTime=18; p.npc.rotation.x=-0.95;
        p.parts.legs.forEach(leg=>leg.rotation.x=1.1);
        p.parts.arms.forEach(arm=>arm.rotation.x=-0.8);
        controls.querySelector("#combat-readout").textContent="PEDESTRIAN DEFEATED";
      }else controls.querySelector("#combat-readout").textContent=kind.toUpperCase()+" HIT · PEDESTRIAN "+hp+"%";
    }
    return true;
  }
  function attack(e){
    e.preventDefault();e.stopPropagation();if(drivingVehicle || playerHealth<=0 || attackCooldown>0)return;
    attackButton.classList.add("pressed");attackCooldown=0.48;playerAttackTime=0.34;playerAttackSide=playerAttackSide===0?1:0;
    if(!hitMeleeTarget(findMeleeTarget(3.35),20,"punch"))controls.querySelector("#combat-readout").textContent="PUNCH MISSED · FACE A PERSON AND GET CLOSER";
    scheduleUiReset(()=>attackButton.classList.remove("pressed"),140);
  }
  function kick(e){
    e.preventDefault();e.stopPropagation();if(drivingVehicle || playerHealth<=0 || attackCooldown>0)return;
    kickButton.classList.add("pressed");attackCooldown=0.72;playerKickTime=0.48;
    if(!hitMeleeTarget(findMeleeTarget(3.8),35,"kick"))controls.querySelector("#combat-readout").textContent="KICK MISSED · FACE A PERSON AND GET CLOSER";
    scheduleUiReset(()=>kickButton.classList.remove("pressed"),180);
  }

  function runStart(e) {
    e.preventDefault();
    e.stopPropagation();
    try { runButton.setPointerCapture(e.pointerId); } catch {}
    sprint = true;
    runButton.classList.add("pressed");
  }
  function runEnd() { sprint = false; runButton.classList.remove("pressed"); }

  function blockStart(e) {
    e.preventDefault();
    if (drivingVehicle || playerHealth<=0) return;
    e.stopPropagation();
    try { blockButton.setPointerCapture(e.pointerId); } catch {}
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
    if (drivingVehicle || playerHealth<=0) return;
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
    scheduleUiReset(() => dodgeButton.classList.remove("pressed"), 260);
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
    const jobsOpen = !document.querySelector("#jobs-panel").classList.contains("hidden");
    explosionEffects.forEach(effect=>{
      effect.age+=dt;
      const progress=Math.min(1,effect.age/effect.duration);
      effect.mesh.scale.setScalar(0.5+progress*5.5);
      effect.material.opacity=0.9*(1-progress);
      if(progress>=1){scene.remove(effect.mesh);effect.mesh.geometry.dispose();effect.material.dispose();}
    });
    for(let i=explosionEffects.length-1;i>=0;i--)if(explosionEffects[i].age>=explosionEffects[i].duration)explosionEffects.splice(i,1);
    vehicleStates && vehicles.concat(trafficCars).forEach(entry=>{
      const car=entry.car||entry;
      const state=vehicleStates.get(car);
      if(state){state.hitCooldown=Math.max(0,state.hitCooldown-dt);if(state.smoke.visible)state.smoke.rotation.y+=dt*0.8;if(state.flames.visible)state.flames.scale.setScalar(0.92+Math.sin(time*0.025)*0.12);}
    });
    if (inventoryOpen || shopOpen || gameMenuOpen || jobsOpen) {
      renderer.render(scene,camera);
      return;
    }
    // Ambient traffic keeps moving and can strike pedestrians.
    trafficCars.forEach(t=>{
      if(t.hijacked || (drivingVehicle && t.car===drivingVehicle) || vehicleStates.get(t.car)?.destroyed) return;
      const axis=t.horizontal?"x":"z";
      const previous=t.car.position[axis];
      t.car.position[axis]+=t.speed*t.direction*dt;
      if(t.car.position[axis]>52)t.car.position[axis]=-52;
      if(t.car.position[axis]<-52)t.car.position[axis]=52;
      let blockedByCharacter=false;
      pedestrians.forEach(person=>{
        if(person.alive&&overlapsCar(person.npc.position.x,person.npc.position.z,person.radius,t.car,0.08)){
          hitPedestrianWithVehicle(person,t.car,t.speed);blockedByCharacter=true;
        }
      });
      if(playerHealth>0&&!drivingVehicle&&overlapsCar(player.position.x,player.position.z,playerRadius,t.car,0.12)){
        hitPlayerWithVehicle(t.car,t.speed);blockedByCharacter=true;
      }
      if(opponentHealth>0&&overlapsCar(opponent.position.x,opponent.position.z,0.62,t.car,0.12)){
        hitOpponentWithVehicle(t.car,t.speed);blockedByCharacter=true;
      }
      if(blockedByCharacter)t.car.position[axis]=previous;
    });
    // Moving traffic can injure the player on impact, with a short cooldown
    // so one continuous overlap does not drain the entire health bar.
    vehicleHitCooldown=Math.max(0,vehicleHitCooldown-dt);
    opponentVehicleHitCooldown=Math.max(0,opponentVehicleHitCooldown-dt);
    vehicleHitMessageTime=Math.max(0,vehicleHitMessageTime-dt);
    if(vehicleHitMessageTime===0)vehicleHitMessage="";
    if(!drivingVehicle && playerHealth>0 && vehicleHitCooldown===0){
      const hitCar=trafficCars.find(t=>!t.hijacked&&overlapsCar(player.position.x,player.position.z,playerRadius,t.car,0.15));
      if(hitCar){
        playerHealth=Math.max(0,playerHealth-3);
        vehicleHitCooldown=2.5;
        const healthHud=document.querySelector("#needs-hud");
        if(healthHud)healthHud.textContent=`HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
        const status=controls.querySelector(".city-status");
        vehicleHitMessage=playerHealth>0?`HIT BY CAR · HEALTH ${playerHealth}%`:"YOU WERE HIT BY A CAR · YOU ARE DOWN";
        vehicleHitMessageTime=1.15;
        if(status)status.textContent=vehicleHitMessage;
      }
    }
    const runningInput = sprint||keys.has("shift")||keys.has("m");
    needsClock += dt;
    if (needsClock >= 5) {
      const elapsed = needsClock; needsClock = 0;
      survival.hunger = Math.max(0, survival.hunger - elapsed * 0.16);
      survival.hydration = Math.max(0, survival.hydration - elapsed * 0.23);
      survival.energy = Math.max(0, Math.min(100, survival.energy + (drivingVehicle ? elapsed * 0.25 : (joystick.x!==0 || joystick.y!==0 || ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].some(key=>keys.has(key))) ? (runningInput ? -elapsed * 1.7 : elapsed * 0.18) : elapsed * 1.1)));
      if (typeof onNeedsUpdate === "function") onNeedsUpdate({ ...survival });
      const needsHud = document.querySelector("#needs-hud");
      if (needsHud) needsHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
    }
    if (drivingVehicle) {
      const car=drivingVehicle;
      const steer=THREE.MathUtils.clamp(driveJoystick.x+(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0),-1,1);
      const analogThrottle=-driveJoystick.y;
      const throttle=Math.abs(analogThrottle)>.18?Math.sign(analogThrottle):(driveForward||keys.has("w")||keys.has("arrowup")?1:0)-(driveReverse||keys.has("s")||keys.has("arrowdown")?1:0);
      // Horizontal joystick input steers; vertical input accelerates or reverses.
      const carState=vehicleStates.get(car);
      const performance=carState?Math.max(0.38,1-carState.damage/165):1;
      if(throttle!==0) vehicleSpeed=THREE.MathUtils.clamp(vehicleSpeed+throttle*14*performance*dt,-9,11*performance);
      else vehicleSpeed*=Math.max(0,1-(2.8+(carState?.damage||0)/45)*dt);
      if(Math.abs(vehicleSpeed)<0.08)vehicleSpeed=0;
      if(Math.abs(vehicleSpeed)>0.12){
        const oldRotation=car.rotation.y;
        const nextRotation=oldRotation-steer*dt*1.35*Math.sign(vehicleSpeed);
        // Do not let steering rotate the car's body through a wall while it
        // is stopped against a building; test the full rotated footprint first.
        car.rotation.y=nextRotation;
        const rotationBlocked=buildingColliders.some(b=>overlapsVehicleBuilding(car.position.x,car.position.z,car,b));
        if(rotationBlocked)car.rotation.y=oldRotation;
        const oldX=car.position.x,oldZ=car.position.z;
        const nx=THREE.MathUtils.clamp(oldX+Math.sin(car.rotation.y)*vehicleSpeed*dt,-44,44);
        const nz=THREE.MathUtils.clamp(oldZ+Math.cos(car.rotation.y)*vehicleSpeed*dt,-44,44);
        const travel=Math.hypot(nx-oldX,nz-oldZ),steps=Math.max(1,Math.ceil(travel/0.22));
        let clear=true,collisionReason="",vehicleCollision=false;
        for(let step=1;step<=steps&&clear;step++){
          const testX=oldX+(nx-oldX)*step/steps,testZ=oldZ+(nz-oldZ)*step/steps;
          const blockedBuilding=buildingColliders.some(b=>overlapsVehicleBuilding(testX,testZ,car,b));
          const blockedStatic=environmentColliders.some(o=>!o.vehicle&&Math.hypot(testX-o.x,testZ-o.z)<o.radius+1.25);
          const parkedHit=vehicles.find(v=>v.car!==car&&overlapsCar(testX,testZ,1.0,v.car,0.2));
          const trafficHit=trafficCars.find(t=>t.car!==car&&!t.hijacked&&!vehicleStates.get(t.car)?.destroyed&&overlapsCar(testX,testZ,1.0,t.car,0.2));
          const pedestrianHit=pedestrians.find(person=>person.alive&&Math.hypot(testX-person.npc.position.x,testZ-person.npc.position.z)<person.radius+0.72);
          const playerHit=!drivingVehicle&&!pedestrianHit&&playerHealth>0&&Math.hypot(testX-player.position.x,testZ-player.position.z)<playerRadius+0.92;
          const opponentHit=!pedestrianHit&&!playerHit&&opponentHealth>0&&Math.hypot(testX-opponent.position.x,testZ-opponent.position.z)<0.62+0.92;
          if(pedestrianHit){hitPedestrianWithVehicle(pedestrianHit,car,vehicleSpeed);clear=false;collisionReason="pedestrian";}
          else if(playerHit){hitPlayerWithVehicle(car,vehicleSpeed);clear=false;collisionReason="player";}
          else if(opponentHit){hitOpponentWithVehicle(car,vehicleSpeed);clear=false;collisionReason="opponent";}
          if(blockedBuilding||blockedStatic||parkedHit||trafficHit){
            clear=false;
            vehicleCollision=!!(parkedHit||trafficHit);
            collisionReason=blockedBuilding||blockedStatic?"obstacle":"vehicle";
            if(parkedHit)damageCar(parkedHit.car,vehicleImpactDamage(vehicleSpeed,"vehicle"),0,"vehicle");
            if(trafficHit)damageCar(trafficHit.car,vehicleImpactDamage(vehicleSpeed,"vehicle"),0,"vehicle");
          }
        }
        if(clear){car.position.x=nx;car.position.z=nz;}
        else{
          if(collisionReason==="obstacle"||collisionReason==="vehicle"){
            damageCar(car,vehicleImpactDamage(vehicleSpeed,vehicleCollision?"vehicle":"obstacle"),Math.abs(vehicleSpeed),collisionReason);
          }
          vehicleSpeed=0;
        }
        updateVehicleCondition(car);
      }
      const behind=new THREE.Vector3(-Math.sin(car.rotation.y)*8,4.2,-Math.cos(car.rotation.y)*8).add(car.position);
      camera.position.lerp(behind,0.14);camera.lookAt(car.position.x,1.1,car.position.z);
      renderer.render(scene,camera);
      controls.querySelector(".city-status").textContent=vehicleSpeed>0.15?"DRIVING FORWARD":vehicleSpeed< -0.15?"REVERSING":"VEHICLE STOPPED";
      const readout=controls.querySelector("#combat-readout");if(readout)readout.textContent="STEER WITH JOYSTICK · HOLD ▲ TO ACCELERATE · HOLD ▼ TO REVERSE";
      return;
    }
    if (playerHealth <= 0) {
      respawnButton.hidden = false;
      const readout=controls.querySelector("#combat-readout");
      if(readout)readout.textContent="YOU ARE DOWN · TAP RESPAWN TO CONTINUE";
      const status=controls.querySelector(".city-status");
      if(status)status.textContent="YOU ARE DOWN · TAP RESPAWN TO CONTINUE";
      renderer.render(scene,camera);
      return;
    }
    let x=joystick.x+(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
    let z=joystick.y+(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
    let length=Math.hypot(x,z);
    if(length>1){x/=length;z/=length;length=1;}
    const fast=sprint||keys.has("shift")||keys.has("m");
    if(fast && length<0.08 && playerHealth>0 && !drivingVehicle){x=Math.sin(player.rotation.y);z=Math.cos(player.rotation.y);length=1;}
    const moving=length>0.08;

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
    // Substep foot movement too, so a fast dodge or frame jump cannot tunnel
    // through a parked or moving vehicle between collision samples.
    const footTravel=Math.hypot(dx,dz);
    const footSteps=Math.max(1,Math.ceil(footTravel/0.18));
    const footPathBlocked=(fromX,fromZ,toX,toZ)=>{
      for(let step=1;step<=footSteps;step++){
        const testX=fromX+(toX-fromX)*step/footSteps;
        const testZ=fromZ+(toZ-fromZ)*step/footSteps;
        if(playerBlockedByVehicle(testX,testZ,radius)) return true;
      }
      return false;
    };
    const blockedByPedestrianX = pedestrians.some(person => person.alive &&
      Math.hypot(nextX-person.npc.position.x, player.position.z-person.npc.position.z) < radius + person.radius
    );
    const blockedByOpponentX = Math.hypot(nextX-opponent.position.x, player.position.z-opponent.position.z) < radius + 0.62;
    const blockedBuildingX = buildingColliders.some(b => overlapsBuilding(nextX,player.position.z,radius,b));
    const blockedTreeX = environmentColliders.some(o => !o.vehicle &&
      Math.hypot(nextX-o.x,player.position.z-o.z)<o.radius+radius
    );
    const blockedVehicleX = footPathBlocked(player.position.x,player.position.z,nextX,player.position.z);
    if (!blockedBuildingX && !blockedTreeX && !blockedVehicleX && !blockedByPedestrianX && !blockedByOpponentX) player.position.x=nextX;
    const blockedByPedestrianZ = pedestrians.some(person => person.alive &&
      Math.hypot(player.position.x-person.npc.position.x, nextZ-person.npc.position.z) < radius + person.radius
    );
    const blockedByOpponentZ = Math.hypot(player.position.x-opponent.position.x, nextZ-opponent.position.z) < radius + 0.62;
    const blockedBuildingZ = buildingColliders.some(b => overlapsBuilding(player.position.x,nextZ,radius,b));
    const blockedTreeZ = environmentColliders.some(o => !o.vehicle &&
      Math.hypot(player.position.x-o.x,nextZ-o.z)<o.radius+radius
    );
    const blockedVehicleZ = footPathBlocked(player.position.x,player.position.z,player.position.x,nextZ);
    if (!blockedBuildingZ && !blockedTreeZ && !blockedVehicleZ && !blockedByPedestrianZ && !blockedByOpponentZ) player.position.z=nextZ;
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
      person.vehicleHitCooldown=Math.max(0,(person.vehicleHitCooldown||0)-dt);
      if (!person.alive) {
        person.respawnTime = Math.max(0,person.respawnTime-dt);
        if (person.respawnTime === 0) {
          person.alive = true; person.health = 100; person.progress = 0; person.direction = 1;
          person.npc.position.set(person.route.a[0],0,person.route.a[1]);
          person.npc.rotation.set(0,Math.atan2(person.route.b[0]-person.route.a[0],person.route.b[1]-person.route.a[1]),0);
          person.parts.body.material.color.set(person.shirtColor);
          person.parts.arms.forEach(arm=>{arm.rotation.x=0;arm.rotation.z=0;});
          person.parts.legs.forEach(leg=>{leg.rotation.x=0;leg.rotation.z=0;});
        }
        return;
      }
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
          const healthHud = document.querySelector("#needs-hud");
          if (healthHud) healthHud.textContent = `HEALTH ${playerHealth}%  ·  HUNGER ${Math.round(survival.hunger)}%  ·  WATER ${Math.round(survival.hydration)}%  ·  ENERGY ${Math.round(survival.energy)}%`;
          if (playerHealth <= 0) respawnButton.hidden = false;
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
    if (deliveryJobActive && !drivingVehicle && Math.hypot(player.position.x-marketDoorPoint.x,player.position.z-marketDoorPoint.z) < 3.8) {
      deliveryJobActive = false;
      jobMarker.visible = false;
      const status = controls.querySelector(".city-status");
      if (status) status.textContent = "DELIVERY COMPLETE · ₦120 EARNED";
      const readout = controls.querySelector("#combat-readout");
      if (readout) readout.textContent = "JOB COMPLETE · RETURN TO THE CITY TO TAKE ANOTHER JOB";
      if (typeof onJobComplete === "function") onJobComplete({ reward: 120, job: "market-delivery" });
    }
    if (opponentHealth <= 0 && opponentRespawnTime > 0) {
      opponentRespawnTime = Math.max(0, opponentRespawnTime - dt);
      if (opponentRespawnTime === 0) {
        opponentHealth = 100;
        opponent.position.set(0, 0, 6.5);
        opponent.rotation.set(0, 0, 0);
        opponentTorso.material.color.set("#8e3438");
        opponentParts.arms.forEach(arm => { arm.rotation.x = 0; arm.rotation.z = 0; });
        opponentParts.legs.forEach(leg => { leg.rotation.x = 0; leg.rotation.z = 0; });
        updateOpponentHealthBar();
        const readout = controls.querySelector("#combat-readout");
        if (readout) readout.textContent = "A NEW CHALLENGER HAS ARRIVED · OPPONENT HEALTH 100%";
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
    // The shop entrance is on the south/front side; do not offer entry from behind or through side walls.
    const atShopFront = player.position.z > -2.2 && player.position.z < 2.8 &&
      player.position.x > 10.2 && player.position.x < 13.9;
    shopPrompt.hidden = !atShopFront || shopDistance > 4.2;
    if (!shopPrompt.hidden) {
      shopPrompt.style.left = "50%";
      shopPrompt.style.top = "76%";
    }
    let nearestVehicle=null,nearestVehicleDistance=5.6;
    for(const entry of vehicles){
      if(vehicleStates.get(entry.car)?.destroyed)continue;
      const d=Math.hypot(player.position.x-entry.car.position.x,player.position.z-entry.car.position.z);
      if(d<nearestVehicleDistance){nearestVehicle={car:entry.car,traffic:false};nearestVehicleDistance=d;}
    }
    for(const entry of trafficCars){
      if(entry.hijacked||vehicleStates.get(entry.car)?.destroyed)continue;
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
    const safehouseDistance = Math.hypot(player.position.x-safehouseRestPoint.x,player.position.z-safehouseRestPoint.z);
    safehousePrompt.hidden = safehouseDistance > 2.5 || playerHealth <= 0 || !!drivingVehicle;
    if (!safehousePrompt.hidden) { safehousePrompt.style.left = "50%"; safehousePrompt.style.top = "76%"; }
    const marketDistance = Math.hypot(player.position.x-marketDoorPoint.x, player.position.z-marketDoorPoint.z);
    // Keep the market action in a fixed, easy-to-tap position instead of
    // hiding it when the doorway is outside the camera's current view.
    marketPrompt.hidden = marketDistance > 6.5;
    if (!marketPrompt.hidden) {
      marketPrompt.style.left = "50%";
      marketPrompt.style.top = "76%";
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
    const menuHealth=document.querySelector("#menu-health-value"),menuEnergy=document.querySelector("#menu-energy-value");
    const menuHealthFill=document.querySelector("#menu-health-fill"),menuEnergyFill=document.querySelector("#menu-energy-fill");
    if(menuHealth)menuHealth.textContent=Math.round(playerHealth)+"%";
    if(menuEnergy)menuEnergy.textContent=Math.round(survival.energy)+"%";
    if(menuHealthFill)menuHealthFill.style.width=Math.max(0,Math.min(100,playerHealth))+"%";
    if(menuEnergyFill)menuEnergyFill.style.width=Math.max(0,Math.min(100,survival.energy))+"%";
    const status=controls.querySelector(".city-status");
    status.textContent=vehicleHitMessageTime>0?vehicleHitMessage:(moving?(fast?"RUNNING":"WALKING"):"EXPLORE THE NEIGHBOURHOOD");
  }
  animationId=requestAnimationFrame(loop);

  return function destroy(){
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(animationId);
    pendingUiTimers.forEach(timer => clearTimeout(timer));
    pendingUiTimers.clear();
    keys.clear();
    joystick = { x: 0, y: 0 };
    driveJoystick = { x: 0, y: 0 };
    driveForward = false;
    driveReverse = false;
    drivingVehicle = null;
    observer.disconnect();
    window.removeEventListener("keydown",keyDown);
    window.removeEventListener("keyup",keyUp);
    window.removeEventListener("keydown",inventoryKey);
    window.removeEventListener("cos-equipment-changed", equipmentChanged);
    window.removeEventListener("cos-use-medkit", useMedkit);
    window.removeEventListener("cos-restore-health", restoreHealth);
    window.removeEventListener("cos-restore-energy", restoreEnergy);
    window.removeEventListener("cos-rest-safehouse",restAtSafehouse);
    window.removeEventListener("cos-start-delivery-job", startDeliveryJob);
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
    safehousePrompt.remove();
    vehicleConditionHud.remove();
    respawnButton.remove();
    marketPrompt.remove();
    vehiclePrompt.remove();
    if(unbindForward)unbindForward(); if(unbindReverse)unbindReverse();
    if(driveExitButton)driveExitButton.removeEventListener("click",exitVehicle);
    if(driveHornButton)driveHornButton.removeEventListener("click",honkVehicle);
    if(hornAudioContext)hornAudioContext.close().catch(()=>{});
    renderer.setAnimationLoop(null);
    const disposedGeometries = new Set();
    const disposedMaterials = new Set();
    const disposedTextures = new Set();
    scene.traverse(obj => {
      if (obj.geometry && !disposedGeometries.has(obj.geometry)) { disposedGeometries.add(obj.geometry); obj.geometry.dispose(); }
      const materials = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
      materials.forEach(material => {
        if (!material || disposedMaterials.has(material)) return;
        disposedMaterials.add(material);
        Object.values(material).forEach(value => {
          if (value && value.isTexture && !disposedTextures.has(value)) { disposedTextures.add(value); value.dispose(); }
        });
        material.dispose();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss();
    container.replaceChildren();
  };
}
