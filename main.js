import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

// ThreeJS
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const loader = new OBJLoader();
const camera = new THREE.PerspectiveCamera(
	25,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);
const controls = new OrbitControls(camera, renderer.domElement);
const grayColour = new THREE.Color(0x0b0b0b);
const pieceMaterial = new THREE.MeshStandardMaterial({
	color: 0x0,
	roughness: 0.3,
});
const letterMaterial = new THREE.MeshStandardMaterial({
	color: 0x000000,
	//roughness: 0.4,
	visible: false,
});
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerDown = new THREE.Vector2();

// DOM
const colourPicker = document.getElementById("colour-picker");
const topIndicator = document.getElementById("top-indicator");
const bottomIndicator = document.getElementById("bottom-indicator");
const resetButtons = document.getElementById("reset-buttons");

// Constants
const abc = "abcdefghijklmnopqrstluvwxyz";
const rotateSpeed = 0.15;
const allowTwoSideRecognition = false;
const letters = {};

// Variables
let times = [];
let startTime;

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

// prettier-ignore
const schemeIndexes = [
	 8, 28, 20, 42, 23, 30, 11, 34, undefined,
	 9, 31, 22, 44, 15, 26,  4, 36, undefined,
	 5, 27, 17, 46, 14, 24,  2, 38, undefined,
	 0, 25, 13, 40, 18, 29,  7, 32, undefined,
	 1, 33,  6, 35, 10, 37,  3, 39, undefined,
	19, 41, 12, 47, 16, 45, 21, 43, undefined,
];

// prettier-ignore
const cornersData = [
	{ stickers: [24, 27, 36], position: 0 },
	{ stickers: [18, 42, 15], position: 1 },
	{ stickers: [ 0, 38, 33], position: 2 },
	{ stickers: [ 6,  9, 40], position: 3 },
	{ stickers: [22, 47, 29], position: 4 },
	{ stickers: [20, 13, 49], position: 5 },
	{ stickers: [ 2, 31, 45], position: 6 },
	{ stickers: [ 4, 51, 11], position: 7 },
];

// prettier-ignore
const edgesData = [
	{ stickers: [23, 28], position:  8 },
	{ stickers: [14, 19], position:  9 },
	{ stickers: [ 1, 32], position: 10 },
	{ stickers: [ 5, 10], position: 11 },

	{ stickers: [34, 37], position: 12 },
	{ stickers: [ 7, 39], position: 13 },
	{ stickers: [16, 41], position: 14 },
	{ stickers: [25, 43], position: 15 },

	{ stickers: [30, 46], position: 16 },
	{ stickers: [ 3, 52], position: 17 },
	{ stickers: [12, 50], position: 18 },
	{ stickers: [21, 48], position: 19 },
];

/*
const adjacentCornerPoss = [
	[1, 2, 4], // 0 DBL
	[0, 3, 5], // 1 DBR
	[0, 3, 6], // 2 DFL
	[1, 2, 7], // 3 DFR
	[0, 5, 6], // 4 UBL
	[1, 4, 7], // 5 UBR
	[2, 4, 7], // 6 UFL
	[3, 5, 6], // 7 UFR
];
*/

scene.background = grayColour;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Control
controls.enableZoom = false;
controls.enablePan = false;
controls.dampingFactor = 0.25;
controls.enableDamping = true;

/* Times
 *
 * {
 * a: [3524, 5453, 1535],
 * b: [3524, 5453, 1535],
 * c: [3524, 5453, 1535],
 * }
 */

function resetTime(index) {
	times[index] = [];
	localStorage.setItem("times-" + index, JSON.stringify([]));
}

function resetTimes() {
	for (let i = 0; i < letterScheme.length; i++) {
		resetTime(i);
	}
}

function loadTimes() {
	times = [];
	for (let i = 0; i < 48; i++) {
		if (!localStorage.hasOwnProperty("times-" + i)) {
			resetTime(i);
			continue;
		}
		times[i] = JSON.parse(localStorage.getItem("times-" + i));
	}
}

loadTimes();

function addTime(time) {
	const index = edges ? currentEdge.index : currentCorner.index;
	times[index].push(time);
	times[index].sort((a, b) => a - b);
	localStorage.setItem("times-" + index, JSON.stringify(times[index]));

	//const flat = times.flat();
	//const mean = flat.reduce((acc, c) => acc + c, 0) / flat.length;
	//console.log(mean/1000);
}

function getMeanAndStandardDeviation(array) {
	const n = array.length;
	const mean = array.reduce((a, b) => a + b, 0) / n;
	const stddev = Math.sqrt(
		array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n,
	);
	return [mean, stddev];
}

// Colours
function resetColours() {
	const defaultColours = [
		0x009b48, // Front
		0xb90000, // Right
		0x0045ad, // Back
		0xff5900, // Left
		0xffd500, // Down
		0xffffff, // Up
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
//const pieceMaterial = new THREE.MeshStandardMaterial({ color: 0x0 });
//const pieceMaterial = new THREE.MeshToonMaterial({ color: 0x0 });

// Ligths
//const ambientLight = new THREE.AmbientLight(0xaaaaaa);
//scene.add(ambientLight);

for (const l of [
	// for toon material
	//{ x: 6, y: 6, z: 6, c: 0xccccff, s: 150 },
	//{ x: -6, y: -6, z: -6, c: 0xffcccc, s: 150 },
	//{ x: 8, y: 8, z: -8, c: 0xaaaaff, s: 200 },
	//{ x: 8, y: -8, z: 8, c: 0xffaaaa, s: 200 },
	//{ x: -8, y: -8, z: 8, c: 0xffaaaa, s: 200 },
	//{ x: -8, y: 8, z: 8, c: 0xaaaaff, s: 200 },

	{ x: 6, y: 6, z: 6, c: 0xddddff, s: 180 },
	{ x: -6, y: -6, z: -6, c: 0xffdddd, s: 180 },
	{ x: 8, y: 8, z: -8, c: 0xffaaaa, s: 240 },
	{ x: 8, y: -8, z: 8, c: 0xaaaaff, s: 240 },
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

let basecorner;
let baseedge;
let basecenter;

function loadingFunction(xhr) {
	console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
}
function errorFunction(error) {
	console.log(error);
}

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
				sticker.children[0].material = new THREE.MeshBasicMaterial();
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

let currentCorner;
let currentEdge;
let startLetter;

function setPiecesGray(exclude = (i) => i % 9 === 8, alpha = 1.0) {
	for (let i = 0; i < stickers.length; i++) {
		if (exclude(i)) {
			continue;
		}
		stickers[i].targetColour = new THREE.Color(stickers[i].solvedColour).lerp(
			stickerColours[6],
			alpha,
		);
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

	positionCounter = 20;
	//controls.autoRotate = true;

	controls.enableRotate = true;
	playing = false;
	setModePreview();

	startLetter = edges ? letterScheme[43] : letterScheme[21];

	topIndicator.textContent = `Press ${startLetter.toUpperCase()} to start`;
	resetButtons.hidden = true;
	bottomIndicator.textContent = "Press SPACE to change mode";

	currentCorner = { ...cornersData[7] };
	currentCorner.twist = 0;
	currentCorner.answer = letterScheme[21].toUpperCase();

	currentEdge = { ...edgesData[9] };
	currentEdge.flip = true;
	currentEdge.answer = letterScheme[43].toUpperCase();
}

function getWeightedRandom(weights) {
	let sum = 0;
	const r = Math.random();
	const total = weights.reduce((a, c) => a + c || 0, 0);
	const normalized = weights.map((w) => w / total);
	for (let i = 0; i < weights.length; i++) {
		sum += normalized[i];
		if (r <= sum) {
			return i;
		}
	}
	console.log("hmm, this code should be unreachable");
	console.log(weights);
	console.log(total, normalized);
	return Math.floor(Math.random() * weights.length);
}

function getRandomCorner() {
	const weights = times.slice(0, 24).map((stickerTimes, index) => {
		if (
			currentCorner.position === cornersData[Math.floor(index / 3)].position
		) {
			return 0;
		}
		const [mean, _] = getMeanAndStandardDeviation(stickerTimes);
		return Math.pow(mean || 1000, 2);
	});

	const index = getWeightedRandom(weights);
	const twist = index % 3;

	return { ...cornersData[Math.floor(index / 3)], twist };
}

function getRandomEdge() {
	const weights = times.slice(24, 48).map((stickerTimes, index) => {
		if (
			currentEdge.position === cornersEdge[24 + Math.floor(index / 2)].position
		) {
			return 0;
		}
		const [mean, _] = getMeanAndStandardDeviation(stickerTimes);
		return Math.pow(mean || 1000, 2);
	});

	const index = getWeightedRandom(weights);
	const flip = index % 2;

	return { ...cornersData[24 + Math.floor(index / 2)], flip };
}

function nextCorner() {
	topIndicator.textContent = currentCorner.answer.toUpperCase();

	setPiecesGray();

	const corner = getRandomCorner();

	for (let i = 0; i < 3; i++) {
		stickers[currentCorner.stickers[i]].targetColour =
			stickers[corner.stickers[(i + corner.twist) % 3]].solvedColour;
	}

	//for (const timeout of timeouts) {
	//clearTimeout(timeout);
	let newPos = currentCorner.position;
	if (allowTwoSideRecognition && [0, 1, 4, 5].includes(newPos)) {
		newPos += 2;
		//timeouts.push(setTimeout(() => (positionCounter = newPos - 2), 3000));
	}

	positionCounter = newPos;

	const relativeTwist = (currentCorner.twist + corner.twist) % 3;
	const index = corner.position * 3 + relativeTwist;
	const answer = letterScheme[index];

	currentCorner = { ...corner };
	currentCorner.twist = relativeTwist;
	currentCorner.answer = answer;
	currentCorner.index = index;

	startTime = new Date().getTime();
	//console.log(answer);
}

function nextEdge() {
	topIndicator.textContent = currentEdge.answer.toUpperCase();

	setPiecesGray();

	let edge = getRandomEdge();

	for (let i = 0; i < 2; i++) {
		stickers[currentEdge.stickers[i]].targetColour =
			stickers[edge.stickers[(i + flip) % 2]].solvedColour;
	}
	positionCounter = currentEdge.position;

	const relativeFlip = currentEdge.flip != flip;
	const index = 24 + (edge.position - 8) * 2 + relativeFlip;
	const answer = letterScheme[index];

	currentEdge = { ...edge };
	currentEdge.flip = relativeFlip;
	currentEdge.answer = answer;
	currentEdge.index = index;

	startTime = new Date().getTime();
	//console.log(answer);
}

let playing = false;
//let playing = true;
let edges = false;

let timeouts = [];

document.body.addEventListener("keyup", (e) => {
	if (playing) {
		if (e.key === " ") {
			for (const timeout of timeouts) {
				clearTimeout(timeout);
			}
			timeouts = [];
			//positionCounter = 20;
			reset();
		} else if (
			(e.key === currentCorner.answer && !edges) ||
			(e.key === currentEdge.answer && edges)
		) {
			const ellapsedTime = new Date().getTime() - startTime;
			addTime(ellapsedTime);
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

	// Input
	if (selectedSticker) {
		if (abc.includes(e.key)) {
			selectedSticker.parent.parent.children[0].children[
				selectedSticker.index % 9
			].geometry = letters[e.key];

			const index = schemeIndexes[selectedSticker.index];
			letterScheme =
				letterScheme.slice(0, index) + e.key + letterScheme.slice(index + 1);

			localStorage.setItem("letterScheme", letterScheme);
			selectedSticker = null;
		} else {
			selectedSticker = null;
		}
		setPiecesSolved();

		bottomIndicator.textContent = "Press SPACE to go back";
		return;
	}

	if (orbit) {
		if (e.key === " ") {
			inEditor = false;
			reset();
		}
		return;
	}

	switch (e.key) {
		case startLetter:
			bottomIndicator.textContent = "Press SPACE to exit";
			playing = true;
			controls.enableRotate = false;
			controls.autoRotate = false;
			positionCounter = 20;
			setPiecesGray();

			topIndicator.textContent = "Get ready...";
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
let inEditor = false;
let mouseDown = false;

renderer.domElement.addEventListener("mousedown", (e) => {
	mouseDown = true;
	pointerDown.x = e.clientX;
	pointerDown.y = e.clientY;
	if (!playing && !inEditor) {
		orbit = true;
		letterMaterial.visible = true;
		controls.autoRotate = false;
		setPiecesSolved();
		topIndicator.textContent = "Scheme editor";
		resetButtons.hidden = false;
		bottomIndicator.textContent = "Press SPACE to go back";
		inEditor = true;
	}
});

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
	if (!selectedSticker) {
		return;
	}
	const newColour = Number("0x" + e.target.value.slice(1));
	const face = Math.floor(selectedSticker.parent.index / 9);
	stickerColours[face] = new THREE.Color(newColour);

	let colours = JSON.parse(localStorage.getItem("colourScheme"));
	colours[face] = newColour;
	localStorage.setItem("colourScheme", JSON.stringify(colours));

	updateColours();
	setPiecesSolved();
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

	// Rayacst
	selectedSticker = getMouseSticker();

	// No sticker
	if (!selectedSticker) {
		bottomIndicator.textContent = "Press SPACE to go back";
		setPiecesSolved();
		return;
	}

	if (selectedSticker.index % 9 === 8) {
		// Center sticker
		colourPicker.value =
			"#" + stickers[selectedSticker.index].solvedColour.getHexString();
		colourPicker.click();
	} else {
		// Letter sticker
		bottomIndicator.textContent = "Press A-Z to change";
	}

	setPiecesGray((i) => i === selectedSticker.index, 0.9);
	selectedSticker.parent.targetColour = selectedSticker.parent.solvedColour;
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

document.getElementById("reset-times").addEventListener("click", () => {
	if (window.confirm("Are you sure you want to reset the data?")) {
		resetTimes();
	}
});

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

function slerpCube() {
	cube.quaternion.slerp(positions[positionCounter].cube, rotateSpeed);
}

function slerpCamera() {
	camera.position.set(0, 0, 0);
	camera.quaternion.slerp(positions[positionCounter].camera, rotateSpeed);
	camera.translateZ(30);
}

function animate() {
	requestAnimationFrame(animate);
	const colorSpeed = 0.15;

	if (!orbit) {
		if (playing || !controls.autoRotate) {
			slerpCamera();
			slerpCube();
		} else {
			slerpCube();
			camera.position.set(0, 0, 0);
			camera.translateZ(30);
		}
	} else {
		/* gray on hover
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
		*/
	}

	for (const sticker of stickers) {
		sticker.children[0].material.color.lerp(sticker.targetColour, colorSpeed);
		//sticker.children[0].material.emissive.lerp(
		//new THREE.Color(sticker.targetColour).lerp(new THREE.Color(0x0), 0.4),
		//colorSpeed,
		//);
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
