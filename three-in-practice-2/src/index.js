import { WebGLRenderer, ACESFilmicToneMapping, sRGBEncoding, SphereBufferGeometry } from "three";
import { Mesh } from "three";
import { MeshBasicMaterial } from "three";
import { PerspectiveCamera } from "three";
import { Scene } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; 

const scene = new Scene();

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0,0,10);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);

scene.add(new Mesh(new SphereBufferGeometry(1, 5, 5), new MeshBasicMaterial({ color: 0x0 })));

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});