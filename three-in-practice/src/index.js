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
  CameraHelper,
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

const light = new DirectionalLight(
  new Color("#FFFFFF").convertSRGBToLinear(),
  3.5,
  200,
);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
light.shadow.camera.left = -10;
light.shadow.camera.bottom = -10;
light.shadow.camera.top = 10;
light.shadow.camera.right = 10;
scene.add(light);

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
      // roughness: 0,
      // metalnessMap: textures.spec,
      roughnessMap: textures.spec,
      bumpMap: textures.bump,
      bumpScale: 0.05,
      // displacementMap: textures.spec,
      // // displacementScale: 1,
      envMap,
      envMapIntensity: 0.4,
      sheen: 1,
      sheenRoughness: 0.75,
      // sheenColor: new Color("#FFCB8E").convertSRGBToLinear(),
      // sheenColor: new Color("#d18832").convertSRGBToLinear(),
      sheenColor: new Color("#ff8a00").convertSRGBToLinear(),
      clearcoat: 0.5,
      // flatShading: true,
    }),
  );
  sphere.rotation.y += Math.PI * 1.25;
  sphere.castShadow = true;
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
  ringsScene.add(ring3);


  let plane = (await new GLTFLoader().loadAsync("assets/plane/scene.gltf")).scene.children[0];
  plane.scale.set(0.001, 0.001, 0.001);
  plane.traverse((object) => {
    if(object instanceof Mesh) {
      object.material.envMap = envMap;
      // object.material.color = new Color("#FFCB8E");
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(plane);

  let clock = new Clock();
  let planeRot = 0;

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
    planeRot += delta * 0.25;
    plane.rotateOnAxis(new Vector3(0, 0, 1).normalize(), 0.65);   // random axis
    plane.rotateOnAxis(new Vector3(0, 1, 0), planeRot);   // y-axis rotation
    plane.rotateOnAxis(new Vector3(0, 0, 1), 0.95);        // this decides the radius
    plane.translateY(11);
    plane.rotateOnAxis(new Vector3(1,0,0), -Math.PI * 0.5);


    renderer.autoClear = false;
    renderer.render(ringsScene, ringsCamera);
    renderer.autoClear = true;
  });
})();

function nr() {
  return Math.random() * 2 - 1;
}

window.addEventListener("mousemove", (e) => {
  let x = e.clientX - innerWidth * 0.5; 
  let y = e.clientY - innerHeight * 0.5;

  mousePos.x = x * 0.0003;
  mousePos.y = y * 0.0003;
});