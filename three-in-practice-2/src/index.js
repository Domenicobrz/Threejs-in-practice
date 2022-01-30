import { WebGLRenderer, ACESFilmicToneMapping, sRGBEncoding, SphereBufferGeometry, Color, CylinderBufferGeometry, CircleBufferGeometry, RepeatWrapping } from "three";
import { Mesh } from "three";
import { MeshBasicMaterial } from "three";
import { PointLight } from "three";
import { MeshPhysicalMaterial } from "three";
import { PerspectiveCamera } from "three";
import { Scene, PMREMGenerator, DirectionalLight, PCFSoftShadowMap, Object3D, CameraHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; 
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import SimplexNoise from 'simplex-noise';
import { Vector2 } from "three";
import { TextureLoader } from "three";
import { BufferGeometry } from "three";

// envmap https://polyhaven.com/a/herkulessaulen

const scene = new Scene();
scene.background = new Color("white");

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0,20,20);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const light = new DirectionalLight( new Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(), 10 );
// light.position.set(3, 1, 1);
light.position.set(3, 0.5, 1);
light.castShadow = true; // default false
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default
scene.add( light );

const helper = new CameraHelper(light.shadow.camera);
scene.add(helper)

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

let pmrem = new PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

let envmap;
let textures;

const MAX_HEIGHT = 10;

(async function() {
  let envmapTexture = await new RGBELoader().loadAsync("assets/envmap.hdr");
  let rt = pmrem.fromEquirectangular(envmapTexture);
  envmap = rt.texture;

  textures = {
    dirt: await new TextureLoader().loadAsync("assets/dirt.png"),
    dirt2: await new TextureLoader().loadAsync("assets/dirt2.jpg"),
    grass: await new TextureLoader().loadAsync("assets/grass.jpg"),
    sand: await new TextureLoader().loadAsync("assets/sand.jpg"),
    water: await new TextureLoader().loadAsync("assets/water.jpg"),
    stone: await new TextureLoader().loadAsync("assets/stone.png"),
  };

  const simplex = new SimplexNoise(); // optional seed as a string parameter

  for(let i = -10; i <= 10; i++) {
    for(let j = -10; j <= 10; j++) {
      let position = tileToPosition(i, j);

      if(position.length() > 12) continue;
      
      let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
      noise = Math.pow(noise, 1.5);

      scene.add(hexMesh(noise * MAX_HEIGHT, position, envmap));
    } 
  }

  // let seaTexture = textures.sand.clone();
  // seaTexture.needsUpdate = true;
  let seaTexture = textures.water;
  seaTexture.repeat = new Vector2(1, 1);
  seaTexture.wrapS = RepeatWrapping;
  seaTexture.wrapT = RepeatWrapping;

  let seaMesh = new Mesh(
    // new CircleBufferGeometry(11, 6),
    new CylinderBufferGeometry(13, 13, MAX_HEIGHT * 0.3, 6),
    new MeshPhysicalMaterial({
      envMap: envmap,
      ior: 1.4,
      transmission: 1,
      color: new Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
      transparent: true,
      roughness: 1,
      metalness: 0.025,
      thickness: 1.5,
      transmissionColor: new Color(0xff0000),
      roughnessMap: seaTexture,
      metalnessMap: seaTexture,
    })
  );
  // seaMesh.rotation.x = -Math.PI * 0.5;
  seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
  seaMesh.position.set(0, MAX_HEIGHT * 0.15, 0);

  scene.add(seaMesh);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
})();

function tileToPosition(tileX, tileY) {
  return new Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
}

function hexGeometry(height, position) {
  // let base = new CircleBufferGeometry(1, 6);
  let geo  = new CylinderBufferGeometry(1, 1, height, 6, 1, false);
  geo.translate(position.x, height * 0.5, position.y);
  // let top  = new CylinderBufferGeometry()

  return geo;
}

const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

let stoneGeo = new BufferGeometry();
let dirtGeo = new BufferGeometry();
let dirt2Geo = new BufferGeometry();
let sandGeo = new BufferGeometry();
let grassGeo = new BufferGeometry();

function hexMesh(height, position) {
  let geo = hexGeometry(height, position);

  console.log(height);

  let map;
  if(height > DIRT2_HEIGHT) map = textures.dirt2;
  if(height > SAND_HEIGHT) map = textures.sand;
  if(height > GRASS_HEIGHT) map = textures.grass;
  if(height > DIRT_HEIGHT) map = textures.dirt;
  if(height > STONE_HEIGHT) map = textures.stone;

  let mat = new MeshPhysicalMaterial({ 
    envMap: envmap, 
    envMapIntensity: 0.2, 
    flatShading: true,
    map
  });

  let mesh = new Mesh(geo, mat);
  mesh.castShadow = true; //default is false
  mesh.receiveShadow = true; //default

  return mesh;
}