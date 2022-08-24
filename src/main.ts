import './styles.css';
import xImg from './assets/x.svg';
import oImg from './assets/o.svg';

type CellValue = 1 | -1 | 0;

export type Board = [
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
];

const boardValues: Board = [0, 0, 0, 0, 0, 0, 0, 0, 0];

// Board cell index combinations required to win the game.
const winCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let turn = 0;
let isPlayerTurn = true;

// Opponent timeout. Used for cancelling the opponents play if the game is reset.
let opponentTimeout: NodeJS.Timeout | null = null;

/**
 * Recursively finds the best move by using the minimax algorithm.
 *
 * @param board
 * @param turn
 * @param maxDepth
 * @param depth
 * @returns The score calculated for the given move.
 */
const recursiveFindBestMove = (
  board: Board,
  turn: number,
  maxDepth: number,
  depth: number,
): number => {
  console.log('depth: ', depth);
  const isX = turn % 2 === 0;
  if (hasWon(board, isX ? -3 : 3)) {
    return isX ? (10 - (turn - 1)) * -1 : 10 - (turn - 1);
  }
  if (depth >= maxDepth || turn >= board.length) {
    return 0;
  }
  let score = isX ? Number.MAX_VALUE * -1 : Number.MAX_VALUE;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0) {
      continue;
    }
    const b = board.slice(0) as Board;
    b[i] = isX ? 1 : -1;
    const newScore = recursiveFindBestMove(b, turn + 1, maxDepth, depth + 1);
    if (isX) {
      if (newScore > score) {
        score = newScore;
      }
    } else if (newScore < score) {
      score = newScore;
    }
  }
  return score;
};

/**
 * Entry for the minimax algorithm.
 *
 * @param board
 * @param maxDepth
 * @returns The index pointing to the best move on the board.
 */
const minimax = (board: Board, maxDepth = 8): number => {
  if (turn >= board.length) {
    return -1;
  }
  const isX = turn % 2 === 0;
  let score = isX ? Number.MAX_VALUE * -1 : Number.MAX_VALUE;
  let idx = -1;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0) {
      continue;
    }
    const b = board.slice(0) as Board;
    b[i] = isX ? 1 : -1;
    const newScore = recursiveFindBestMove(b, turn + 1, maxDepth, 0);
    if (isX) {
      if (newScore > score) {
        score = newScore;
        idx = i;
      }
    } else {
      if (newScore < score) {
        score = newScore;
        idx = i;
      }
    }
  }
  return idx;
};

/**
 * Creates a message that says one of the players has won, and inserts it to the DOM.
 *
 * @param isX
 */
const createWinText = (isX: boolean) => {
  const statusEl = document.getElementById('status');
  if (!statusEl) {
    throw new Error('Status not found!');
  }
  const textBefore = document.createTextNode('Player');
  const img = document.createElement('img');
  img.src = isX ? (xImg as string) : (oImg as string);
  img.alt = isX ? 'X' : 'O';
  img.className = 'player-img';
  const textAfter = document.createTextNode('has won!');
  const text = document.createElement('p');
  text.className = 'status-text';
  text.append(textBefore, img, textAfter);
  statusEl.innerHTML = '';
  statusEl.append(text);
};

/**
 * Ends the game by creating a message that says which player has won,
 * and disables all the buttons that make up the board.
 *
 * @param isX
 */
const stopGame = (isX: boolean) => {
  const board = document.getElementById('board');
  if (!board) {
    throw new Error('Board not found!');
  }
  createWinText(isX);
  for (let i = 0; i < board.children.length; i++) {
    const child = board.children[i];
    if (child instanceof HTMLButtonElement) {
      child.disabled = true;
    }
  }
};

/**
 * Checks if any of the players has won the game.
 *
 * @param board
 * @param winValue
 * @returns True if a player has won, and false if no one has won yet.
 */
const hasWon = (board: Board, winValue: 3 | -3): boolean => {
  for (const c of winCombinations) {
    const value = board[c[0]] + board[c[1]] + board[c[2]];
    if (value === winValue) {
      return true;
    }
  }
  return false;
};

/**
 * Creates a message displaying which player's turn it is, and inserts it into the DOM.
 *
 * @param isX
 */
const createCurrentTurnText = (isX: boolean) => {
  const statusEl = document.getElementById('status');
  if (!statusEl) {
    throw new Error('Status not found!');
  }
  const currentTurnText = document.createElement('p');
  currentTurnText.textContent = 'Current turn:';
  currentTurnText.className = 'status-text';
  const img = document.createElement('img');
  img.className = 'player-img';
  img.src = isX ? (xImg as string) : (oImg as string);
  img.alt = isX ? 'X' : 'O';
  currentTurnText.append(img);
  statusEl.innerHTML = '';
  statusEl.append(currentTurnText);
};

/**
 * Creates a message saying that the game ended in a draw, and inserts it into the DOM.
 */
const printDrawStatus = () => {
  const statusEl = document.getElementById('status');
  if (!statusEl) {
    throw new Error('Status not found!');
  }
  const text = document.createElement('p');
  text.className = 'status-text';
  text.textContent = 'Draw!';
  statusEl.innerHTML = '';
  statusEl.append(text);
};

/**
 * Fills the cell that a player selects, checks if the player won,
 * or if the game has ended in a draw. Otherwise, the turn counter is increased.
 *
 * @param cell
 */
const playTurn = (cell: number) => {
  const isX = turn % 2 === 0;
  const board = document.getElementById('board');
  if (!board) {
    throw new Error('Board not found!');
  }
  let image: HTMLImageElement | null = null;
  let counter = 0;
  for (let i = 0; i < board.children.length; i++) {
    const btn = board.children[i];
    if (!(btn instanceof HTMLButtonElement)) {
      continue;
    }
    const img = btn.firstChild;
    if (!img || !(img instanceof HTMLImageElement)) {
      continue;
    }
    if (counter === cell) {
      image = img;
      break;
    }
    counter++;
  }
  if (!image) {
    throw new Error('Image not found!');
  }
  image.src = isX ? (xImg as string) : (oImg as string);
  image.alt = isX ? 'X' : 'O';
  image.style.display = 'block';
  boardValues[cell] += isX ? 1 : -1;
  createCurrentTurnText(!isX);
  if (hasWon(boardValues, isX ? 3 : -3)) {
    stopGame(isX);
  } else if (turn >= 8) {
    printDrawStatus();
  } else {
    isPlayerTurn = !isX;
    turn++;
  }
};

/**
 * Plays the opponents turn after 0.5s.
 */
const opponentTurn = () => {
  opponentTimeout = setTimeout(() => {
    const cell = minimax(boardValues, 3);
    playTurn(cell);
  }, 500);
};

/**
 * Handles the play made by the player.
 *
 * @param i
 * @returns
 */
const handlePlayerClick = (i: number) => () => {
  if (!isPlayerTurn) {
    return;
  }
  if (boardValues[i] !== 0) {
    return;
  }
  playTurn(i);
  if (turn < 8 && !hasWon(boardValues, 3)) {
    opponentTurn();
  }
};

/**
 * Creates the tic-tac-toe board and inserts it into the DOM.
 */
const createBoard = () => {
  console.log(boardValues);
  const board = document.getElementById('board');
  if (!board) {
    throw new Error('Board not found!');
  }
  const fields: HTMLButtonElement[] = [];
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'field';
    btn.ariaLabel = `Board field button ${i}`;
    const img = document.createElement('img');
    img.className = 'symbol';
    img.style.display = 'none';
    btn.append(img);
    btn.addEventListener('click', handlePlayerClick(i));
    fields.push(btn);
  }
  board.innerHTML = '';
  board.append(...fields);
};

/**
 * Starts a new game.
 */
const newGame = () => {
  if (opponentTimeout) {
    clearTimeout(opponentTimeout);
  }
  for (let i = 0; i < boardValues.length; i++) {
    boardValues[i] = 0;
  }
  turn = 0;
  createBoard();
  createCurrentTurnText(turn % 2 === 0);
  isPlayerTurn = true;
};

/**
 * Adds an event listener to the "New Game" button.
 */
const setNewGameButtonListener = () => {
  const btn = document.getElementById('new-game-btn');
  if (!btn) {
    throw new Error('Button not found!');
  }
  btn.addEventListener('click', newGame);
};

/**
 * Register service worker that handles the cache.
 */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        './service-worker.js',
      );
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

// Initial setup
newGame();
setNewGameButtonListener();
registerServiceWorker();
