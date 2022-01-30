import { WebGLRenderer, ACESFilmicToneMapping, sRGBEncoding, SphereBufferGeometry, Color, CylinderBufferGeometry, CircleBufferGeometry, RepeatWrapping, DoubleSide, BoxBufferGeometry } from "three";
import { Mesh } from "three";
import { MeshBasicMaterial } from "three";
import { PointLight } from "three";
import { MeshPhysicalMaterial } from "three";
import { PerspectiveCamera } from "three";
import { Scene, PMREMGenerator, DirectionalLight, PCFSoftShadowMap, Object3D, CameraHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; 
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import SimplexNoise from 'simplex-noise';
import { Vector2 } from "three";
import { TextureLoader } from "three";
import { BufferGeometry } from "three";

// envmap https://polyhaven.com/a/herkulessaulen

const scene = new Scene();
// scene.background = new Color("white");
scene.background = new Color("#FFEECC");

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(-17,31,33);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// const light = new DirectionalLight( new Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(), 10 );
// light.position.set(3, 0.5, 1);

const light = new PointLight( new Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(), 80, 200 );
light.position.set(10, 20, 10);

light.castShadow = true; // default false
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default
scene.add( light );

// const helper = new CameraHelper(light.shadow.camera);
// scene.add(helper)

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

  for(let i = -20; i <= 20; i++) {
    for(let j = -20; j <= 20; j++) {
      let position = tileToPosition(i, j);

      if(position.length() > 16) continue;
      
      let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
      noise = Math.pow(noise, 1.5);

      hex(noise * MAX_HEIGHT, position, envmap);
    } 
  }

  stoneMesh = hexMesh(stoneGeo, textures.stone);
  grassMesh = hexMesh(grassGeo, textures.grass);
  dirt2Mesh = hexMesh(dirt2Geo, textures.dirt2);
  dirtMesh = hexMesh(dirtGeo, textures.dirt);
  sandMesh = hexMesh(sandGeo, textures.sand);
  scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh);

  // let seaTexture = textures.sand.clone();
  // seaTexture.needsUpdate = true;
  let seaTexture = textures.water;
  seaTexture.repeat = new Vector2(1, 1);
  seaTexture.wrapS = RepeatWrapping;
  seaTexture.wrapT = RepeatWrapping;

  let seaMesh = new Mesh(
    // new CircleBufferGeometry(11, 6),
    new CylinderBufferGeometry(17, 17, MAX_HEIGHT * 0.2, 50),
    new MeshPhysicalMaterial({
      envMap: envmap,
      color: new Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
      ior: 1.4,
      transmission: 1,
      transparent: true,
      thickness: 1.5,
      envMapIntensity: 0.2, 
      roughness: 1,
      metalness: 0.025,
      roughnessMap: seaTexture,
      metalnessMap: seaTexture,
    })
  );
  // seaMesh.rotation.x = -Math.PI * 0.5;
  seaMesh.receiveShadow = true;
  seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
  seaMesh.position.set(0, MAX_HEIGHT * 0.1, 0);
  scene.add(seaMesh);


  let mapContainer = new Mesh(
    new CylinderBufferGeometry(17.1, 17.1, MAX_HEIGHT * 0.25, 50, 1, true),
    new MeshPhysicalMaterial({
      envMap: envmap,
      map: textures.dirt,
      envMapIntensity: 0.2, 
      side: DoubleSide,
    })
  );
  mapContainer.receiveShadow = true;
  mapContainer.rotation.y = -Math.PI * 0.333 * 0.5;
  mapContainer.position.set(0, MAX_HEIGHT * 0.125, 0);
  scene.add(mapContainer);

  let mapFloor = new Mesh(
    new CylinderBufferGeometry(18.5, 18.5, MAX_HEIGHT * 0.1, 50),
    new MeshPhysicalMaterial({
      envMap: envmap,
      map: textures.dirt2,
      envMapIntensity: 0.1, 
      side: DoubleSide,
    })
  );
  mapFloor.receiveShadow = true;
  mapFloor.position.set(0, -MAX_HEIGHT * 0.05, 0);
  // mapFloor.rotation.x = -Math.PI * 0.5;
  scene.add(mapFloor);

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

let stoneGeo;
let dirtGeo;
let dirt2Geo;
let sandGeo;
let grassGeo;

let stoneMesh;
let dirtMesh;
let dirt2Mesh;
let sandMesh;
let grassMesh;

function hex(height, position) {
  let geo = hexGeometry(height, position);

  if(height > STONE_HEIGHT) {
    if(!stoneGeo) stoneGeo = geo;
    else stoneGeo = mergeBufferGeometries([geo, stoneGeo]);

    if(Math.random() > 0.8) {
      stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
    }
  } else if(height > DIRT_HEIGHT) {
    if(!dirtGeo) dirtGeo = geo;
    else dirtGeo = mergeBufferGeometries([geo, dirtGeo]);

    if(Math.random() > 0.8) {
      grassGeo = mergeBufferGeometries([grassGeo, grass(height, position)]);
    }
  } else if(height > GRASS_HEIGHT) {
    if(!grassGeo) grassGeo = geo;
    else grassGeo = mergeBufferGeometries([geo, grassGeo]);
  } else if(height > SAND_HEIGHT) { 
    if(!sandGeo) sandGeo = geo;
    else sandGeo = mergeBufferGeometries([geo, sandGeo]);

    if(Math.random() > 0.8 && stoneGeo) {
      stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
    }
  } else if(height > DIRT2_HEIGHT) {
    if(!dirt2Geo) dirt2Geo = geo;
    else dirt2Geo = mergeBufferGeometries([geo, dirt2Geo]);
  } 
}

function hexMesh(geo, map) {
  let mat = new MeshPhysicalMaterial({ 
    envMap: envmap, 
    envMapIntensity: 0.135, 
    flatShading: true,
    map
  });

  let mesh = new Mesh(geo, mat);
  mesh.castShadow = true; //default is false
  mesh.receiveShadow = true; //default

  return mesh;
}

function grass(height, position) {
  const treeHeight = Math.random() * 1 + 1.25;

  const geo = new CylinderBufferGeometry(0, 1.5, treeHeight, 3);
  geo.translate(position.x, height + treeHeight * 0 + 1, position.y);
  
  const geo2 = new CylinderBufferGeometry(0, 1.15, treeHeight, 3);
  geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
  
  const geo3 = new CylinderBufferGeometry(0, 0.8, treeHeight, 3);
  geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);

  return mergeBufferGeometries([geo, geo2, geo3]);
}

function stone(height, position) {
  const px = Math.random() * 0.4;
  const pz = Math.random() * 0.4;

  const geo = new BoxBufferGeometry(Math.random() * 0.3 + 0.15, Math.random() * 0.3 + 0.15, Math.random() * 0.3 + 0.15);
  geo.translate(position.x + px, height, position.y + pz);

  return geo;
}