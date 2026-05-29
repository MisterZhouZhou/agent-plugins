import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const drawCalls = document.querySelector('#drawCalls');
const triangles = document.querySelector('#triangles');
const pickState = document.querySelector('#pickState');
const toggleSpin = document.querySelector('#toggleSpin');
const toggleHelpers = document.querySelector('#toggleHelpers');
const exposure = document.querySelector('#exposure');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10151b);
scene.fog = new THREE.Fog(0x10151b, 8, 22);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(5.4, 3.4, 6.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(exposure.value);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 0.8, 0);

const world = new THREE.Group();
scene.add(world);

const objectGroup = new THREE.Group();
world.add(objectGroup);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b3034,
  roughness: 0.86,
  metalness: 0.08
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
world.add(floor);

const materials = {
  brass: new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    metalness: 0.76,
    roughness: 0.3
  }),
  ceramic: new THREE.MeshStandardMaterial({
    color: 0xf1eee5,
    metalness: 0.08,
    roughness: 0.42
  }),
  graphite: new THREE.MeshStandardMaterial({
    color: 0x252c32,
    metalness: 0.42,
    roughness: 0.28
  }),
  accent: new THREE.MeshStandardMaterial({
    color: 0x6be4c6,
    metalness: 0.2,
    roughness: 0.18,
    emissive: 0x09221d,
    emissiveIntensity: 0.45
  })
};

const selectable = [];

function createMesh(name, geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.baseMaterial = material;
  objectGroup.add(mesh);
  selectable.push(mesh);
  return mesh;
}

createMesh('brass torus', new THREE.TorusKnotGeometry(0.82, 0.24, 140, 18), materials.brass, new THREE.Vector3(-1.55, 1.06, 0));
createMesh('ceramic cube', new THREE.BoxGeometry(1.2, 1.2, 1.2, 4, 4, 4), materials.ceramic, new THREE.Vector3(0, 0.6, 0));
createMesh('graphite sphere', new THREE.SphereGeometry(0.72, 48, 32), materials.graphite, new THREE.Vector3(1.55, 0.72, 0));

const accentRing = createMesh('accent ring', new THREE.TorusGeometry(2.4, 0.025, 12, 160), materials.accent, new THREE.Vector3(0, 0.06, 0));
accentRing.rotation.x = Math.PI / 2;
accentRing.castShadow = false;

const hemi = new THREE.HemisphereLight(0xf7efe0, 0x18222a, 1.25);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
keyLight.position.set(4, 7, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 18;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
keyLight.shadow.bias = -0.00018;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x6be4c6, 36, 12, 2);
rimLight.position.set(-3.8, 2.4, -3.2);
scene.add(rimLight);

const helpers = new THREE.Group();
helpers.name = 'debug helpers';
helpers.add(new THREE.GridHelper(18, 18, 0x53606a, 0x2f373d));
helpers.add(new THREE.AxesHelper(2.2));
scene.add(helpers);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(99, 99);
const highlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcf5a,
  metalness: 0.36,
  roughness: 0.22,
  emissive: 0x2b1700,
  emissiveIntensity: 0.55
});

let hovered = null;
let selected = null;
let spinning = true;

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function restoreMaterial(mesh) {
  if (mesh && mesh !== selected) {
    mesh.material = mesh.userData.baseMaterial;
  }
}

function setHover(mesh) {
  if (hovered === mesh) return;
  restoreMaterial(hovered);
  hovered = mesh;
  if (hovered && hovered !== selected) {
    hovered.material = highlightMaterial;
  }
  pickState.textContent = hovered ? `hover ${hovered.name}` : 'Hover or click an object';
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(selectable, false);
  setHover(hits[0]?.object ?? null);
}

function selectCurrent() {
  if (!hovered) return;
  if (selected && selected !== hovered) {
    selected.material = selected.userData.baseMaterial;
  }
  selected = hovered;
  selected.material = highlightMaterial;
  pickState.textContent = `selected ${selected.name}`;
}

function resizeRendererToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const needResize = canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio);

  if (needResize) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function updateMetrics() {
  drawCalls.textContent = `calls ${renderer.info.render.calls}`;
  triangles.textContent = `triangles ${renderer.info.render.triangles}`;
}

canvas.addEventListener('pointermove', (event) => {
  setPointerFromEvent(event);
  pick();
});
canvas.addEventListener('pointerleave', () => {
  pointer.set(99, 99);
  setHover(null);
});
canvas.addEventListener('click', selectCurrent);

toggleSpin.addEventListener('click', () => {
  spinning = !spinning;
  toggleSpin.textContent = spinning ? 'Pause' : 'Spin';
  toggleSpin.setAttribute('aria-pressed', String(spinning));
});

toggleHelpers.addEventListener('click', () => {
  helpers.visible = !helpers.visible;
  toggleHelpers.setAttribute('aria-pressed', String(helpers.visible));
});

exposure.addEventListener('input', () => {
  renderer.toneMappingExposure = Number(exposure.value);
});

function animate() {
  resizeRendererToDisplaySize();
  if (spinning) {
    objectGroup.rotation.y += 0.006;
    accentRing.rotation.z -= 0.01;
  }
  controls.update();
  pick();
  renderer.render(scene, camera);
  updateMetrics();
}

renderer.setAnimationLoop(animate);

window.addEventListener('beforeunload', () => {
  renderer.setAnimationLoop(null);
  controls.dispose();
  canvas.replaceWith(canvas.cloneNode(false));
  selectable.forEach((mesh) => mesh.geometry.dispose());
  Object.values(materials).forEach((material) => material.dispose());
  floor.geometry.dispose();
  floorMaterial.dispose();
  highlightMaterial.dispose();
  renderer.dispose();
});
