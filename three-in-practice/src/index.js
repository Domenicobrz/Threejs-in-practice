import { 
  Vector2, DoubleSide, MeshBasicMaterial, RingGeometry, PlaneGeometry, Clock, Vector3, Group, FloatType, PMREMGenerator, TextureLoader, Color, Mesh, SphereGeometry, MeshPhysicalMaterial, ACESFilmicToneMapping, sRGBEncoding, PCFSoftShadowMap, DirectionalLight, Scene, PerspectiveCamera, WebGLRenderer,
} from "https://cdn.skypack.dev/three@0.137";
import { OrbitControls } from "https://cdn.skypack.dev/three-stdlib@2.8.5/controls/OrbitControls";
import { RGBELoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/RGBELoader";
import { GLTFLoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/GLTFLoader";
import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

let sunBackground = document.querySelector(".sun-background");
let moonBackground = document.querySelector(".moon-background");

const scene = new Scene();

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 15, 50);


const ringsScene = new Scene();

const ringsCamera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
ringsCamera.position.set(0, 0, 50);


const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

const sunLight = new DirectionalLight(new Color("#FFFFFF"), 3.5);
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

const moonLight = new DirectionalLight(new Color("#77ccff").convertSRGBToLinear(), 0);
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


let mousePos = new Vector2(0,0);

window.addEventListener("mousemove", (e) => {
  let x = e.clientX - innerWidth * 0.5; 
  let y = e.clientY - innerHeight * 0.5;

  mousePos.x = x * 0.0003;
  mousePos.y = y * 0.0003;
});



(async function () {
  let pmrem = new PMREMGenerator(renderer);
  let envmapTexture = await new RGBELoader()
    .setDataType(FloatType)
    .loadAsync("assets/old_room_2k.hdr");  // thanks to https://polyhaven.com/hdris !
  let envMap = pmrem.fromEquirectangular(envmapTexture).texture;


  const ring1 = new Mesh(
    new RingGeometry(15, 13.5, 80, 1, 0),
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
  ring1.sunOpacity = 0.35;
  ring1.moonOpacity = 0.03;
  ringsScene.add(ring1);

  const ring2 = new Mesh(
    new RingGeometry(16.5, 15.75, 80, 1, 0), 
    new MeshBasicMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear(),
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    })
  );
  ring2.sunOpacity = 0.35;
  ring2.moonOpacity = 0.1;
  ringsScene.add(ring2);

  const ring3 = new Mesh(
    new RingGeometry(18, 17.75, 80),
    new MeshBasicMaterial({
      color: new Color("#FFCB8E").convertSRGBToLinear().multiplyScalar(50),
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    })
  );
  ring3.sunOpacity = 0.35;
  ring3.moonOpacity = 0.03;
  ringsScene.add(ring3);


  let textures = {
    // thanks to https://free3d.com/user/ali_alkendi !
    bump: await new TextureLoader().loadAsync("assets/earthbump.jpg"),
    map: await new TextureLoader().loadAsync("assets/earthmap.jpg"),
    spec: await new TextureLoader().loadAsync("assets/earthspec.jpg"),
    planeTrailMask: await new TextureLoader().loadAsync("assets/mask.png"),
  };

  // "Cartoon Plane" (https://skfb.ly/UOLT) by antonmoek
  let plane = (await new GLTFLoader().loadAsync("assets/plane/scene.glb")).scene.children[0];
  let planesData = [
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
    makePlane(plane, textures.planeTrailMask, envMap, scene),
  ];

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
  sphere.sunEnvIntensity = 0.4;
  sphere.moonEnvIntensity = 0.1;
  sphere.rotation.y += Math.PI * 1.25;
  sphere.receiveShadow = true;
  scene.add(sphere);

  let clock = new Clock();

  let daytime = true;
  let animating = false;
  window.addEventListener("mousemove", (e) => {
    if(animating) return;

    let anim;
    if(e.clientX > (innerWidth - 200) && !daytime) {
      anim = [1, 0];
    } else if(e.clientX < 200 && daytime) {
      anim = [0, 1];
    } else {
      return;
    }

    animating = true;

    let obj = { t: 0 };
    anime({
      targets: obj,
      t: anim,
      complete: () => {
        animating = false;
        daytime = !daytime;
      },
      update: () => {
        sunLight.intensity = 3.5 * (1-obj.t);
        moonLight.intensity = 3.5 * obj.t;

        sunLight.position.setY(20 * (1-obj.t));
        moonLight.position.setY(20 * obj.t);

        sphere.material.sheen = (1-obj.t);

        scene.children.forEach((child) => {
          child.traverse((object) => {
            if(object instanceof Mesh && object.material.envMap) {
              object.material.envMapIntensity = object.sunEnvIntensity * (1-obj.t) + object.moonEnvIntensity * obj.t;
            }
          });
        });

        ringsScene.children.forEach((child, i) => {
          child.traverse((object) => {
            object.material.opacity = object.sunOpacity * (1-obj.t) + object.moonOpacity * obj.t;
          });
        });

        sunBackground.style.opacity = 1-obj.t;
        moonBackground.style.opacity = obj.t;
      },
      easing: 'easeInOutSine',
      duration: 500,
    });
  });


  renderer.setAnimationLoop(() => {
    let delta = clock.getDelta();

    planesData.forEach(planeData => {
      let plane = planeData.group;
    
      plane.position.set(0,0,0);
      plane.rotation.set(0,0,0);
      plane.updateMatrixWorld();
  
      planeData.rot += delta * 0.25;
      plane.rotateOnAxis(planeData.randomAxis, planeData.randomAxisRot); // random axis
      plane.rotateOnAxis(new Vector3(0, 1, 0), planeData.rot);    // y-axis rotation
      plane.rotateOnAxis(new Vector3(0, 0, 1), planeData.rad);    // this decides the radius
      plane.translateY(planeData.yOff);
      plane.rotateOnAxis(new Vector3(1,0,0), +Math.PI * 0.5);
    });

    controls.update();
    renderer.render(scene, camera);


    ring1.rotation.x = ring1.rotation.x * 0.95 + mousePos.y * 0.05 * 1.2;
    ring1.rotation.y = ring1.rotation.y * 0.95 + mousePos.x * 0.05 * 1.2;

    ring2.rotation.x = ring2.rotation.x * 0.95 + mousePos.y * 0.05 * 0.375;
    ring2.rotation.y = ring2.rotation.y * 0.95 + mousePos.x * 0.05 * 0.375;

    ring3.rotation.x = ring3.rotation.x * 0.95 - mousePos.y * 0.05 * 0.275;
    ring3.rotation.y = ring3.rotation.y * 0.95 - mousePos.x * 0.05 * 0.275;


    renderer.autoClear = false;
    renderer.render(ringsScene, ringsCamera);
    renderer.autoClear = true;
  });
})();


function makePlane(planeMesh, trailTexture, envMap, scene) {
  let plane = planeMesh.clone();
  plane.scale.set(0.001, 0.001, 0.001);
  plane.position.set(0,0,0);
  plane.rotation.set(0,0,0);
  plane.updateMatrixWorld();

  plane.traverse((object) => {
    if(object instanceof Mesh) {
      object.material.envMap = envMap;
      object.sunEnvIntensity = 1;
      object.moonEnvIntensity = 0.3;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  let trail = new Mesh(
    new PlaneGeometry(1, 2),
    new MeshPhysicalMaterial({
      envMap,
      envMapIntensity: 3,

      // color: new Color(1.0, 0.0, 0.5),
      roughness: 0.4,
      metalness: 0,
      transmission: 1,

      transparent: true,
      opacity: 1,
      alphaMap: trailTexture,
    })
  );
  trail.sunEnvIntensity = 3;
  trail.moonEnvIntensity = 0.7;
  trail.rotateX(Math.PI);
  trail.translateY(1.1);

  let group = new Group();
  group.add(plane);
  group.add(trail);

  scene.add(group);

  return {
    group,
    rot: Math.random() * Math.PI * 2.0,
    rad: Math.random() * Math.PI * 0.45 + 0.2,
    yOff: 10.5 + Math.random() * 1.0,
    randomAxis: new Vector3(nr(), nr(), nr()).normalize(),
    randomAxisRot: Math.random() * Math.PI * 2,
  };
}

function nr() {
  return Math.random() * 2 - 1;
}