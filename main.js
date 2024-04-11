import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

// Scene
const scene = new THREE.Scene();
const grayColour = new THREE.Color(0x0b0b0b);
const inputtingColour = new THREE.Color(0x00ffff);
scene.background = grayColour;

// Camera
const camera = new THREE.PerspectiveCamera(
	25,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.dampingFactor = 0.25;
controls.enableDamping = true;

// Colours
function resetColours() {
	const defaultColours = [
		0x00dd00, // Front
		0xcc0000, // Right
		0x2222dd, // Back
		0xff7700, // Left
		0xffff00, // Down
		0xf6f6f6, // Up
		0x333333, // Grayed out
	];
	localStorage.setItem("colourScheme", JSON.stringify(defaultColours));
	stickerColours = defaultColours.map((c) => new THREE.Color(c));
}

if (!localStorage.hasOwnProperty("colourScheme")) {
	resetColours();
}

let letterScheme;

// Letters
function resetLetters() {
	localStorage.setItem(
		"letterScheme",
		"hxswotuglpvkaernbqfdicmjrhntlfjpgxkuovswedicmbqa",
	);
	letterScheme = localStorage.getItem("letterScheme");
}

if (!localStorage.hasOwnProperty("letterScheme")) {
	resetLetters();
} else {
	letterScheme = localStorage.getItem("letterScheme");
}

let stickerColours = JSON.parse(localStorage.getItem("colourScheme")).map(
	(c) => new THREE.Color(c),
);

function updateLetters() {
	for (const sticker of stickers) {
		if (sticker.index === undefined) {
			continue;
		}
		sticker.parent.children[0].children[sticker.index % 9].geometry =
			letters[letterScheme[schemeIndexes[sticker.index]]];
	}
}

// Material
//const pieceMaterial = new THREE.MeshBasicMaterial({ color: 0x0 });
//const pieceMaterial = new THREE.MeshToonMaterial({ color: 0x0 });
const pieceMaterial = new THREE.MeshStandardMaterial({
	color: 0x0,
});
const letterMaterial = new THREE.MeshStandardMaterial({
	color: 0x0,
	visible: false,
});

// Ligths
for (const l of [
	// for toon material
	//{ x:  6, y:  6, z:  6, c: 0xaaaaff, s: 150 },
	//{ x: -6, y: -6, z: -6, c: 0xffaaaa, s: 150 },
	//{ x:  8, y:  8, z: -8, c: 0x5555ff, s: 200 },
	//{ x:  8, y: -8, z:  8, c: 0xff5555, s: 200 },
	//{ x: -8, y: -8, z:  8, c: 0xff5555, s: 200 },
	//{ x: -8, y:  8, z:  8, c: 0x5555ff, s: 200 },

	{ x: 6, y: 6, z: 6, c: 0xddddff, s: 180 },
	{ x: -6, y: -6, z: -6, c: 0xffdddd, s: 180 },
	{ x: 8, y: 8, z: -8, c: 0xaaaaff, s: 240 },
	{ x: 8, y: -8, z: 8, c: 0xffaaaa, s: 240 },
	{ x: -8, y: -8, z: 8, c: 0xffaaaa, s: 240 },
	{ x: -8, y: 8, z: 8, c: 0xaaaaff, s: 240 },
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

const loadingFunction = (xhr) =>
	console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
const errorFunction = (error) => console.log(error);

// Load corner
loader.load(
	"corner_stickered.obj",
	(object) => {
		basecorner = object;

		// Load edge
		loader.load(
			"edge_stickered.obj",
			(object) => {
				baseedge = object;

				// Load center
				loader.load(
					"center_stickered.obj",
					(object) => {
						basecenter = object;

						// Font
						const fontLoader = new FontLoader();

						fontLoader.load(
							//"./fonts/optimer_bold.typeface.json",
							"./fonts/columbia_serial_bold.json",
							(font) => {
								// Create cube
								createCube(font);
							},
							loadingFunction,
							errorFunction,
						);
					},
					loadingFunction,
					errorFunction,
				);
			},
			loadingFunction,
			errorFunction,
		);
	},
	loadingFunction,
	errorFunction,
);

//   CORNERS
//   0 1 2 3 4 5 6 7 8 9
//   h x s w o t u g l p
//
// 1|0 1 2 3 4 5 6 7 8 9
//   v k a e r n b q f d
//
//          |EDGES
// 2|0 1 2 3|4 5 6 7 8 9
//   i c m j|r h n t l f
//
// 3|0 1 2 3 4 5 6 7 8 9
//   j p g x k u o v s w
//
// 4|0 1 2 3 4 5 6 7
//   e d i c m b q a

const letters = {};
// prettier-ignore
const schemeIndexes = [
	 8, 28, 20, 42, 23, 30, 11, 34, undefined,
	 9, 31, 22, 44, 15, 26,  4, 36, undefined,
	 5, 27, 17, 46, 14, 24,  2, 38, undefined,
	 0, 25, 13, 40, 18, 29,  7, 32, undefined,
	 1, 33,  6, 35, 10, 37,  3, 39, undefined,
	19, 41, 12, 47, 16, 45, 21, 43, undefined,
];

function createCube(font) {
	for (const l of abc) {
		const letter = new TextGeometry(l.toUpperCase(), {
			font: font,
			size: 0.8,
			depth: 0.05,
		});
		letter.computeBoundingBox();
		const center = letter.boundingBox.getCenter(new THREE.Vector3());
		const offsetX = center.x;
		const offsetY = center.y;
		letter.translate(-offsetX, -offsetY, 2.8);
		letters[l] = letter;
	}

	// Each side
	const xy = [
		{ x: -1, y: -1 },
		{ x: -1, y: 0 },
		{ x: -1, y: 1 },
		{ x: 0, y: 1 },
		{ x: 1, y: 1 },
		{ x: 1, y: 0 },
		{ x: 1, y: -1 },
		{ x: 0, y: -1 },
	];
	for (let i = 0; i < 6; i++) {
		const side = new THREE.Group();
		cube.add(side);
		const sideLetters = new THREE.Group();
		side.add(sideLetters);

		// Rotate side
		if (i < 4) {
			side.rotateY((Math.PI * i) / 2);
		} else {
			side.rotateX(Math.PI * (i - 3.5));
		}

		//for (let j = 0; j < 4; j++) {
		for (let j = 0; j < 4; j++) {
			const setupSticker = (sticker, skipLetter) => {
				sticker.children[0].material = new THREE.MeshStandardMaterial({
					color: stickerColours[i],
				});
				sticker.solvedColour = stickerColours[i];
				sticker.children[1].material = pieceMaterial;
				side.add(sticker);
				stickers.push(sticker);

				if (skipLetter) {
					return;
				}
			};

			// Letter
			function attachLetter(index) {
				const letter = new THREE.Mesh(
					letters[letterScheme[schemeIndexes[index]]],
					letterMaterial,
				);
				const { x, y } = xy[index % 9];
				letter.translateX(1.867 * x);
				letter.translateY(1.867 * y);
				letter.schemeIndex = schemeIndexes[index];
				sideLetters.add(letter);
			}

			// Corner
			const corner = basecorner.clone();
			setupSticker(corner, false);
			corner.index = i * 9 + j * 2;
			attachLetter(corner.index);
			corner.rotateZ(-(Math.PI * j) / 2);

			// Edge
			const edge = baseedge.clone();
			setupSticker(edge, false);
			edge.index = i * 9 + j * 2 + 1;
			attachLetter(edge.index);
			edge.rotateZ(-(Math.PI * j) / 2);

			// Center
			if (j === 3) {
				const center = basecenter.clone();
				setupSticker(center, true);
			}
		}
	}

	reset();
}

let positionCounter = 20;

let positions = [
	{ x: 0.1, y: 1.2, z: -0.5 }, // DBL
	{ x: 0.1, y: -1.2, z: 0.5 }, // DBR
	{ x: -0.3, y: 0.3, z: 0.05 }, // DFL
	{ x: -0.3, y: -0.3, z: -0.05 }, // DFR

	{ x: 0.6, y: 1.1, z: 0.0 }, // UBL
	{ x: 0.6, y: -1.1, z: -0.0 }, // UBR
	{ x: 0.4, y: 0.3, z: -0.05 }, // UFL
	{ x: 0.4, y: -0.3, z: 0.05 }, // UFR

	{ x: 0.5, y: 1.2, z: -0.2 }, // BL
	{ x: 0.5, y: -1.2, z: 0.2 }, // BR
	{ x: 0.2, y: 0.4, z: -0.05 }, // FL
	{ x: 0.2, y: -0.4, z: 0.05 }, // FR

	{ x: -0.2, y: 0.4, z: -0.1 }, // DL
	{ x: -0.3, y: 0.0, z: 0.0 }, // DF
	{ x: -0.2, y: -0.4, z: 0.1 }, // DR
	{ x: -0.35, y: 1.2, z: -0.1 }, // DB

	{ x: 0.4, y: 0.4, z: -0.1 }, // UL
	{ x: 0.4, y: 0.0, z: 0.0 }, // UF
	{ x: 0.4, y: -0.4, z: 0.1 }, // UR
	{ x: 1.2, y: 0.2, z: -0.3 }, // UB
].map((r) => {
	const qcube = new THREE.Quaternion();
	const qcamera = new THREE.Quaternion();
	qcube.setFromEuler(
		new THREE.Euler(
			(r.x * Math.PI) / 4,
			(r.y * Math.PI) / 4,
			(r.z * Math.PI) / 4,
		),
	);
	qcamera.setFromEuler(
		new THREE.Euler(
			(-r.x * Math.PI) / 4,
			(-r.y * Math.PI) / 4,
			(-r.z * Math.PI) / 4,
		),
	);
	return { cube: qcube, camera: qcamera };
});

positions.push(
	(() => {
		const qcube = new THREE.Quaternion();
		const qcamera = new THREE.Quaternion();
		qcube.setFromEuler(new THREE.Euler(0, 0, 0));
		qcamera.setFromEuler(new THREE.Euler((-0.3 * Math.PI) / 2, 0, 0));
		return { cube: qcube, camera: qcamera };
	})(),
);

function randomRange(min, max) {
	return min + Math.floor(Math.random() * max);
}

const cornersData = [
	{ stickers: [24, 27, 36], position: 0 },
	{ stickers: [18, 42, 15], position: 1 },
	{ stickers: [0, 38, 33], position: 2 },
	{ stickers: [6, 9, 40], position: 3 },
	{ stickers: [22, 47, 29], position: 4 },
	{ stickers: [20, 13, 49], position: 5 },
	{ stickers: [2, 31, 45], position: 6 },
	{ stickers: [4, 51, 11], position: 7 },
];

const edgesData = [
	// F  R  B  L  D  U
	// 1 10 19 28 37 46
	{ stickers: [23, 28], position: 8 },
	{ stickers: [14, 19], position: 9 },
	{ stickers: [1, 32], position: 10 },
	{ stickers: [5, 10], position: 11 },

	{ stickers: [34, 37], position: 12 },
	{ stickers: [7, 39], position: 13 },
	{ stickers: [16, 41], position: 14 },
	{ stickers: [25, 43], position: 15 },

	{ stickers: [30, 46], position: 16 },
	{ stickers: [3, 52], position: 17 },
	{ stickers: [12, 50], position: 18 },
	{ stickers: [21, 48], position: 19 },
];

let currentCorner;
let currentEdge;
let startLetter;

function setPiecesGray() {
	for (let i = 0; i < stickers.length; i++) {
		if (i % 9 === 8) continue;
		stickers[i].targetColour = stickerColours[6];
	}
}

function setPiecesSolved() {
	for (const sticker of stickers) {
		sticker.targetColour = sticker.solvedColour;
	}
}

function setModePreview() {
	setPiecesSolved();
	for (const pieceData of edges ? cornersData : edgesData) {
		for (const i of pieceData.stickers) {
			stickers[i].targetColour = stickerColours[6];
		}
	}
}

let resetTimeout = setTimeout(() => {
	if (!playing && !orbit) {
		controls.autoRotate = true;
	}
}, 500);

function reset() {
	orbit = false;
	letterMaterial.visible = false;
	if (resetTimeout) {
		clearTimeout(resetTimeout);
	}
	resetTimeout = setTimeout(() => {
		if (!playing && !orbit) {
			controls.autoRotate = true;
		}
	}, 500);
	controls.enableRotate = true;
	playing = false;
	setModePreview();

	startLetter = edges ? letterScheme[43] : letterScheme[21];

	document.getElementById("top-indicator").textContent =
		`Press ${startLetter.toUpperCase()} to start`;
	document.getElementById("reset-buttons").hidden = true;
	document.getElementById("bottom-indicator").textContent =
		"Press SPACE to change mode";

	currentCorner = { ...cornersData[7] };
	currentCorner.twist = 0;
	currentCorner.answer = letterScheme[21].toUpperCase();

	currentEdge = { ...edgesData[9] };
	currentEdge.flip = true;
	currentEdge.answer = letterScheme[43].toUpperCase();
}

function getRandomCorner() {
	return cornersData[randomRange(0, 8)];
}

function getRandomEdge() {
	return edgesData[randomRange(0, edgesData.length)];
}

function nextCorner() {
	document.getElementById("top-indicator").textContent =
		currentCorner.answer.toUpperCase();

	setPiecesGray();

	let corner = getRandomCorner();
	while (corner.position === currentCorner.position) {
		corner = getRandomCorner();
	}
	const twist = randomRange(0, 3);
	//const twist = 2;

	for (let i = 0; i < 3; i++) {
		stickers[currentCorner.stickers[i]].targetColour =
			stickers[corner.stickers[(i + twist) % 3]].solvedColour;
	}
	positionCounter = currentCorner.position;

	const relativeTwist = (currentCorner.twist + twist) % 3;
	const answer = letterScheme[corner.position * 3 + relativeTwist];

	currentCorner = { ...corner };
	currentCorner.twist = relativeTwist;
	currentCorner.answer = answer;

	console.log(answer);
}

function nextEdge() {
	document.getElementById("top-indicator").textContent =
		currentEdge.answer.toUpperCase();

	setPiecesGray();

	let edge = getRandomEdge();
	while (edge.position === currentEdge.position) {
		edge = getRandomEdge();
	}
	const flip = Math.random() < 0.5;
	//const twist = 2;

	for (let i = 0; i < 2; i++) {
		stickers[currentEdge.stickers[i]].targetColour =
			stickers[edge.stickers[(i + flip) % 2]].solvedColour;
	}
	positionCounter = currentEdge.position;

	const relativeFlip = currentEdge.flip != flip;
	const answer = letterScheme[24 + (edge.position - 8) * 2 + relativeFlip];

	currentEdge = { ...edge };
	currentEdge.flip = relativeFlip;
	currentEdge.answer = answer;

	console.log(answer);
}

let playing = false;
//let playing = true;
let edges = false;

let timeouts = [];

const abc = "abcdefghijklmnopqrstluvwxyz";

document.body.addEventListener("keyup", (e) => {
	if (selectedSticker && abc.includes(e.key)) {
		selectedSticker.parent.parent.children[0].children[
			selectedSticker.index % 9
		].geometry = letters[e.key];

		const index = schemeIndexes[selectedSticker.index];
		letterScheme =
			letterScheme.slice(0, index) + e.key + letterScheme.slice(index + 1);

		localStorage.setItem("letterScheme", letterScheme);
		selectedSticker = null;
		return;
	}

	if (playing) {
		if (e.key === " ") {
			for (const timeout of timeouts) {
				clearTimeout(timeout);
			}
			timeouts = [];
			positionCounter = 20;
			reset();
		} else if (
			(e.key === currentCorner.answer && !edges) ||
			(e.key === currentEdge.answer && edges)
		) {
			if (edges) {
				nextEdge();
			} else {
				nextCorner();
			}
		} else if (abc.includes(e.key)) {
			scene.background = new THREE.Color(0x862121);
			setTimeout(() => (scene.background = grayColour), 200);
		}
		return;
	}

	if (orbit) {
		if (e.key === " ") {
			reset();
			("Press SPACE to go back");
		}
		return;
	}

	switch (e.key) {
		case startLetter:
			document.getElementById("bottom-indicator").textContent =
				"Press SPACE to exit";
			playing = true;
			controls.enableRotate = false;
			controls.autoRotate = false;
			positionCounter = 20;
			setPiecesGray();

			document.getElementById("top-indicator").textContent = "Get ready...";
			timeouts.push(
				setTimeout(() => {
					if (edges) {
						nextEdge();
					} else {
						nextCorner();
					}
				}, 1000),
			);

			break;
		case " ":
			edges = !edges;
			reset();
			break;
	}
});

let orbit = false;
let mouseDown = false;

renderer.domElement.addEventListener("mousedown", (e) => {
	mouseDown = true;
	pointerDown.x = e.clientX;
	pointerDown.y = e.clientY;
	if (!playing) {
		orbit = true;
		letterMaterial.visible = true;
		controls.autoRotate = false;
		setPiecesSolved();
		document.getElementById("top-indicator").textContent = "Scheme editor";
		document.getElementById("reset-buttons").hidden = false;
		document.getElementById("bottom-indicator").textContent =
			"Press SPACE to go back";
		return;
	}
});

const colourPicker = document.getElementById("colour-picker");

function updateColours() {
	for (let i = 0; i < stickers.length; i++) {
		stickers[i].solvedColour = stickerColours[Math.floor(i / 9)];
	}
	if (orbit) {
		setPiecesSolved();
		return;
	}
	setModePreview();
}

colourPicker.addEventListener("change", (e) => {
	const newColour = Number("0x" + e.target.value.slice(1));
	const face = Number(e.target.dataset.face);
	stickerColours[face] = new THREE.Color(newColour);
	updateColours();
	let colours = JSON.parse(localStorage.getItem("colourScheme"));
	colours[face] = newColour;
	localStorage.setItem("colourScheme", JSON.stringify(colours));
});

let selectedSticker = null;

renderer.domElement.addEventListener("mouseup", (e) => {
	mouseDown = false;
	if (
		playing ||
		Math.abs(pointerDown.x - e.clientX) > 10 ||
		Math.abs(pointerDown.y - e.clientY) > 10
	) {
		return;
	}
	selectedSticker = getMouseSticker();
	if (!selectedSticker) {
		return;
	}

	if (selectedSticker.index % 9 === 8) {
		colourPicker.focus();
		colourPicker.value =
			"#" + stickers[selectedSticker.index].solvedColour.getHexString();
		colourPicker.dataset.face = Math.floor(selectedSticker.index / 9);
		colourPicker.click();
		selectedSticker = null;
		return;
	}

	selectedSticker.parent.targetColour = inputtingColour;
});

document
	.getElementById("reset-colour-scheme")
	.addEventListener("keyup", (e) => e.preventDefault());
document.getElementById("reset-colour-scheme").addEventListener("click", () => {
	if (
		window.confirm("Are you sure you want to reset to the default colours?")
	) {
		resetColours();
		updateColours();
	}
});

document
	.getElementById("reset-letter-scheme")
	.addEventListener("keyup", (e) => e.preventDefault());
document.getElementById("reset-letter-scheme").addEventListener("click", () => {
	if (
		window.confirm("Are you sure you want to reset to the default lettering?")
	) {
		resetLetters();
		updateLetters();
	}
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerDown = new THREE.Vector2();

window.addEventListener("pointermove", (event) => {
	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function getMouseSticker() {
	raycaster.setFromCamera(pointer, camera);
	const intersects = raycaster.intersectObjects(
		stickers.map((sticker, index) => {
			let stickerWithIndex = sticker.children[0];
			stickerWithIndex.index = index;
			return stickerWithIndex;
		}),
	);
	return intersects.length ? intersects[0].object : undefined;
}

const rotateSpeed = 0.15;

function slerpPosition() {
	cube.quaternion.slerp(positions[positionCounter].cube, rotateSpeed);
	camera.position.set(0, 0, 0);
	camera.quaternion.slerp(positions[positionCounter].camera, rotateSpeed);
	camera.translateZ(30);
}

function animate() {
	requestAnimationFrame(animate);
	const colorSpeed = 0.15;

	if (!orbit) {
		if (playing || !controls.autoRotate) {
			slerpPosition();
		} else {
			camera.position.set(0, 0, 0);
			camera.translateZ(30);
		}
	} else {
		const object = getMouseSticker();
		const index = object ? object.index : null;
		for (let i = 0; i < stickers.length; i++) {
			if (!selectedSticker) {
				if (i === index && !mouseDown) {
					stickers[i].targetColour = stickerColours[6];
				} else {
					stickers[i].targetColour = stickers[i].solvedColour;
				}
			}
		}
	}

	for (const sticker of stickers) {
		sticker.children[0].material.color.lerp(sticker.targetColour, colorSpeed);
	}

	controls.update();
	renderer.render(scene, camera);
}

if (WebGL.isWebGLAvailable()) {
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById("container").appendChild(warning);
}
