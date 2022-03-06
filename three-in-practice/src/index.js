import {
  DoubleSide,
  PCFSoftShadowMap,
  MeshPhysicalMaterial,
  TextureLoader,
  FloatType,
  PMREMGenerator,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  ACESFilmicToneMapping,
  sRGBEncoding,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  Vector2,
  DirectionalLight,
  Clock,
  RepeatWrapping,
  RingGeometry,
  Vector3,
  PlaneGeometry,
  CameraHelper,
  Group,
} from "https://cdn.skypack.dev/three@0.137";
import { RGBELoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/RGBELoader";
import { OrbitControls } from "https://cdn.skypack.dev/three-stdlib@2.8.5/controls/OrbitControls";
import { GLTFLoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/GLTFLoader";

const scene = new Scene();
scene.background = new Color("#FFEECC");

const ringsScene = new Scene();

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 15, 50);

const ringsCamera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
ringsCamera.position.set(0, 0, 50);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const sunLight = new DirectionalLight(
  new Color("#FFFFFF").convertSRGBToLinear(),
  3.5,
);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 512;
sunLight.shadow.mapSize.height = 512;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.bottom = -10;
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.right = 10;
scene.add(sunLight);

const moonLight = new DirectionalLight(
  // new Color("#66aaff").convertSRGBToLinear(),
  new Color("#77ccff").convertSRGBToLinear(),
  // new Color("#cceeff").convertSRGBToLinear(),
  0,
);
moonLight.position.set(-10, 20, 10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 512;
moonLight.shadow.mapSize.height = 512;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 100;
moonLight.shadow.camera.left = -10;
moonLight.shadow.camera.bottom = -10;
moonLight.shadow.camera.top = 10;
moonLight.shadow.camera.right = 10;
scene.add(moonLight);

// // Create a helper for the shadow camera (optional)
// const helper = new CameraHelper( light.shadow.camera );
// scene.add( helper );

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

let mousePos = new Vector2(0,0);

(async function () {
  let pmrem = new PMREMGenerator(renderer);
  let envmapTexture = await new RGBELoader()
    .setDataType(FloatType)
    .loadAsync("assets/old_room_2k.hdr");
  let envMap = pmrem.fromEquirectangular(envmapTexture).texture;

  let textures = {
    bump: await new TextureLoader().loadAsync("assets/earthbump1k.jpg"),
    map: await new TextureLoader().loadAsync("assets/earthmap1k4.jpg"),
    // map: await new TextureLoader().loadAsync("assets/earthmap1k.jpg"),
    spec: await new TextureLoader().loadAsync("assets/earthspec1k4.jpg"),
    flakes: await new TextureLoader().loadAsync("assets/flakes.jpg"),
    planeTrailMask: await new TextureLoader().loadAsync("assets/mask.png"),
  };

  // Important to know!
  // textures.map.encoding = sRGBEncoding;

  textures.flakes.repeat = new Vector2(60, 60);
  textures.flakes.wrapS = RepeatWrapping;
  textures.flakes.wrapT = RepeatWrapping;


  let sphere = new Mesh(
    new SphereGeometry(10, 70, 70),
    new MeshPhysicalMaterial({
      map: textures.map,
      roughnessMap: textures.spec,
      bumpMap: textures.bump,
      bumpScale: 0.05,
      envMap,
      envMapIntensity: 0.4,
      sheen: 1,
      sheenRoughness: 0.75,
      sheenColor: new Color("#ff8a00").convertSRGBToLinear(),
      clearcoat: 0.5,
    }),
  );
  sphere.rotation.y += Math.PI * 1.25;
  sphere.receiveShadow = true;
  scene.add(sphere);


  const ring1 = new Mesh(
    // new RingGeometry(15, 14.5, 80),
    new RingGeometry(15, 13.5, 80, 1, 0), // Math.PI * 0.5 + 0.1, Math.PI * 2 - 0.2),
    new MeshPhysicalMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear().multiplyScalar(200),
      roughness: 0.25,
      envMap,
      envMapIntensity: 1.8,
      side: DoubleSide,
      transparent: true,
      opacity: 0.35,
    })
  );
  ring1.name = "ring";
  ringsScene.add(ring1);

  const ring2 = new Mesh(
    // new RingGeometry(16, 15.75, 80),
    new RingGeometry(16.5, 15.75, 80, 1, 0), // Math.PI * 1.5 + 0.4, Math.PI * 2 - 0.8),
    new MeshBasicMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear(),
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    })
  );
  ring2.name = "ring";
  ringsScene.add(ring2);

  const ring3 = new Mesh(
    // new RingGeometry(18, 17.75, 80),
    new RingGeometry(18, 17.75, 80),
    new MeshBasicMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear().multiplyScalar(50),
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    })
  );
  ring3.name = "ring";
  ringsScene.add(ring3);


  // https://sketchfab.com/3d-models/cartoon-plane-f312ec9f87794bdd83630a3bc694d8ea#download
  // "Cartoon Plane" (https://skfb.ly/UOLT) by antonmoek is licensed under Creative Commons Attribution 
  // (http://creativecommons.org/licenses/by/4.0/).
  // let plane = (await new GLTFLoader().loadAsync("assets/plane/scene.gltf")).scene.children[0];
  let plane = (await new GLTFLoader().loadAsync("assets/plane/scene5.glb")).scene.children[0];
  let planesData = [
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
  ];


  window.addEventListener("keypress", (e) => {
    if(e.key == "k") {
      sunLight.intensity = 0;
      moonLight.intensity = 3.5;

      sphere.material.sheen = 0;
      scene.children.forEach((child) => {
        child.traverse((object) => {
          if(object instanceof Mesh && object.material.envMap) {
            object.material.envMapIntensity *= 0.35;
          }
        });
      });

      ringsScene.children.forEach((child, i) => {
        child.traverse((object) => {
          object.material.opacity *= i == 1 ? 0.15 : 0.05;
        });
      });

      // scene.background = new Color("#304255").convertSRGBToLinear();
      scene.background = new Color("#303742").multiplyScalar(1.7).convertSRGBToLinear();
    }
    if(e.key == "l") {
      sunLight.intensity = 3.5;
      moonLight.intensity = 0;

      sphere.material.sheen = 1;
      scene.children.forEach((child) => {
        child.traverse((object) => {
          if(object instanceof Mesh && object.material.envMap) {
            object.material.envMapIntensity *= 1 / 0.35;
          }
        });
      });

      ringsScene.children.forEach((child, i) => {
        child.traverse((object) => {
          object.material.opacity *= i == 1 ? 1 / 0.15 : 1 / 0.05;
        });
      });

      scene.background = new Color("#FFEECC");
    }
  });


  let clock = new Clock();

  renderer.setAnimationLoop(() => {

    let delta = clock.getDelta();
    sphere.rotation.y += delta * 0.05;

    controls.update();
    renderer.render(scene, camera);


    ring1.rotation.x = ring1.rotation.x * 0.95 + mousePos.y * 0.05 * 1.2;
    ring1.rotation.y = ring1.rotation.y * 0.95 + mousePos.x * 0.05 * 1.2;

    ring2.rotation.x = ring2.rotation.x * 0.95 + mousePos.y * 0.05 * 0.375;
    ring2.rotation.y = ring2.rotation.y * 0.95 + mousePos.x * 0.05 * 0.375;

    ring3.rotation.x = ring3.rotation.x * 0.95 - mousePos.y * 0.05 * 0.275;
    ring3.rotation.y = ring3.rotation.y * 0.95 - mousePos.x * 0.05 * 0.275;


    planesData.forEach(planeData => {
      let plane = planeData.group;
    
      plane.position.set(0,0,0);
      plane.rotation.set(0,0,0);
      plane.updateMatrixWorld();
      /**
       * idea: first rotate like that:
       * 
       *          y-axis
       *  airplane  ^
       *      \     |     /
       *       \    |    /
       *        \   |   /
       *         \  |  /
       *     angle ^
       * 
       * then at the end apply a rotation on a random axis
       */           
      planeData.rot += delta * 0.25;
      plane.rotateOnAxis(planeData.randomAxis, planeData.randomAxisRot); // random axis
      plane.rotateOnAxis(new Vector3(0, 1, 0), planeData.rot);    // y-axis rotation
      plane.rotateOnAxis(new Vector3(0, 0, 1), planeData.rad);    // this decides the radius
      plane.translateY(planeData.yOff);
      plane.rotateOnAxis(new Vector3(1,0,0), +Math.PI * 0.5);
    });

    renderer.autoClear = false;
    renderer.render(ringsScene, ringsCamera);
    renderer.autoClear = true;
  });
})();

function nr() {
  return Math.random() * 2 - 1;
}

function makePlane(planeMesh, trailTexture, envMap, scene) {
  let plane = planeMesh.clone();
  plane.scale.set(0.001, 0.001, 0.001);
  plane.position.set(0,0,0);
  plane.rotation.set(0,0,0);
  plane.updateMatrixWorld();

  plane.traverse((object) => {
    if(object instanceof Mesh) {
      object.material.envMap = envMap;
      // object.material.color = new Color("#FFCB8E");
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  
  let trail = new Mesh(
    new PlaneGeometry(1, 2),
    new MeshPhysicalMaterial({
      envMap,
      envMapIntensity: 3,

      roughness: 0.4,
      metalness: 0,
      transmission: 1,

      transparent: true,
      opacity: 1,
      alphaMap: trailTexture,
    })
  );
  trail.rotateX(Math.PI);
  trail.translateY(1.1);

  let group = new Group();
  group.add(plane);
  group.add(trail);

  scene.add(group);

  return {
    group,
    yOff: 10.5 + Math.random() * 1.0,
    rot: Math.PI * 2,  // just to set a random starting point
    rad: Math.random() * Math.PI * 0.45 + Math.PI * 0.05,
    randomAxis: new Vector3(nr(), nr(), nr()).normalize(),
    randomAxisRot: Math.random() * Math.PI * 2,
  };
}

window.addEventListener("mousemove", (e) => {
  let x = e.clientX - innerWidth * 0.5; 
  let y = e.clientY - innerHeight * 0.5;

  mousePos.x = x * 0.0003;
  mousePos.y = y * 0.0003;
});