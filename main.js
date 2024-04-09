import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0b);

// Camera
//const cameraWrapper = new THREE.Group();
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
//cameraWrapper.add(camera);
//camera.position.z = 30;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Colours
const stickerColours = [
	0x00dd00, // Front
	0xcc0000, // Right
	0x2222dd, // Back
	0xff7700, // Left
	0xffff00, // Down
	0xf6f6f6, // Up
	0x333333, // Grayed out
].map((c) => new THREE.Color(c));

// Material
const pieceMaterial = new THREE.MeshToonMaterial({ color: 0x0 });

// Ligths
for (const l of [
	//{ x:  6, y:  6, z:  6, c: 0xaaaaff, s: 200 },
	//{ x: -6, y: -6, z: -6, c: 0xffaaaa, s: 200 },
	//{ x:  8, y:  8, z: -8, c: 0x5555ff, s: 200 },
	//{ x: -8, y: -8, z:  8, c: 0xff5555, s: 200 },
	{ x: 6, y: 6, z: 6, c: 0xaaaaff, s: 150 },
	{ x: -6, y: -6, z: -6, c: 0xffaaaa, s: 150 },
	{ x: 8, y: 8, z: -8, c: 0x5555ff, s: 200 },
	{ x: 8, y: -8, z: 8, c: 0xff5555, s: 200 },
	{ x: -8, y: -8, z: 8, c: 0xff5555, s: 200 },
	{ x: -8, y: 8, z: 8, c: 0x5555ff, s: 200 },
]) {
	const pointLight = new THREE.PointLight(l.c, l.s, 1000);
	scene.add(pointLight);

	pointLight.position.set(l.x, l.y, l.z);

	//const sphereSize = 1;
	//const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
	//scene.add(pointLightHelper);
}

// Cube
let cube = new THREE.Group();
scene.add(cube);

// Sticker array
let stickers = [];

// Loading OBJ files
const loader = new OBJLoader();

let basecorner;
let baseedge;
let basecenter;

const loadingFunction = (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
const errorFunction = (error) => console.log(error);

// Load corner
loader.load("corner.obj", (object) => {
	basecorner = object;

	// Load edge
	loader.load("edge.obj", (object) => {
		baseedge = object;

		// Load center
		loader.load("center.obj", (object) => {
			basecenter = object;

			// Create cube
			createCube();

		}, loadingFunction, errorFunction);
	}, loadingFunction, errorFunction);
}, loadingFunction, errorFunction);

function createCube() {

	// Each side
	for (let i = 0; i < 6; i++) {
		const side = new THREE.Group();
		cube.add(side);

		// Rotate side
		if (i < 4) {
			side.rotateY((Math.PI * i) / 2);
		} else {
			side.rotateX(Math.PI * (i - 3.5));
		}

		for (let j = 0; j < 4; j++) {

			const setupSticker = (sticker) => {
				sticker.children[0].material = new THREE.MeshToonMaterial({ color: stickerColours[i] });
				sticker.targetColour = stickerColours[i];
				sticker.solvedColour = stickerColours[i];
				sticker.children[1].material = pieceMaterial;
				side.add(sticker);
				stickers.push(sticker);
			};

			// Corner
			const corner = basecorner.clone();
			setupSticker(corner);
			corner.rotateZ(-(Math.PI * j) / 2);

			// Edge
			const edge = baseedge.clone();
			setupSticker(edge);
			edge.rotateZ(-(Math.PI * j) / 2);

			// Center
			if (j === 3) {
				const center = basecenter.clone();
				setupSticker(center);
			}
		}
	}

	//stickers[0].children[0].material = new THREE.MeshToonMaterial({ color: 0x00ffff });
}

let positionCounter = 20;

const positions = [
	{ x:  0.1, y:  1.2, z: -0.5 },  // DBL
	{ x:  0.1, y: -1.2, z:  0.5 },  // DBR
	{ x: -0.3, y:  0.3, z:  0.05 }, // DFL
	{ x: -0.3, y: -0.3, z: -0.05 }, // DFR

	{ x:  0.6, y:  1.1, z:  0.0 },  // UBL
	{ x:  0.6, y: -1.1, z: -0.0 },  // UBR
	{ x:  0.4, y:  0.3, z: -0.05 }, // UFL
	{ x:  0.4, y: -0.3, z:  0.05 }, // UFR

	{ x: -0.5, y:  1.3, z:  0.8 },  // BL
	{ x: -0.5, y: -1.3, z: -0.8 },  // BR
	{ x:  0.2, y:  0.4, z: -0.05 }, // FL
	{ x:  0.2, y: -0.4, z:  0.05 }, // FR

	{ x: -0.2, y:  0.4, z: -0.1 },  // DL
	{ x: -0.3, y:  0.0, z:  0.0 },  // DF
	{ x: -0.2, y: -0.4, z:  0.1 },  // DR
	{ x: -0.5, y:  1.3, z:  0.3 },  // DB

	{ x:  0.4, y:  0.4, z: -0.1 },  // UL
	{ x:  0.4, y:  0.0, z:  0.0 },  // UF
	{ x:  0.4, y: -0.4, z:  0.1 },  // UR
	{ x:  1.3, y:  0.2, z: -0.3 },  // UB

	{ x:  0.3, y: -0.0, z:  0.0 },  // Neutral
].map((r) => {
	const qcube = new THREE.Quaternion();
	const qcamera = new THREE.Quaternion();
	qcube.setFromEuler(new THREE.Euler(
		r.x * Math.PI / 4,
		r.y * Math.PI / 4,
		r.z * Math.PI / 4,
	));
	qcamera.setFromEuler(new THREE.Euler(
		-r.x * Math.PI / 4,
		-r.y * Math.PI / 4,
		-r.z * Math.PI / 4,
	));
	return { cube: qcube, camera: qcamera };
});

const cornersData = [
	{ stickers: [ 0, 29, 51], position: 6 },
	{ stickers: [ 2, 49,  9], position: 7 },
	{ stickers: [ 4, 15, 38], position: 3 },
	{ stickers: [ 6, 36, 31], position: 2 },
	{ stickers: [18, 11, 47], position: 5 },
	{ stickers: [20, 45, 27], position: 4 },
	{ stickers: [22, 33, 42], position: 0 },
	{ stickers: [24, 40, 13], position: 1 },
];

const cornersScheme = [
	"h", "x", "s",
	"w", "o", "t",
	"u", "g", "l",
	"p", "v", "k",
	"a", "e", "r",
	"n", "b", "q",
	"f", "d", "i",
	"c", "m", "j",
]

let current;

function resetCorners() {
	for (const sticker of stickers) {
		sticker.targetColour = sticker.solvedColour;
	}

	document.getElementById("previous-letter").textContent = "Press SPACE to start";

	current = { ...cornersData[1] };
	current.twist = 0;
	current.answer = cornersScheme[21].toUpperCase();
}

resetCorners();

function randomRange(min, max) {
	return min + Math.floor(Math.random() * max);
}

function getRandomCorner() {
	return cornersData[randomRange(0, 8)];
}

function nextCorner() {

	document.getElementById("previous-letter").textContent = current.answer.toUpperCase();

	for (let i = 0; i < stickers.length; i++) {
		if (i % 9 === 8) continue;
		stickers[i].targetColour = stickerColours[6];
	}
	
	let corner = getRandomCorner();
	while (corner.position === current.position) {
		corner = getRandomCorner();
	}
	const twist = randomRange(0, 3);
	//const twist = 2;

	for (let i = 0; i < 3; i++) {
		stickers[current.stickers[i]].targetColour = stickers[corner.stickers[(i + twist) % 3]].solvedColour;
	}
	positionCounter = current.position;

	const relativeTwist = (current.twist + twist) % 3;
	const answer = cornersScheme[corner.position * 3 + relativeTwist];

	current = { ...corner };
	current.twist = relativeTwist;
	current.answer = answer;

	console.log(answer);
}

let playing = false;

document.body.addEventListener("keyup", (e) => {
	if (playing) {
		switch (e.key) {
			case " ":
				playing = false;
				resetCorners();
				break;
			case current.answer:
				nextCorner();
				break;
			default:
				scene.background = new THREE.Color(0x862121);
				setTimeout(() => scene.background = new THREE.Color(0x0b0b0b), 200);
		}
		return;
	}

	switch (e.key) {
		case " ":
			playing = true;
			nextCorner();
			break;
	}
});

function animate() {
	requestAnimationFrame(animate);

	for (const sticker of stickers) {
		sticker.children[0].material.color.lerp(sticker.targetColour, 0.2);
	}

	//cube.quaternion.slerp(positions[positionCounter], 0.2);
	if (playing) {
		cube.quaternion.slerp(positions[positionCounter].cube, 0.15);
	} else {
		cube.rotateX(0.005);
		cube.rotateY(0.007);
		cube.rotateZ(-0.003);
	}

	camera.position.set(0, 0, 0);
	camera.quaternion.slerp(positions[positionCounter].camera, 0.15);
	camera.translateZ(30);
	//cameraWrapper.quaternion.slerp(positions[positionCounter].camera, 0.2);
	//cube.rotation.x += 0.05 * (positions[positionCounter]);
	
	renderer.render(scene, camera);
}

if (WebGL.isWebGLAvailable()) {
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById("container").appendChild(warning);
}
