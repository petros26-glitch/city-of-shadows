import * as THREE from "three";

export function createCityGame(container, controls, characterData, onExit) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#171923");
  scene.fog = new THREE.Fog("#171923", 22, 95);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 130);
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.replaceChildren(renderer.domElement);

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

  // Street trees and simple streetlights.
  for (const [x,z] of [[-10,-20],[10,-20],[-10,20],[10,20],[-10,-38],[10,38]]) {
    block(new THREE.CylinderGeometry(0.18,0.25,2.2,7), pavementMat, x, 1.1, z);
    block(new THREE.SphereGeometry(1.15,8,6), greenMat, x, 2.8, z);
  }
  for (const [x,z] of [[-7,-14],[7,-14],[-7,14],[7,14]]) {
    block(new THREE.CylinderGeometry(0.07,0.09,4.3,6), lineMat, x, 2.15, z);
    block(new THREE.BoxGeometry(0.8,0.12,0.2), lineMat, x+0.3, 4.2, z);
  }

  const skin = new THREE.MeshStandardMaterial({ color: characterData?.skin || "#6f402d" });
  const shirt = new THREE.MeshStandardMaterial({ color: characterData?.gender === "female" ? "#55242c" : "#292a31" });
  const pants = new THREE.MeshStandardMaterial({ color: "#17191f" });
  const shoes = new THREE.MeshStandardMaterial({ color: "#08090c", roughness: 0.72 });
  const hair = new THREE.MeshStandardMaterial({ color: "#171116" });

  function makeHumanoid(group, shirtMaterial, skinMaterial, trouserMaterial, shoeMaterial, hairMaterial) {
    const body = block(new THREE.CapsuleGeometry(0.34,0.7,4,8), shirtMaterial, 0,1.35,0,group);
    const neck = block(new THREE.CylinderGeometry(0.12,0.14,0.22,8), skinMaterial, 0,1.86,0,group);
    const head = block(new THREE.SphereGeometry(0.24,10,8), skinMaterial, 0,2.08,0,group);
    const cap = block(new THREE.SphereGeometry(0.25,9,7), hairMaterial, 0,2.24,0,group);
    cap.scale.y=0.7;
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
  const playerParts = makeHumanoid(player,shirt,skin,pants,shoes,hair);
  scene.add(player);
  player.position.set(0,0,4);

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
  let attackCooldown = 0;
  let opponentAttackCooldown = 0;
  let dodgeTime = 0;
  let dodgeDistance = 0;
  let dodgeDirX = 0;
  let dodgeDirZ = 1;
  let opponentFlash = 0;
  let walkClock = 0;
  let playerAttackTime = 0;
  let playerAttackSide = 1;
  let opponentPunchTime = 0;
  let opponentPunchSide = 1;

  const keys = new Set();
  let joystick = { x: 0, y: 0 };
  let sprint = false;
  let cameraAngle = 0;
  let dragging = false;
  let lastX = 0;
  let animationId = 0;
  let previous = 0;

  const keyDown = e => {
    const key = e.key.toLowerCase();
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
    e.preventDefault();
    if (joyPointer !== null) return;
    joyPointer = e.pointerId;
    try { joy.setPointerCapture(joyPointer); } catch {}
    joyMove(e);
  }
  function joyMove(e) {
    if (joyPointer !== e.pointerId) return;
    e.preventDefault();
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
  joy.addEventListener("pointermove",joyMove);
  joy.addEventListener("pointerup",joyEnd);
  joy.addEventListener("pointercancel",joyEnd);
  const sprintButton = controls.querySelector(".sprint-button");
  const attackButton = controls.querySelector(".attack-button");
  const dodgeButton = controls.querySelector(".dodge-button");
  const interactButton = controls.querySelector(".interact-button");
  // RUN is a tap-to-toggle mode. It can be switched on before touching
  // the joystick, and remains active while the player moves.
  function sprintToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    sprint = !sprint;
    sprintButton.classList.toggle("pressed", sprint);
    sprintButton.textContent = sprint ? "RUN ON" : "RUN";
    controls.querySelector(".city-status").textContent = sprint
      ? "RUN MODE ON · MOVE WITH THE JOYSTICK"
      : "RUN MODE OFF";
  }
  function sprintOff() {
    sprint = false;
    sprintButton.classList.remove("pressed");
    sprintButton.textContent = "RUN";
  }
  sprintButton.addEventListener("pointerdown", sprintToggle);

  function attack(e) {
    e.preventDefault();
    e.stopPropagation();
    if (attackCooldown > 0) return;

    attackButton.classList.add("pressed");
    attackCooldown = 0.55;
    playerAttackTime = 0.34;
    playerAttackSide = playerAttackSide === 0 ? 1 : 0;

    const distance = player.position.distanceTo(opponent.position);
    const readout = controls.querySelector("#combat-readout");
    if (opponentHealth > 0 && distance < 3.6) {
      opponentHealth = Math.max(0, opponentHealth - 25);
      opponentFlash = 0.16;
      opponentTorso.material.color.set("#f3c0a5");
      readout.textContent = opponentHealth > 0
        ? "PUNCH HIT · OPPONENT HEALTH " + opponentHealth + "%"
        : "OPPONENT DEFEATED · PRESS USE TO RESET TRAINING";
    } else if (opponentHealth <= 0) {
      readout.textContent = "OPPONENT DEFEATED · PRESS USE TO RESET TRAINING";
    } else {
      readout.textContent = "PUNCH MISSED · MOVE CLOSER TO THE OPPONENT";
    }

    setTimeout(() => attackButton.classList.remove("pressed"), 140);
  }
  function dodge(e) {
    e.preventDefault();
    e.stopPropagation();

    // Use the current joystick/keyboard direction at the exact moment
    // Dodge is pressed. Convert camera-relative input into world direction.
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
      const sin = Math.sin(cameraAngle);
      const cos = Math.cos(cameraAngle);
      dodgeDirX = moveX * cos + moveZ * sin;
      dodgeDirZ = -moveX * sin + moveZ * cos;
    } else {
      // With no movement input, dodge in the direction the character faces.
      dodgeDirX = Math.sin(player.rotation.y);
      dodgeDirZ = Math.cos(player.rotation.y);
    }

    dodgeTime = 0.28;
    dodgeDistance = 2.2;
    dodgeButton.classList.add("pressed");
    setTimeout(() => dodgeButton.classList.remove("pressed"), 260);
  }
  function interact(e) {
    e.preventDefault();
    const readout = controls.querySelector("#combat-readout");
    const distance = player.position.distanceTo(opponent.position);
    if (distance <= 6 && opponentHealth <= 0) {
      opponentHealth = 100;
      opponent.visible = true;
      opponentTorso.material.color.set("#8e3438");
      opponent.position.set(0,0,6.5);
      playerHealth = 100;
      readout.textContent = "TRAINING OPPONENT RESET · HEALTH 100%";
    } else if (distance <= 6) {
      readout.textContent = "TRAINING OPPONENT · HEALTH " + opponentHealth + "% · PRESS ATTACK";
    } else {
      readout.textContent = "NOTHING TO USE NEARBY · MOVE TOWARD THE TRAINING OPPONENT";
    }
    interactButton.classList.add("pressed");
    setTimeout(() => interactButton.classList.remove("pressed"), 180);
  }
  attackButton.addEventListener("pointerdown", attack);
  dodgeButton.addEventListener("pointerdown", dodge);
  interactButton.addEventListener("pointerdown", interact);

  const stage = renderer.domElement;
  let cameraPointerId = null;

  // Drag directly on the 3D view to look around. The joystick and RUN
  // controls keep their own pointer, so they can be used simultaneously.
  function cameraDragStart(e) {
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
    let x=joystick.x+(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
    let z=joystick.y+(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
    const length=Math.hypot(x,z);
    if(length>1){x/=length;z/=length;}
    const moving=length>0.08;
    const fast=sprint||keys.has("shift")||keys.has("m");
    attackCooldown = Math.max(0, attackCooldown - dt);
    dodgeTime = Math.max(0, dodgeTime - dt);
    const speed=(fast?7.2:4.2) * (dodgeTime>0 ? 2.2 : 1);
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
    const radius = 0.58;
    const blockedX = buildingColliders.some(b =>
      nextX+radius>b.minX && nextX-radius<b.maxX &&
      player.position.z+radius>b.minZ && player.position.z-radius<b.maxZ
    );
    if (!blockedX) player.position.x=nextX;
    const blockedZ = buildingColliders.some(b =>
      player.position.x+radius>b.minX && player.position.x-radius<b.maxX &&
      nextZ+radius>b.minZ && nextZ-radius<b.maxZ
    );
    if (!blockedZ) player.position.z=nextZ;
    if(moving) player.rotation.y=Math.atan2(dx,dz);

    // Animate arms and legs while walking or running.
    if (moving) walkClock += dt * (fast ? 12 : 8);
    const swing = moving ? Math.sin(walkClock)*0.55 : 0;
    playerParts.arms[0].rotation.x = swing;
    playerParts.arms[1].rotation.x = -swing;
    playerParts.legs[0].rotation.x = -swing;
    playerParts.legs[1].rotation.x = swing;

    // A short, visible punch animation on alternating arms.
    playerAttackTime = Math.max(0, playerAttackTime - dt);
    if (playerAttackTime > 0) {
      const punch = Math.sin((1 - playerAttackTime / 0.34) * Math.PI);
      playerParts.arms[playerAttackSide].rotation.x = -1.75 * punch;
      playerParts.arms[playerAttackSide].rotation.z =
        (playerAttackSide === 0 ? 1 : -1) * 0.18 * punch;
    } else {
      playerParts.arms[0].rotation.z = 0;
      playerParts.arms[1].rotation.z = 0;
    }

    // Opponent AI: notice the player, approach, face them and throw punches.
    const opponentDx = player.position.x-opponent.position.x;
    const opponentDz = player.position.z-opponent.position.z;
    const opponentDistance = Math.hypot(opponentDx,opponentDz);
    if (opponentHealth > 0 && opponentDistance < 15) {
      opponent.rotation.y = Math.atan2(opponentDx,opponentDz);
      if (opponentDistance > 1.65) {
        const approach = Math.min(2.15*dt, opponentDistance-1.55);
        const ox = opponent.position.x + (opponentDx/opponentDistance)*approach;
        const oz = opponent.position.z + (opponentDz/opponentDistance)*approach;
        const opponentBlocked = buildingColliders.some(b =>
          ox+0.5>b.minX && ox-0.5<b.maxX && oz+0.5>b.minZ && oz-0.5<b.maxZ
        );
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
          playerHealth=Math.max(0,playerHealth-8);
          controls.querySelector("#combat-readout").textContent =
            "OPPONENT PUNCHES YOU · YOUR HEALTH "+playerHealth+"%";
        }
        if (opponentPunchTime > 0) {
          const punch = Math.sin((1-opponentPunchTime/0.34)*Math.PI);
          opponentParts.arms[opponentPunchSide].rotation.x = -1.75*punch;
          opponentParts.arms[opponentPunchSide].rotation.z =
            (opponentPunchSide===0?1:-1)*0.18*punch;
        }
      }
    }
    const desired=new THREE.Vector3(player.position.x+Math.sin(cameraAngle)*7,4.1,player.position.z+Math.cos(cameraAngle)*7);
    camera.position.lerp(desired,0.12);
    camera.lookAt(player.position.x,1.15,player.position.z);
    if (opponentFlash > 0) {
      opponentFlash -= dt;
      if (opponentFlash <= 0) opponentTorso.material.color.set(opponentHealth > 0 ? "#8e3438" : "#333333");
    }
    // Keep the defeated training opponent visible so the player can inspect
    // the result and use the USE button to reset the sparring session.
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
    joy.removeEventListener("pointerdown",joyStart);
    joy.removeEventListener("pointermove",joyMove);
    joy.removeEventListener("pointerup",joyEnd);
    joy.removeEventListener("pointercancel",joyEnd);
    sprintOff();
    sprintButton.removeEventListener("pointerdown", sprintToggle);
    attackButton.removeEventListener("pointerdown", attack);
    dodgeButton.removeEventListener("pointerdown", dodge);
    interactButton.removeEventListener("pointerdown", interact);
    stage.removeEventListener("pointerdown", cameraDragStart);
    stage.removeEventListener("pointermove", cameraDragMove);
    stage.removeEventListener("pointerup", cameraDragEnd);
    stage.removeEventListener("pointercancel", cameraDragEnd);

    renderer.dispose();
    scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}});
    container.replaceChildren();
  };
}
