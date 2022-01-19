import { 
  Mesh, 
  RingGeometry, 
  Group, 
  Euler, 
  Clock, 
  Matrix4, 
  Vector3, 
  Vector2, 
  MeshStandardMaterial, 
  WebGLRenderer, 
  Scene, 
  PerspectiveCamera, 
  ACESFilmicToneMapping, 
  sRGBEncoding, 
  Color, 
  DoubleSide, 
  CylinderBufferGeometry, 
  BoxBufferGeometry, 
  PMREMGenerator 
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import envmapPath from "url:./../assets/cannon_1k_blurred.hdr";

let scene = new Scene();
scene.background = new Color("white");

let camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0,0,10);

let renderer = new WebGLRenderer({ });
renderer = new WebGLRenderer({ antialias: true });
renderer.setSize( innerWidth, innerHeight );
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding; 
document.body.appendChild(renderer.domElement);

let pmrem = new PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

let ring1, ring2;
let mousePos = new Vector2(0,0);

(async function init() {
  let envHdrTexture = await new RGBELoader().loadAsync(envmapPath);
  let envRT = pmrem.fromEquirectangular(envHdrTexture);
  
  ring1 = CustomRing(envRT, 0.65, "white");
  ring1.scale.set(0.75, 0.75);
  scene.add(ring1);
  
  ring2 = CustomRing(envRT, 0.35, new Color(0.25, 0.225, 0.215));
  ring2.scale.set(1.05, 1.05);
  scene.add(ring2);

  ring3 = CustomRing(envRT, 0.15, new Color(0.7, 0.7, 0.7));
  ring3.scale.set(1.3, 1.3);
  scene.add(ring3);

  let hourLine = Line(0.4, 0.135, 0.07, envRT, "white", 3);
  scene.add(hourLine);

  let minutesLine = Line(0.8, 0.135, 0.07, envRT, new Color(0.5, 0.5, 0.5), 1);
  scene.add(minutesLine);

  let secondsLine = Line(1, 0.075, 0.07, envRT, new Color(0.2, 0.2, 0.2), 1);
  scene.add(secondsLine);

  let cLines = clockLines(envRT);
  scene.add(cLines);

  let clock = new Clock();
  clock.start();

  renderer.setAnimationLoop(() => {
    ring1.rotation.x = ring1.rotation.x * 0.95 + mousePos.y * 0.06;
    ring1.rotation.y = ring1.rotation.y * 0.95 + mousePos.x * 0.06;

    ring2.rotation.x = ring2.rotation.x * 0.95 + mousePos.y * 0.02;
    ring2.rotation.y = ring2.rotation.y * 0.95 + mousePos.x * 0.02;

    ring3.rotation.x = ring3.rotation.x * 0.95 - mousePos.y * 0.015;
    ring3.rotation.y = ring3.rotation.y * 0.95 - mousePos.x * 0.015;

    let date = new Date();

    let hourAngle = date.getHours() / 12 * Math.PI * 2;
    rotateLine(hourLine, hourAngle, ring1.rotation, 1.0, 0);

    let minutesAngle = date.getMinutes() / 60 * Math.PI * 2;
    rotateLine(minutesLine, minutesAngle, ring1.rotation, 0.8, 0.1);

    let secondsAngle = (date.getSeconds() + date.getMilliseconds() / 1000) / 60 * Math.PI * 2;
    rotateLine(secondsLine, secondsAngle, ring1.rotation, 0.75, -0.1);

    cLines.children.forEach((c, i) => {
      rotateLine(c, i / 12 * Math.PI * 2, ring1.rotation, 1.72, 0.2)
    });

    renderer.render(scene, camera);
  });
})();

window.addEventListener("mousemove", (e) => {
  let x = e.clientX - innerWidth * 0.5; 
  let y = e.clientY - innerHeight * 0.5;

  mousePos.x = x * 0.001;
  mousePos.y = y * 0.001;
});

function rotateLine(line, angle, ringRotation, topTranslation, depthTranslation) {
  let tmatrix  = new Matrix4().makeTranslation(0, topTranslation, depthTranslation);
  let rmatrix  = new Matrix4().makeRotationAxis(new Vector3(0, 0, 1), -angle);
  let r1matrix = new Matrix4().makeRotationFromEuler(new Euler().copy(ringRotation));

  line.matrix.copy(new Matrix4().multiply(r1matrix).multiply(rmatrix).multiply(tmatrix));
  line.matrixAutoUpdate = false;
  line.matrixWorldNeedsUpdate = false;
}

function CustomRing(envRT, thickness, color) {
  let ring = new Mesh(
    new RingGeometry(2, 2 + thickness, 70, 1, 0, Math.PI * 2), 
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
  );
  ring.position.set(0,0, 0.25*0.5);

  let outerCylinder = new Mesh(
    new CylinderBufferGeometry(2 + thickness, 2 + thickness, 0.25, 70, 1, true), 
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
  );
  outerCylinder.rotation.x = Math.PI * 0.5;

  let innerCylinder = new Mesh(
    new CylinderBufferGeometry(2, 2, 0.25, 140, 1, true), 
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
  );
  innerCylinder.rotation.x = Math.PI * 0.5;

  let group = new Group();
  group.add(ring, outerCylinder, innerCylinder);

  return group;
}

function Line(height, width, depth, envRT, color, envMapIntensity) {
  let box = new Mesh(
    new BoxBufferGeometry(width, height, depth),
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity })
  );
  box.position.set(0, 0, 0);

  let topCap = new Mesh(
    new CylinderBufferGeometry(width * 0.5, width * 0.5, depth, 10),
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity })
  );
  topCap.rotation.x = Math.PI * 0.5;
  topCap.position.set(0, +height * 0.5, 0);

  let bottomCap = new Mesh(
    new CylinderBufferGeometry(width * 0.5, width * 0.5, depth, 10),
    new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity })
  );
  bottomCap.rotation.x = Math.PI * 0.5;
  bottomCap.position.set(0, -height * 0.5, 0);

  let group = new Group();
  group.add(box, topCap, bottomCap);

  return group;
}

function clockLines(envRT) {
  let group = new Group();
  
  for(let i = 0; i < 12; i++) {
    let line = Line(0.1, 0.075, 0.025, envRT, new Color(0.65, 0.65, 0.65), 1);
    group.add(line);
  }

  return group;
}