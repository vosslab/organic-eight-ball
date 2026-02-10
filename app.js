const canvas = document.getElementById("sim-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
	throw new Error("Required canvas #sim-canvas is missing.");
}
const ctx = canvas.getContext("2d");
if (!ctx) {
	throw new Error("2D canvas context is unavailable.");
}
const rackButton = document.getElementById("shake-btn");
const nextButton = document.getElementById("next-btn");
const choicesPanel = document.getElementById("choices");
const groupImage = document.getElementById("group-image");
const answerText = document.getElementById("answer-text");
const answerMeta = document.getElementById("answer-meta");
const questionWindow = document.getElementById("window");
const statusDetail = document.getElementById("status-detail");
const setupModal = document.getElementById("setup-modal");
const onboardingModal = document.getElementById("onboarding-modal");
const onboardingDismissButton = document.getElementById("onboarding-dismiss-btn");
const humanCountInput = document.getElementById("human-count");
const npcCountInput = document.getElementById("npc-count");
const startGameButton = document.getElementById("start-game-btn");
const muteButton = document.getElementById("mute-btn");
const requiredElements = [
	rackButton,
	nextButton,
	choicesPanel,
	groupImage,
	answerText,
	answerMeta,
	questionWindow,
	statusDetail,
	setupModal,
	onboardingModal,
	onboardingDismissButton,
	humanCountInput,
	npcCountInput,
	startGameButton,
	muteButton,
];
for (const element of requiredElements) {
	if (!element) {
		throw new Error("Required UI element is missing from index.html.");
	}
}

const table = {
	x: 36,
	y: 36,
	w: canvas.width - 72,
	h: canvas.height - 72,
	cushion: 24,
	pocketR: 24
};

const BALL_RADIUS = 12;
const BALL_DIAMETER = BALL_RADIUS * 2;
const FRICTION = 0.991;
const REST_FRAMES_REQUIRED = 85;
const NPC_MIN_SHOT_SPEED = 10;
const NPC_MAX_SHOT_SPEED = 16;
const PHASE_QUESTION_ACTIVE = "QUESTION_ACTIVE";
const PHASE_SHOT_READY = "SHOT_READY";
const PHASE_BALLS_MOVING = "BALLS_MOVING";
const SOLIDS = "solids";
const STRIPES = "stripes";
const POCKET_COUNT = 6;
const SUIT_COLORS = {
	1: "#f1c232",
	2: "#2c70d7",
	3: "#d23b2f",
	4: "#7d3db5",
	5: "#e07a2f",
	6: "#2d9b4f",
	7: "#8a2832",
	8: "#121212",
	9: "#f1c232",
	10: "#2c70d7",
	11: "#d23b2f",
	12: "#7d3db5",
	13: "#e07a2f",
	14: "#2d9b4f",
	15: "#8a2832",
};

const balls = [];
let cueBall = null;
let dragging = false;
let dragStart = null;
let dragNow = null;
let activePointerId = null;

let settleFrames = 0;
let hasSettled = false;
let groupPool = [];
let currentGroup = null;
let scoreCorrect = 0;
let scoreTotal = 0;
let shotUnlocked = false;
let players = [];
let playerCorrect = {};
let currentTurnIndex = 0;
let gameStarted = false;
let groupLoadState = "pending";
let groupLoadErrorMessage = "";
let phase = PHASE_QUESTION_ACTIVE;
const ONBOARDING_KEY = "organic_eight_ball_onboarding_seen_v1";
const activeTimeoutIds = new Set();
let pocketedByPocket = {};
let playerStats = {};
let groupsAssigned = false;
let groupOwnerByType = {};
let shooterId = "";
let shotContext = null;
let audioMuted = false;
let audioContext = null;

const LOCAL_FALLBACK_GROUPS = [
	{
		id: "alcohol",
		display_name: "Alcohol",
		image: "assets/groups/alcohol.svg",
		aliases: ["alcohol", "hydroxyl", "hydroxy"]
	},
	{
		id: "ketone",
		display_name: "Ketone",
		image: "assets/groups/ketone.svg",
		aliases: ["ketone", "oxo"]
	},
	{
		id: "amine",
		display_name: "Amine",
		image: "assets/groups/amine.svg",
		aliases: ["amine", "amino"]
	}
];

function rand(min, max) {
	return min + Math.random() * (max - min);
}

function ensureAudioContext() {
	if (audioMuted) {
		return null;
	}
	if (!audioContext) {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (!Ctx) {
			return null;
		}
		audioContext = new Ctx();
	}
	if (audioContext.state === "suspended") {
		audioContext.resume().catch(() => {
			// Ignore resume failures.
		});
	}
	return audioContext;
}

function playTone(frequency, durationMs, gain) {
	const ctxAudio = ensureAudioContext();
	if (!ctxAudio) {
		return;
	}
	const osc = ctxAudio.createOscillator();
	const gainNode = ctxAudio.createGain();
	osc.frequency.value = frequency;
	osc.type = "triangle";
	gainNode.gain.value = Math.max(0, Math.min(0.25, gain));
	osc.connect(gainNode);
	gainNode.connect(ctxAudio.destination);
	osc.start();
	osc.stop(ctxAudio.currentTime + durationMs / 1000);
}

function emitCollisionAudio(impactSpeed) {
	const scaled = Math.min(1, impactSpeed / 18);
	playTone(180 + 100 * scaled, 35, 0.04 + 0.12 * scaled);
}

function emitPocketAudio(impactSpeed) {
	const scaled = Math.min(1, impactSpeed / 20);
	playTone(320 + 120 * scaled, 90, 0.06 + 0.16 * scaled);
}

function updateMuteButton() {
	muteButton.textContent = `Sound: ${audioMuted ? "Off" : "On"}`;
}

function shuffleList(items) {
	const out = items.slice();
	for (let i = out.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

function currentPlayer() {
	if (players.length === 0) {
		return null;
	}
	return players[currentTurnIndex];
}

function isActiveHumanTurn() {
	const p = currentPlayer();
	return Boolean(gameStarted && p && !p.isNpc);
}

function isShotLocked() {
	return !shotUnlocked;
}

function setChoicesEnabled(enabled) {
	const buttons = choicesPanel.querySelectorAll("button");
	for (const button of buttons) {
		button.disabled = !enabled;
	}
}

function scheduleAction(callback, delayMs) {
	const timerId = window.setTimeout(() => {
		activeTimeoutIds.delete(timerId);
		callback();
	}, delayMs);
	activeTimeoutIds.add(timerId);
	return timerId;
}

function clearScheduledActions() {
	for (const timerId of activeTimeoutIds) {
		window.clearTimeout(timerId);
	}
	activeTimeoutIds.clear();
}

function syncQuestionWindow() {
	if (!questionWindow) {
		return;
	}
	const visible = phase === PHASE_QUESTION_ACTIVE;
	questionWindow.classList.toggle("is-hidden", !visible);
}

function setPhase(nextPhase) {
	phase = nextPhase;
	syncQuestionWindow();
}

function ballSuitForNumber(number) {
	if (number >= 1 && number <= 7) {
		return SOLIDS;
	}
	if (number >= 9 && number <= 15) {
		return STRIPES;
	}
	if (number === 8) {
		return "eight";
	}
	return "cue";
}

function makeBall(x, y, color, isCue = false, number = 0) {
	return {
		x,
		y,
		vx: 0,
		vy: 0,
		r: BALL_RADIUS,
		isCue,
		active: true,
		color,
		number,
		suit: ballSuitForNumber(number),
		rotation: 0,
		pocketId: null,
	};
}

function resetPocketedTracker() {
	pocketedByPocket = {};
	for (let i = 0; i < POCKET_COUNT; i += 1) {
		pocketedByPocket[i] = [];
	}
}

function buildRackNumbers() {
	const solids = shuffleList([1, 2, 3, 4, 5, 6, 7]);
	const stripes = shuffleList([9, 10, 11, 12, 13, 14, 15]);
	const rackRows = [[], [], [], [], []];
	rackRows[2][1] = 8;
	rackRows[0][0] = solids.pop();
	rackRows[4][0] = stripes.pop();
	rackRows[4][4] = solids.pop();
	const remaining = shuffleList([...solids, ...stripes]);
	for (let row = 0; row < 5; row += 1) {
		for (let col = 0; col <= row; col += 1) {
			if (rackRows[row][col]) {
				continue;
			}
			rackRows[row][col] = remaining.pop();
		}
	}
	return rackRows;
}

function ensurePlayerStats() {
	playerStats = {};
	for (const p of players) {
		playerStats[p.id] = {
			quiz: 0,
			pocketed: 0,
			solids: 0,
			stripes: 0,
		};
	}
	groupsAssigned = false;
	groupOwnerByType = {};
}

function rackBalls() {
	if (!gameStarted) {
		return;
	}
	clearScheduledActions();
	balls.length = 0;
	resetPocketedTracker();
	const cueX = table.x + table.w * 0.23;
	const cueY = table.y + table.h / 2;
	cueBall = makeBall(cueX, cueY, "#ffffff", true, 0);
	balls.push(cueBall);

	const rackX = table.x + table.w * 0.72;
	const rackY = table.y + table.h / 2;
	const rackRows = buildRackNumbers();
	for (let row = 0; row < 5; row += 1) {
		for (let col = 0; col <= row; col += 1) {
			const x = rackX + row * (BALL_DIAMETER * 0.88);
			const y = rackY - row * BALL_RADIUS + col * BALL_DIAMETER;
			const number = rackRows[row][col];
			balls.push(makeBall(x, y, SUIT_COLORS[number], false, number));
		}
	}

	for (const ball of balls) {
		if (!ball.isCue) {
			ball.x += rand(-0.8, 0.8);
			ball.y += rand(-0.8, 0.8);
		}
	}

	scoreCorrect = 0;
	scoreTotal = 0;
	playerCorrect = {};
	ensurePlayerStats();
	for (const p of players) {
		playerCorrect[p.id] = 0;
	}
	shotContext = null;
	shooterId = "";
	currentTurnIndex = 0;
	shotUnlocked = false;
	resetRunState();
	updateScoreLabel();
	setPhase(PHASE_QUESTION_ACTIVE);
	drawNewGroup();
}

function resetRunState() {
	settleFrames = 0;
	hasSettled = false;
}

function tableBounds() {
	return {
		left: table.x + table.cushion,
		right: table.x + table.w - table.cushion,
		top: table.y + table.cushion,
		bottom: table.y + table.h - table.cushion
	};
}

function pocketCenters() {
	const left = table.x + table.cushion;
	const right = table.x + table.w - table.cushion;
	const top = table.y + table.cushion;
	const bottom = table.y + table.h - table.cushion;
	return [
		{ x: left, y: top },
		{ x: (left + right) / 2, y: top },
		{ x: right, y: top },
		{ x: left, y: bottom },
		{ x: (left + right) / 2, y: bottom },
		{ x: right, y: bottom }
	];
}

function currentShooterStats() {
	if (!shooterId || !playerStats[shooterId]) {
		return null;
	}
	return playerStats[shooterId];
}

function assignGroupsFromFirstPocket(ball) {
	if (groupsAssigned || ball.isCue || !shooterId) {
		return;
	}
	if (ball.suit !== SOLIDS && ball.suit !== STRIPES) {
		return;
	}
	groupsAssigned = true;
	groupOwnerByType[ball.suit] = shooterId;
	if (players.length === 2) {
		const other = players.find((p) => p.id !== shooterId);
		if (other) {
			groupOwnerByType[ball.suit === SOLIDS ? STRIPES : SOLIDS] = other.id;
		}
	}
}

function handleEightBallPocket(ball) {
	if (ball.number !== 8 || !shooterId) {
		return;
	}
	const shooter = playerStats[shooterId];
	if (!shooter) {
		return;
	}
	let isWin = false;
	if (!groupsAssigned) {
		isWin = false;
	} else {
		const ownGroup = groupOwnerByType[SOLIDS] === shooterId ? SOLIDS : STRIPES;
		const remaining = balls.some((b) => b.active && b.suit === ownGroup);
		isWin = !remaining;
	}
	answerText.textContent = isWin
		? `${shooterId} pockets the 8-ball legally and wins the rack.`
		: `${shooterId} pockets the 8-ball early and loses the rack.`;
}

function onBallPocketed(ball, pocketId) {
	if (!ball || ball.isCue) {
		if (shotContext) {
			shotContext.cueScratch = true;
		}
		return;
	}
	assignGroupsFromFirstPocket(ball);
	if (shotContext) {
		shotContext.pocketed.push(ball.number);
		shotContext.pocketIds.push(pocketId);
	}
	const shooter = currentShooterStats();
	if (shooter) {
		shooter.pocketed += 1;
		if (ball.suit === SOLIDS) {
			shooter.solids += 1;
		}
		if (ball.suit === STRIPES) {
			shooter.stripes += 1;
		}
	}
	pocketedByPocket[pocketId].push(ball);
	const speed = Math.hypot(ball.vx, ball.vy);
	emitPocketAudio(speed);
	handleEightBallPocket(ball);
}

function handleCushion(ball) {
	const bounds = tableBounds();
	if (ball.x - ball.r < bounds.left) {
		ball.x = bounds.left + ball.r;
		ball.vx *= -0.96;
	}
	if (ball.x + ball.r > bounds.right) {
		ball.x = bounds.right - ball.r;
		ball.vx *= -0.96;
	}
	if (ball.y - ball.r < bounds.top) {
		ball.y = bounds.top + ball.r;
		ball.vy *= -0.96;
	}
	if (ball.y + ball.r > bounds.bottom) {
		ball.y = bounds.bottom - ball.r;
		ball.vy *= -0.96;
	}
}

function handlePocket(ball) {
	const pockets = pocketCenters();
	for (let pocketId = 0; pocketId < pockets.length; pocketId += 1) {
		const pocket = pockets[pocketId];
		const dx = ball.x - pocket.x;
		const dy = ball.y - pocket.y;
		if (Math.hypot(dx, dy) <= table.pocketR - 2) {
			if (ball.isCue) {
				ball.x = table.x + table.w * 0.23;
				ball.y = table.y + table.h / 2;
				ball.vx = 0;
				ball.vy = 0;
				onBallPocketed(ball, pocketId);
			} else {
				ball.active = false;
				ball.pocketId = pocketId;
				onBallPocketed(ball, pocketId);
			}
			return;
		}
	}
}

function resolveBallCollision(a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const dist = Math.hypot(dx, dy);
	const minDist = a.r + b.r;
	if (dist === 0 || dist >= minDist) {
		return;
	}

	const nx = dx / dist;
	const ny = dy / dist;
	const overlap = minDist - dist;
	a.x -= nx * overlap * 0.5;
	a.y -= ny * overlap * 0.5;
	b.x += nx * overlap * 0.5;
	b.y += ny * overlap * 0.5;

	const rvx = b.vx - a.vx;
	const rvy = b.vy - a.vy;
	const sepVel = rvx * nx + rvy * ny;
	if (sepVel > 0) {
		return;
	}
	const restitution = 0.95;
	const impulse = -(1 + restitution) * sepVel / 2;
	a.vx -= impulse * nx;
	a.vy -= impulse * ny;
	b.vx += impulse * nx;
	b.vy += impulse * ny;
	emitCollisionAudio(Math.abs(sepVel));
}

function updatePhysics() {
	if (!gameStarted) {
		return;
	}
	if (phase !== PHASE_BALLS_MOVING) {
		return;
	}
	let movingCount = 0;
	for (const ball of balls) {
		if (!ball.active) {
			continue;
		}
		ball.x += ball.vx;
		ball.y += ball.vy;
		ball.vx *= FRICTION;
		ball.vy *= FRICTION;
		if (Math.hypot(ball.vx, ball.vy) < 0.01) {
			ball.vx = 0;
			ball.vy = 0;
		} else {
			movingCount += 1;
		}
		handleCushion(ball);
		handlePocket(ball);
	}

	for (let i = 0; i < balls.length; i += 1) {
		if (!balls[i].active) {
			continue;
		}
		for (let j = i + 1; j < balls.length; j += 1) {
			if (!balls[j].active) {
				continue;
			}
			resolveBallCollision(balls[i], balls[j]);
		}
	}

	if (movingCount === 0) {
		settleFrames += 1;
	} else {
		settleFrames = 0;
	}

	if (!hasSettled && settleFrames >= REST_FRAMES_REQUIRED) {
		hasSettled = true;
		finishShotContextAndAdvanceTurn();
		drawNewGroup();
	}
}

function drawTable() {
	ctx.fillStyle = "#0f1d18";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#4b2f18";
	ctx.fillRect(table.x, table.y, table.w, table.h);
	ctx.fillStyle = "#226b4d";
	ctx.fillRect(
		table.x + table.cushion,
		table.y + table.cushion,
		table.w - table.cushion * 2,
		table.h - table.cushion * 2
	);
	ctx.fillStyle = "#091510";
	for (const pocket of pocketCenters()) {
		ctx.beginPath();
		ctx.arc(pocket.x, pocket.y, table.pocketR, 0, Math.PI * 2);
		ctx.fill();
	}
}

function drawBalls() {
	for (const ball of balls) {
		if (!ball.active) {
			continue;
		}
		const speed = Math.hypot(ball.vx, ball.vy);
		ball.rotation += speed * 0.08;
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
		ctx.fillStyle = ball.isCue ? "#ffffff" : ball.color;
		ctx.fill();
		ctx.strokeStyle = "#081512";
		ctx.lineWidth = 2;
		ctx.stroke();
		if (!ball.isCue && ball.suit === STRIPES) {
			ctx.beginPath();
			ctx.ellipse(
				ball.x,
				ball.y,
				ball.r * 0.95,
				ball.r * 0.55,
				ball.rotation,
				0,
				Math.PI * 2
			);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			ctx.strokeStyle = "#f4f4f4";
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		if (ball.isCue) {
			ctx.beginPath();
			ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
			ctx.fillStyle = "#202020";
			ctx.fill();
			if (isActiveHumanTurn()) {
				const t = Date.now() / 280;
				const pulse = 2 + (Math.sin(t) + 1) * 2;
				ctx.beginPath();
				ctx.arc(ball.x, ball.y, ball.r + pulse, 0, Math.PI * 2);
				ctx.lineWidth = 2;
				ctx.strokeStyle = isShotLocked() ? "rgba(255, 126, 126, 0.9)" : "rgba(166, 241, 199, 0.9)";
				ctx.stroke();
			}
		}
		if (!ball.isCue) {
			ctx.save();
			ctx.translate(ball.x, ball.y);
			ctx.rotate(ball.rotation);
			ctx.beginPath();
			ctx.arc(0, 0, ball.r * 0.42, 0, Math.PI * 2);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			ctx.strokeStyle = "#d5d5d5";
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.fillStyle = ball.number === 8 ? "#ffffff" : "#121212";
			ctx.font = "bold 9px Trebuchet MS";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(String(ball.number), 0, 0);
			ctx.restore();
		}
	}
}

function drawPocketedTrays() {
	const pockets = pocketCenters();
	for (let pocketId = 0; pocketId < pockets.length; pocketId += 1) {
		const list = pocketedByPocket[pocketId] || [];
		if (list.length === 0) {
			continue;
		}
		const pocket = pockets[pocketId];
		for (let i = 0; i < list.length; i += 1) {
			const ball = list[i];
			const angle = (Math.PI / 4) * (i % 6);
			const ring = Math.floor(i / 6) + 1;
			const rx = pocket.x + Math.cos(angle) * (table.pocketR + 8 + ring * 10);
			const ry = pocket.y + Math.sin(angle) * (table.pocketR + 8 + ring * 10);
			ctx.beginPath();
			ctx.arc(rx, ry, 7, 0, Math.PI * 2);
			ctx.fillStyle = ball.color;
			ctx.fill();
			ctx.strokeStyle = "#0d1412";
			ctx.lineWidth = 1.2;
			ctx.stroke();
		}
	}
}

function drawAimLine() {
	if (!dragging || !dragStart || !dragNow || !cueBall || !cueBall.active) {
		return;
	}
	ctx.beginPath();
	ctx.moveTo(cueBall.x, cueBall.y);
	ctx.lineTo(dragNow.x, dragNow.y);
	ctx.strokeStyle = "rgba(255,255,255,0.6)";
	ctx.lineWidth = 2;
	ctx.setLineDash([6, 6]);
	ctx.stroke();
	ctx.setLineDash([]);
}

function drawScene() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawTable();
	drawPocketedTrays();
	drawBalls();
	drawCueHelperText();
	drawAimLine();
}

function drawCueHelperText() {
	if (!isActiveHumanTurn() || !cueBall || !cueBall.active) {
		return;
	}
	ctx.font = "16px Trebuchet MS";
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";
	ctx.fillStyle = isShotLocked() ? "#ffb3b3" : "#b9f5d8";
	const helper = isShotLocked() ? "Shot locked: answer first." : "Drag from here to shoot.";
	ctx.fillText(helper, cueBall.x + 22, cueBall.y - 18);
}

function updateScoreLabel() {
	if (!gameStarted || players.length === 0) {
		answerMeta.textContent = "Set players to begin.";
		return;
	}
	const p = currentPlayer();
	const parts = players.map((player) => {
		const stats = playerStats[player.id] || {};
		const pockets = stats.pocketed || 0;
		const solids = stats.solids || 0;
		const stripes = stats.stripes || 0;
		return `${player.label} Q${playerCorrect[player.id] || 0} P${pockets} S${solids}/${stripes}`;
	});
	answerMeta.textContent =
		`${p.label} turn | Team Quiz ${scoreCorrect}/${scoreTotal} | ${parts.join(" | ")}`;
	if (groupLoadState === "fallback") {
		answerMeta.textContent += " | Using local fallback prompts";
	}
	if (groupLoadState === "failed") {
		answerMeta.textContent += " | Group data failed to load";
	}
}

function updateStatusBanner() {
	if (!gameStarted || players.length === 0) {
		statusDetail.textContent = "Player setup pending | Shot locked";
		return;
	}
	const p = currentPlayer();
	const shotState = isShotLocked() ? "Shot locked" : "Shot unlocked";
	let groupText = "groups unassigned";
	if (groupsAssigned) {
		groupText = `solids:${groupOwnerByType[SOLIDS] || "?"} stripes:${groupOwnerByType[STRIPES] || "?"}`;
	}
	statusDetail.textContent = `${p.label} turn | ${shotState} | ${phase} | ${groupText}`;
}

function beginShotContext() {
	const p = currentPlayer();
	shooterId = p ? p.id : "";
	shotContext = {
		pocketed: [],
		pocketIds: [],
		cueScratch: false,
	};
}

function finishShotContextAndAdvanceTurn() {
	if (!shotContext) {
		switchTurn();
		return;
	}
	const keepTurn = shotContext.pocketed.length > 0 && !shotContext.cueScratch;
	if (!keepTurn) {
		switchTurn();
	}
	shotContext = null;
	shooterId = "";
}

function switchTurn() {
	clearScheduledActions();
	currentTurnIndex = (currentTurnIndex + 1) % players.length;
	shotUnlocked = false;
	updateScoreLabel();
	updateStatusBanner();
}

function npcTryAnswer() {
	const p = currentPlayer();
	if (!p || !p.isNpc || !currentGroup) {
		return;
	}
	const isCorrect = true;
	scoreTotal += 1;
	if (isCorrect) {
		scoreCorrect += 1;
		playerCorrect[p.id] += 1;
		shotUnlocked = true;
		answerText.textContent = `${p.label} answered correctly. Shot unlocked.`;
		updateScoreLabel();
		updateStatusBanner();
		scheduleAction(() => {
			if (currentPlayer() && currentPlayer().id === p.id && shotUnlocked) {
				npcShoot();
			}
		}, 700);
	} else {
		answerText.textContent = `${p.label} missed. Turn passes.`;
		switchTurn();
		updateScoreLabel();
		updateStatusBanner();
		scheduleAction(() => {
			drawNewGroup();
		}, 500);
	}
}

function drawNewGroup() {
	clearScheduledActions();
	if (groupPool.length === 0 || players.length === 0) {
		answerText.textContent = groupLoadErrorMessage || "No functional group data loaded.";
		return;
	}
	const index = Math.floor(Math.random() * groupPool.length);
	currentGroup = groupPool[index];
	groupImage.src = currentGroup.image;
	groupImage.alt = "Identify this functional group";
	shotUnlocked = false;
	setPhase(PHASE_QUESTION_ACTIVE);
	const p = currentPlayer();
	renderChoices();
	if (!p) {
		return;
	}
	if (p.isNpc) {
		answerText.textContent = `${p.label} is answering...`;
		setChoicesEnabled(false);
		scheduleAction(() => {
			npcTryAnswer();
		}, 800);
	} else {
		answerText.textContent = `${p.label}: identify this group to unlock your shot.`;
		setChoicesEnabled(true);
	}
	updateStatusBanner();
}

function renderChoices() {
	choicesPanel.textContent = "";
	if (!currentGroup || groupPool.length === 0) {
		return;
	}
	const correct = currentGroup.display_name;
	const distractors = [];
	for (const group of shuffleList(groupPool)) {
		if (group.display_name === correct) {
			continue;
		}
		if (distractors.includes(group.display_name)) {
			continue;
		}
		distractors.push(group.display_name);
		if (distractors.length >= 3) {
			break;
		}
	}
	const choices = shuffleList([correct, ...distractors]);
	for (const choice of choices) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "choice-btn";
		button.textContent = choice;
		button.addEventListener("click", () => handleChoiceAnswer(choice));
		choicesPanel.appendChild(button);
	}
}

function handleChoiceAnswer(choiceText) {
	const p = currentPlayer();
	if (!p || p.isNpc) {
		answerText.textContent = "Wait for NPC turn to resolve.";
		return;
	}
	if (!currentGroup) {
		answerText.textContent = "Shoot and settle or press Next Group first.";
		return;
	}
	const isCorrect = choiceText === currentGroup.display_name;
	scoreTotal += 1;
	if (isCorrect) {
		scoreCorrect += 1;
		playerCorrect[p.id] += 1;
		shotUnlocked = true;
		setPhase(PHASE_SHOT_READY);
		clearScheduledActions();
		answerText.textContent = `Correct. ${p.label} shot unlocked.`;
		setChoicesEnabled(false);
	} else {
		answerText.textContent = `Not quite. This is ${currentGroup.display_name}. Turn passes.`;
		switchTurn();
		drawNewGroup();
	}
	updateScoreLabel();
	updateStatusBanner();
}

function planNpcShotVector() {
	if (!cueBall) {
		return { vx: NPC_MIN_SHOT_SPEED, vy: 0 };
	}
	const candidates = balls.filter((ball) => !ball.isCue && ball.active);
	if (candidates.length === 0) {
		return { vx: NPC_MIN_SHOT_SPEED, vy: 0 };
	}
	let target = candidates[0];
	let bestDist = Infinity;
	for (const ball of candidates) {
		const dx = ball.x - cueBall.x;
		const dy = ball.y - cueBall.y;
		const dist = Math.hypot(dx, dy);
		if (dist < bestDist) {
			bestDist = dist;
			target = ball;
		}
	}
	const dx = target.x - cueBall.x;
	const dy = target.y - cueBall.y;
	const mag = Math.hypot(dx, dy);
	if (mag <= 0.0001) {
		return { vx: NPC_MIN_SHOT_SPEED, vy: 0 };
	}
	const speed = rand(NPC_MIN_SHOT_SPEED, NPC_MAX_SHOT_SPEED);
	return {
		vx: (dx / mag) * speed,
		vy: (dy / mag) * speed,
	};
}

function shootFromDrag() {
	const p = currentPlayer();
	if (!p || p.isNpc) {
		answerText.textContent = "NPC turn. Wait.";
		return;
	}
	if (!cueBall || !cueBall.active || !dragStart || !dragNow) {
		return;
	}
	if (phase !== PHASE_SHOT_READY || !shotUnlocked) {
		answerText.textContent = `Shot locked. ${p.label} must answer correctly first.`;
		return;
	}
	const dx = dragStart.x - dragNow.x;
	const dy = dragStart.y - dragNow.y;
	const mag = Math.hypot(dx, dy);
	if (mag < 8) {
		return;
	}
	const power = Math.min(18, mag / 8);
	cueBall.vx = (dx / mag) * power;
	cueBall.vy = (dy / mag) * power;
	shotUnlocked = false;
	beginShotContext();
	setPhase(PHASE_BALLS_MOVING);
	resetRunState();
	answerText.textContent = `${p.label} shot in motion...`;
	updateStatusBanner();
}

function npcShoot() {
	if (!cueBall || !cueBall.active) {
		return;
	}
	const vector = planNpcShotVector();
	cueBall.vx = vector.vx;
	cueBall.vy = vector.vy;
	if (Math.hypot(cueBall.vx, cueBall.vy) < 0.5) {
		cueBall.vx = NPC_MIN_SHOT_SPEED;
		cueBall.vy = 0;
	}
	shotUnlocked = false;
	beginShotContext();
	setPhase(PHASE_BALLS_MOVING);
	resetRunState();
	const p = currentPlayer();
	answerText.textContent = `${p.label} takes the shot.`;
	updateStatusBanner();
}

function hasSeenOnboarding() {
	try {
		return window.localStorage.getItem(ONBOARDING_KEY) === "1";
	} catch {
		return false;
	}
}

function markOnboardingSeen() {
	try {
		window.localStorage.setItem(ONBOARDING_KEY, "1");
	} catch {
		// Ignore localStorage write failures.
	}
}

function maybeShowOnboarding() {
	if (hasSeenOnboarding()) {
		return;
	}
	onboardingModal.classList.remove("hidden");
}

function dismissOnboarding() {
	markOnboardingSeen();
	onboardingModal.classList.add("hidden");
}

function handleNextGroupRequest() {
	if (!gameStarted) {
		return;
	}
	if (currentGroup) {
		answerText.textContent = "Next Group blocked: finish the current question/shot cycle first.";
		return;
	}
	drawNewGroup();
}

function installInputHooks() {
	rackButton.addEventListener("click", () => rackBalls());
	nextButton.addEventListener("click", () => handleNextGroupRequest());
	startGameButton.addEventListener("click", () => startGameFromSetup());
	onboardingDismissButton.addEventListener("click", () => dismissOnboarding());
	muteButton.addEventListener("click", () => {
		audioMuted = !audioMuted;
		updateMuteButton();
	});

	canvas.addEventListener("pointerdown", (event) => {
		if (!gameStarted || !cueBall || !cueBall.active) {
			return;
		}
		const p = currentPlayer();
		if (!p || p.isNpc) {
			return;
		}
		if (phase !== PHASE_SHOT_READY || isShotLocked()) {
			answerText.textContent = "Shot locked: answer first.";
			updateStatusBanner();
			return;
		}
		const rect = canvas.getBoundingClientRect();
		const px = (event.clientX - rect.left) * (canvas.width / rect.width);
		const py = (event.clientY - rect.top) * (canvas.height / rect.height);
		const d = Math.hypot(px - cueBall.x, py - cueBall.y);
		if (d <= cueBall.r + 18) {
			canvas.setPointerCapture(event.pointerId);
			activePointerId = event.pointerId;
			dragging = true;
			dragStart = { x: cueBall.x, y: cueBall.y };
			dragNow = { x: px, y: py };
		}
	});

	canvas.addEventListener("pointermove", (event) => {
		if (!dragging) {
			return;
		}
		const rect = canvas.getBoundingClientRect();
		dragNow = {
			x: (event.clientX - rect.left) * (canvas.width / rect.width),
			y: (event.clientY - rect.top) * (canvas.height / rect.height)
		};
	});

	function clearDragState() {
		if (
			activePointerId !== null &&
			canvas.hasPointerCapture &&
			canvas.hasPointerCapture(activePointerId)
		) {
			try {
				canvas.releasePointerCapture(activePointerId);
			} catch {
				// Ignore release failures.
			}
		}
		dragging = false;
		activePointerId = null;
		dragStart = null;
		dragNow = null;
	}

	canvas.addEventListener("pointerup", () => {
		if (dragging) {
			shootFromDrag();
		}
		clearDragState();
	});
	canvas.addEventListener("pointercancel", () => {
		clearDragState();
	});
	canvas.addEventListener("lostpointercapture", () => {
		clearDragState();
	});
}

function startGameFromSetup() {
	clearScheduledActions();
	const humanCount = Math.max(1, Math.min(8, Number.parseInt(humanCountInput.value, 10) || 1));
	const npcCount = Math.max(0, Math.min(8, Number.parseInt(npcCountInput.value, 10) || 0));
	players = [];
	for (let i = 1; i <= humanCount; i += 1) {
		players.push({ id: `P${i}`, label: `Player ${i}`, isNpc: false });
	}
	for (let i = 1; i <= npcCount; i += 1) {
		players.push({ id: `N${i}`, label: `NPC ${i}`, isNpc: true });
	}
	if (players.length === 0) {
		players = [{ id: "P1", label: "Player 1", isNpc: false }];
	}
	currentTurnIndex = 0;
	gameStarted = true;
	setupModal.classList.add("hidden");
	rackBalls();
	maybeShowOnboarding();
	updateStatusBanner();
}

function animate() {
	updatePhysics();
	drawScene();
	requestAnimationFrame(animate);
}

async function loadGroups() {
	groupLoadState = "pending";
	groupLoadErrorMessage = "";
	try {
		const response = await fetch("functional_groups.json");
		if (!response.ok) {
			throw new Error("group fetch failed");
		}
		const data = await response.json();
		if (data && Array.isArray(data.groups) && data.groups.length > 0) {
			groupPool = data.groups;
			groupLoadState = "remote";
			if (gameStarted && !currentGroup) {
				drawNewGroup();
			}
			return;
		}
		throw new Error("group data schema invalid");
	} catch (error) {
		if (window.location.protocol === "file:") {
			groupPool = LOCAL_FALLBACK_GROUPS.slice();
			groupLoadState = "fallback";
			groupLoadErrorMessage =
				"Opened as file://. Using local fallback groups. " +
				"For full content run: python3 -m http.server 8000 and open http://localhost:8000";
			if (gameStarted && !currentGroup && groupPool.length > 0) {
				drawNewGroup();
			}
			return;
		}
		groupPool = [];
		groupLoadState = "failed";
		groupLoadErrorMessage =
			"Could not load functional_groups.json. Start a local server: " +
			"python3 -m http.server 8000 then open http://localhost:8000";
		console.error("Group load failed:", error);
		if (gameStarted) {
			answerText.textContent = groupLoadErrorMessage;
		}
	}
}

async function main() {
	installInputHooks();
	updateMuteButton();
	setPhase(PHASE_QUESTION_ACTIVE);
	updateScoreLabel();
	updateStatusBanner();
	animate();
	await loadGroups();
}

main();
