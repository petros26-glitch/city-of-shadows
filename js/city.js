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

  const player = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: characterData?.skin || "#6f402d" });
  const shirt = new THREE.MeshStandardMaterial({ color: characterData?.gender === "female" ? "#55242c" : "#292a31" });
  const pants = new THREE.MeshStandardMaterial({ color: "#17191f" });
  const hair = new THREE.MeshStandardMaterial({ color: "#171116" });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34,0.7,4,8), shirt);
  torso.position.y=1.3; player.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24,10,8), skin);
  head.position.y=2.05; player.add(head);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.75,0.28), pants);
  legs.position.y=0.48; player.add(legs);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(characterData?.hair === "afro" ? 0.29 : 0.245,9,7), hair);
  hairCap.position.set(0,2.22,0); hairCap.scale.y=0.7; player.add(hairCap);
  scene.add(player);
  player.position.set(0,0,4);

  const keys = new Set();
  let joystick = { x: 0, y: 0 };
  let sprint = false;
  let cameraAngle = 0;
  let dragging = false;
  let lastX = 0;
  let animationId = 0;
  let previous = 0;

  const keyDown = e => { if (["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Shift"].includes(e.key)) { keys.add(e.key.toLowerCase()); if(e.key.startsWith("Arrow")) e.preventDefault(); } };
  const keyUp = e => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown",keyDown);
  window.addEventListener("keyup",keyUp);
  const joy = controls.querySelector(".joystick");
  const knob = controls.querySelector(".joystick-knob");
  let joyPointer = null;
  function joyStart(e) { joyPointer=e.pointerId; joy.setPointerCapture(joyPointer); joyMove(e); }
  function joyMove(e) {
    if (joyPointer !== e.pointerId) return;
    const rect=joy.getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    let dx=e.clientX-cx, dy=e.clientY-cy, len=Math.hypot(dx,dy), max=rect.width*0.34;
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    joystick={x:dx/max,y:dy/max};
    knob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  function joyEnd(e) { if(joyPointer!==e.pointerId)return; joyPointer=null; joystick={x:0,y:0}; knob.style.transform="translate(0,0)"; }
  joy.addEventListener("pointerdown",joyStart);
  joy.addEventListener("pointermove",joyMove);
  joy.addEventListener("pointerup",joyEnd);
  joy.addEventListener("pointercancel",joyEnd);
  const sprintButton=controls.querySelector(".sprint-button");
  const sprintOn=()=>{sprint=true;sprintButton.classList.add("pressed");};
  const sprintOff=()=>{sprint=false;sprintButton.classList.remove("pressed");};
  sprintButton.addEventListener("pointerdown",sprintOn);
  sprintButton.addEventListener("pointerup",sprintOff);
  sprintButton.addEventListener("pointercancel",sprintOff);
  sprintButton.addEventListener("pointerleave",sprintOff);
  const stage=renderer.domElement;
  stage.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"){dragging=true;lastX=e.clientX;}});
  window.addEventListener("pointerup",()=>dragging=false);
  window.addEventListener("pointermove",e=>{if(dragging){cameraAngle-=(e.clientX-lastX)*0.006;lastX=e.clientX;}});
  controls.querySelector(".look-left").addEventListener("click",()=>cameraAngle-=0.45);
  controls.querySelector(".look-right").addEventListener("click",()=>cameraAngle+=0.45);

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
    const fast=sprint||keys.has("shift");
    const speed=fast?7.2:4.2;
    const sin=Math.sin(cameraAngle),cos=Math.cos(cameraAngle);
    const dx=(x*cos+z*sin)*speed*dt;
    const dz=(-x*sin+z*cos)*speed*dt;
    player.position.x=THREE.MathUtils.clamp(player.position.x+dx,-42,42);
    player.position.z=THREE.MathUtils.clamp(player.position.z+dz,-42,42);
    if(moving) player.rotation.y=Math.atan2(dx,dz);
    const desired=new THREE.Vector3(player.position.x+Math.sin(cameraAngle)*7,4.1,player.position.z+Math.cos(cameraAngle)*7);
    camera.position.lerp(desired,0.12);
    camera.lookAt(player.position.x,1.15,player.position.z);
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
    renderer.dispose();
    scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}});
    container.replaceChildren();
  };
}
