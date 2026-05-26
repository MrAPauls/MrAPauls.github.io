const gameBox = document.getElementById("gameBox");
const gameFrame = document.getElementById("gameFrame");
const borderZones = document.querySelectorAll(".borderZone");
const hintButton = document.getElementById("hintButton");
const numberHintButton = document.getElementById("numberHintButton");
let GRID_SIZE = 10;
let LENGTH = 10;
let hoverEnabled = false;
let waitingForRestart = false;
let gameWon = false;
let hintVisible = false;
let numberHintVisible = false;
let offTrackMessageElement = null;
let winMessageElement = null;
let offTrackCount = 0;
let flippedPathTileKeys = new Set();
let activeTouchId = null;
let lastTouchTarget = null;

function clearGameBox() {
  while (gameBox.firstChild) {
    gameBox.removeChild(gameBox.firstChild);
  }

  // Message overlays are children of gameBox, so they are removed here too.
  // Reset refs so ensure*Message can recreate them on the next render.
  offTrackMessageElement = null;
  winMessageElement = null;
}

function updateGridLayout() {
  gameBox.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  gameBox.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
}

function ensureOffTrackMessage() {
  if (offTrackMessageElement) {
    return;
  }

  gameBox.style.position = "relative";

  offTrackMessageElement = document.createElement("div");
  offTrackMessageElement.textContent = "OFF TRACK - start again";
  offTrackMessageElement.style.position = "absolute";
  offTrackMessageElement.style.top = "50%";
  offTrackMessageElement.style.left = "50%";
  offTrackMessageElement.style.transform = "translate(-50%, -50%)";
  offTrackMessageElement.style.padding = "10px 16px";
  offTrackMessageElement.style.borderRadius = "8px";
  offTrackMessageElement.style.backgroundColor = "#b00020";
  offTrackMessageElement.style.color = "#ffffff";
  offTrackMessageElement.style.fontFamily = "sans-serif";
  offTrackMessageElement.style.fontWeight = "700";
  offTrackMessageElement.style.letterSpacing = "0.4px";
  offTrackMessageElement.style.display = "none";
  offTrackMessageElement.style.zIndex = "999";
  offTrackMessageElement.style.pointerEvents = "none";
  gameBox.appendChild(offTrackMessageElement);
}

function ensureWinMessage() {
  if (winMessageElement) {
    return;
  }

  winMessageElement = document.createElement("div");
  winMessageElement.textContent = "YOU WIN!";
  winMessageElement.style.position = "absolute";
  winMessageElement.style.top = "50%";
  winMessageElement.style.left = "50%";
  winMessageElement.style.transform = "translate(-50%, -50%)";
  winMessageElement.style.padding = "10px 16px";
  winMessageElement.style.borderRadius = "8px";
  winMessageElement.style.backgroundColor = "#1b8a3c";
  winMessageElement.style.color = "#ffffff";
  winMessageElement.style.fontFamily = "sans-serif";
  winMessageElement.style.fontWeight = "700";
  winMessageElement.style.letterSpacing = "0.4px";
  winMessageElement.style.display = "none";
  winMessageElement.style.zIndex = "999";
  winMessageElement.style.pointerEvents = "none";
  gameBox.appendChild(winMessageElement);
}

function showOffTrackMessage() {
  ensureOffTrackMessage();
  offTrackMessageElement.style.display = "block";
}

function hideOffTrackMessage() {
  ensureOffTrackMessage();
  offTrackMessageElement.style.display = "none";
}

function showWinMessage() {
  ensureWinMessage();
  winMessageElement.style.display = "block";
}

function hideWinMessage() {
  ensureWinMessage();
  winMessageElement.style.display = "none";
}

function calculateScore() {
  return flippedPathTileKeys.size - offTrackCount;
}

function resetScoreState() {
  offTrackCount = 0;
  flippedPathTileKeys = new Set();

  if (winMessageElement) {
    winMessageElement.textContent = "YOU WIN!";
  }
}

function updateHintButtonLabel() {
  if (!hintButton) {
    return;
  }

  hintButton.textContent = hintVisible ? "Hide Hint" : "Show Hint";
}

function updateNumberHintButtonLabel() {
  if (!numberHintButton) {
    return;
  }

  numberHintButton.textContent = numberHintVisible
    ? "Hide Number Hint"
    : "Show Number Hint";
}

function getOrthogonalPathNeighborCount(tile) {
  const [rowString, colString] = tile.dataset.tileKey.split("-");
  const row = Number(rowString);
  const col = Number(colString);
  const orthogonalNeighbors = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];

  let count = 0;

  for (const neighbor of orthogonalNeighbors) {
    const neighborTile = getTile(neighbor.row, neighbor.col);
    if (
      neighborTile &&
      neighborTile.classList.contains("path") &&
      !neighborTile.classList.contains("start") &&
      !neighborTile.classList.contains("finish")
    ) {
      count += 1;
    }
  }

  return count;
}

function applyNumberHintVisibility() {
  const tiles = gameBox.querySelectorAll(".tile");

  for (const tile of tiles) {
    if (
      !tile.classList.contains("path") ||
      !tile.classList.contains("revealed")
    ) {
      tile.textContent = "";
      continue;
    }

    tile.textContent = numberHintVisible
      ? String(getOrthogonalPathNeighborCount(tile))
      : "";
  }
}

function toggleNumberHint() {
  numberHintVisible = !numberHintVisible;
  updateNumberHintButtonLabel();
  applyNumberHintVisibility();
}

function applyHintVisibility() {
  const pathTiles = gameBox.querySelectorAll(".tile.path");

  for (const tile of pathTiles) {
    if (tile.classList.contains("start") || tile.classList.contains("finish")) {
      continue;
    }

    if (tile.classList.contains("revealed")) {
      tile.style.backgroundColor = "black";
      continue;
    }

    tile.style.backgroundColor = hintVisible ? "#d9d9d9" : "white";
  }
}

function toggleHint() {
  hintVisible = !hintVisible;
  updateHintButtonLabel();
  applyHintVisibility();
}

function triggerOffTrackScenario() {
  offTrackCount += 1;
  waitingForRestart = true;
  hoverEnabled = false;
  showOffTrackMessage();
}

function handleBorderHover() {
  if (gameWon || !hoverEnabled || waitingForRestart) {
    return;
  }

  triggerOffTrackScenario();
}

function processTileInteraction(tile) {
  if (gameWon) {
    return;
  }

  if (tile.classList.contains("start")) {
    hoverEnabled = true;
    waitingForRestart = false;
    hideOffTrackMessage();
    return;
  }

  if (!hoverEnabled || waitingForRestart) {
    return;
  }

  if (tile.classList.contains("finish")) {
    const finalScore = calculateScore();
    gameWon = true;
    hoverEnabled = false;
    waitingForRestart = false;
    hideOffTrackMessage();
    winMessageElement.textContent = `YOU WIN! Score: ${finalScore}`;
    showWinMessage();
    return;
  }

  if (tile.classList.contains("path")) {
    tile.classList.add("revealed");
    tile.style.backgroundColor = "black";
    flippedPathTileKeys.add(tile.dataset.tileKey);
    if (numberHintVisible) {
      tile.textContent = String(getOrthogonalPathNeighborCount(tile));
    }
  } else {
    tile.style.backgroundColor = "yellow";
    triggerOffTrackScenario();
  }
}

function handleTileHover(event) {
  processTileInteraction(event.currentTarget);
}

function processTouchTarget(target) {
  if (!target || !gameFrame.contains(target)) {
    handleBorderHover();
    return;
  }

  const tile = target.closest(".tile");
  if (tile) {
    processTileInteraction(tile);
    return;
  }

  if (target.closest(".borderZone")) {
    handleBorderHover();
  }
}

function getTrackedTouch(touchList) {
  for (const touch of touchList) {
    if (touch.identifier === activeTouchId) {
      return touch;
    }
  }

  return null;
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  if (!touch) {
    return;
  }

  activeTouchId = touch.identifier;
  const target =
    document.elementFromPoint(touch.clientX, touch.clientY) || event.target;
  lastTouchTarget = target;
  processTouchTarget(target);
  event.preventDefault();
}

function handleTouchMove(event) {
  if (activeTouchId === null) {
    return;
  }

  const touch =
    getTrackedTouch(event.touches) || getTrackedTouch(event.changedTouches);
  if (!touch) {
    return;
  }

  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target !== lastTouchTarget) {
    lastTouchTarget = target;
    processTouchTarget(target);
  }

  event.preventDefault();
}

function handleTouchEnd(event) {
  if (!getTrackedTouch(event.changedTouches)) {
    return;
  }

  activeTouchId = null;
  lastTouchTarget = null;
}

function generateBoard() {
  //Generate 10x10 grid of tiles
  for (let row = 1; row <= GRID_SIZE; row += 1) {
    for (let col = 1; col <= GRID_SIZE; col += 1) {
      const tile = document.createElement("div");
      tile.className = `tile tile-${row}-${col}`;
      tile.dataset.tileKey = `${row}-${col}`;
      tile.addEventListener("mouseenter", handleTileHover);
      gameBox.appendChild(tile);
    }
  }
}

// Helper functions
function getTile(row, col) {
  return document.querySelector(`.tile-${row}-${col}`);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function tileKey(tile) {
  return `${tile.row}-${tile.col}`;
}

function getRandomEdgeTile() {
  const side = randomInt(4);

  if (side === 0) {
    return { row: 1, col: randomInt(GRID_SIZE) + 1 };
  }

  if (side === 1) {
    return { row: GRID_SIZE, col: randomInt(GRID_SIZE) + 1 };
  }

  if (side === 2) {
    return { row: randomInt(GRID_SIZE) + 1, col: 1 };
  }

  return { row: randomInt(GRID_SIZE) + 1, col: GRID_SIZE };
}

function getUnvisitedNeighbors(tile, visited) {
  const candidates = [
    { row: tile.row - 1, col: tile.col },
    { row: tile.row + 1, col: tile.col },
    { row: tile.row, col: tile.col - 1 },
    { row: tile.row, col: tile.col + 1 },
  ];

  return candidates.filter((candidate) => {
    const isInside =
      candidate.row >= 1 &&
      candidate.row <= GRID_SIZE &&
      candidate.col >= 1 &&
      candidate.col <= GRID_SIZE;

    return isInside && !visited.has(tileKey(candidate));
  });
}

// Build a connected random path with length approximately equal to targetLength.
function buildApproximatePath(start, targetLength) {
  const maxLength = GRID_SIZE * GRID_SIZE;
  const desiredLength = Math.max(1, Math.min(targetLength, maxLength));
  const attempts = 300;
  let bestPath = [{ row: start.row, col: start.col }];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const path = [{ row: start.row, col: start.col }];
    const visited = new Set([tileKey(start)]);

    while (path.length < desiredLength) {
      const current = path[path.length - 1];
      const options = getUnvisitedNeighbors(current, visited);

      if (options.length === 0) {
        break;
      }

      const next = options[randomInt(options.length)];
      path.push(next);
      visited.add(tileKey(next));
    }

    if (
      Math.abs(path.length - desiredLength) <
      Math.abs(bestPath.length - desiredLength)
    ) {
      bestPath = path;
    }

    if (path.length === desiredLength) {
      return path;
    }
  }

  return bestPath;
}

function renderGame() {
  clearGameBox();
  updateGridLayout();
  generateBoard();
  ensureOffTrackMessage();
  ensureWinMessage();
  hideOffTrackMessage();
  hideWinMessage();
  hoverEnabled = false;
  waitingForRestart = false;
  gameWon = false;

  const start = getRandomEdgeTile();
  const path = buildApproximatePath(start, LENGTH);
  const finish = path[path.length - 1];

  for (const step of path) {
    const tile = getTile(step.row, step.col);
    tile.classList.add("path");
    tile.style.backgroundColor = "white";
  }

  const startTile = getTile(start.row, start.col);
  const finishTile = getTile(finish.row, finish.col);

  startTile.classList.add("start");
  startTile.style.backgroundColor = "green";

  finishTile.classList.add("finish");
  finishTile.style.backgroundColor = "red";
}

function generatePath() {
  GRID_SIZE = parseInt(document.getElementById("size").value, 10);
  const difficulty = document.getElementById("difficulty").value;

  resetScoreState();
  hintVisible = false;
  numberHintVisible = false;
  updateHintButtonLabel();
  updateNumberHintButtonLabel();

  if (difficulty === "easy") {
    LENGTH = Math.floor(GRID_SIZE * GRID_SIZE * 0.25);
  } else if (difficulty === "medium") {
    LENGTH = Math.floor(GRID_SIZE * GRID_SIZE * 0.5);
  } else if (difficulty === "hard") {
    LENGTH = Math.floor(GRID_SIZE * GRID_SIZE * 0.75);
  } else {
    LENGTH = Math.floor(GRID_SIZE * GRID_SIZE * 0.25);
  }

  renderGame();
}

for (const borderZone of borderZones) {
  borderZone.addEventListener("mouseenter", handleBorderHover);
}

gameFrame.style.touchAction = "none";
gameFrame.addEventListener("touchstart", handleTouchStart, { passive: false });
gameFrame.addEventListener("touchmove", handleTouchMove, { passive: false });
gameFrame.addEventListener("touchend", handleTouchEnd, { passive: false });
gameFrame.addEventListener("touchcancel", handleTouchEnd, { passive: false });

updateHintButtonLabel();
updateNumberHintButtonLabel();

// Initial render
generatePath();
