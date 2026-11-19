/**
 * Strictly Orthogonal Dots & Boxes Engine
 * For an N x N dot grid (N in {4, 6, 8, 10, 12, 14}):
 * - Horizontal edges: N rows x (N - 1) cols
 * - Vertical edges: (N - 1) rows x N cols
 * - Boxes: (N - 1) rows x (N - 1) cols
 * Diagonal edges are structurally impossible.
 */

export type PlayerId = 1 | 2;
export type CellOwner = 0 | 1 | 2;
export type EdgeOrientation = 'h' | 'v';

export interface EdgeMove {
  type: EdgeOrientation;
  r: number;
  c: number;
}

export interface CapturedBoxCoord {
  r: number;
  c: number;
}

export interface BoardState {
  gridSize: number;
  hEdges: CellOwner[][];
  vEdges: CellOwner[][];
  boxes: CellOwner[][];
  currentPlayer: PlayerId;
  scores: { p1: number; p2: number };
  totalMoves: number;
  currentChain: number;
  maxChain: number;
  isGameOver: boolean;
  winner: 0 | 1 | 2; // 0 = draw
  lastMove: EdgeMove | null;
}

export interface MoveResult {
  nextState: BoardState;
  capturedBoxes: CapturedBoxCoord[];
  extraTurn: boolean;
  comboCount: number;
}

export function createInitialBoard(gridSize: number): BoardState {
  const boxCount = gridSize - 1;
  const hEdges: CellOwner[][] = Array.from({ length: gridSize }, () =>
    Array<CellOwner>(boxCount).fill(0)
  );
  const vEdges: CellOwner[][] = Array.from({ length: boxCount }, () =>
    Array<CellOwner>(gridSize).fill(0)
  );
  const boxes: CellOwner[][] = Array.from({ length: boxCount }, () =>
    Array<CellOwner>(boxCount).fill(0)
  );

  return {
    gridSize,
    hEdges,
    vEdges,
    boxes,
    currentPlayer: 1,
    scores: { p1: 0, p2: 0 },
    totalMoves: 0,
    currentChain: 0,
    maxChain: 0,
    isGameOver: false,
    winner: 0,
    lastMove: null,
  };
}

export function cloneBoard(state: BoardState): BoardState {
  return {
    ...state,
    hEdges: state.hEdges.map((row) => [...row]),
    vEdges: state.vEdges.map((row) => [...row]),
    boxes: state.boxes.map((row) => [...row]),
    scores: { ...state.scores },
    lastMove: state.lastMove ? { ...state.lastMove } : null,
  };
}

export function isEdgeAvailable(state: BoardState, move: EdgeMove): boolean {
  const n = state.gridSize;
  if (move.type === 'h') {
    if (move.r < 0 || move.r >= n || move.c < 0 || move.c >= n - 1) return false;
    return state.hEdges[move.r][move.c] === 0;
  } else {
    if (move.r < 0 || move.r >= n - 1 || move.c < 0 || move.c >= n) return false;
    return state.vEdges[move.r][move.c] === 0;
  }
}

export function getBoxSideCount(state: BoardState, br: number, bc: number): number {
  let sides = 0;
  if (state.hEdges[br][bc] !== 0) sides++;
  if (state.hEdges[br + 1][bc] !== 0) sides++;
  if (state.vEdges[br][bc] !== 0) sides++;
  if (state.vEdges[br][bc + 1] !== 0) sides++;
  return sides;
}

export function getAdjacentBoxes(gridSize: number, move: EdgeMove): CapturedBoxCoord[] {
  const maxBox = gridSize - 1;
  const result: CapturedBoxCoord[] = [];
  if (move.type === 'h') {
    if (move.r > 0) result.push({ r: move.r - 1, c: move.c });
    if (move.r < maxBox) result.push({ r: move.r, c: move.c });
  } else {
    if (move.c > 0) result.push({ r: move.r, c: move.c - 1 });
    if (move.c < maxBox) result.push({ r: move.r, c: move.c });
  }
  return result;
}

export function getAllAvailableMoves(state: BoardState): EdgeMove[] {
  const n = state.gridSize;
  const moves: EdgeMove[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - 1; c++) {
      if (state.hEdges[r][c] === 0) moves.push({ type: 'h', r, c });
    }
  }
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n; c++) {
      if (state.vEdges[r][c] === 0) moves.push({ type: 'v', r, c });
    }
  }
  return moves;
}

export function applyMove(state: BoardState, move: EdgeMove): MoveResult | null {
  if (state.isGameOver || !isEdgeAvailable(state, move)) {
    return null;
  }

  const next = cloneBoard(state);
  const player = state.currentPlayer;

  if (move.type === 'h') {
    next.hEdges[move.r][move.c] = player;
  } else {
    next.vEdges[move.r][move.c] = player;
  }

  const adj = getAdjacentBoxes(next.gridSize, move);
  const capturedBoxes: CapturedBoxCoord[] = [];

  for (const b of adj) {
    if (next.boxes[b.r][b.c] === 0 && getBoxSideCount(next, b.r, b.c) === 4) {
      next.boxes[b.r][b.c] = player;
      capturedBoxes.push(b);
    }
  }

  next.totalMoves = state.totalMoves + 1;
  next.lastMove = move;

  let extraTurn = false;
  let comboCount = 0;

  if (capturedBoxes.length > 0) {
    if (player === 1) {
      next.scores.p1 += capturedBoxes.length;
    } else {
      next.scores.p2 += capturedBoxes.length;
    }
    next.currentChain = state.currentChain + capturedBoxes.length;
    next.maxChain = Math.max(state.maxChain, next.currentChain);
    extraTurn = true;
    comboCount = next.currentChain;
    next.currentPlayer = player;
  } else {
    next.currentChain = 0;
    next.currentPlayer = player === 1 ? 2 : 1;
  }

  const totalBoxes = (next.gridSize - 1) * (next.gridSize - 1);
  if (next.scores.p1 + next.scores.p2 >= totalBoxes) {
    next.isGameOver = true;
    if (next.scores.p1 > next.scores.p2) next.winner = 1;
    else if (next.scores.p2 > next.scores.p1) next.winner = 2;
    else next.winner = 0;
  }

  return {
    nextState: next,
    capturedBoxes,
    extraTurn,
    comboCount,
  };
}

/**
 * Counts how many boxes an opponent would immediately chain-capture if `move` is played.
 */
export function simulateChainOffered(state: BoardState, move: EdgeMove): number {
  const sim = cloneBoard(state);
  if (move.type === 'h') sim.hEdges[move.r][move.c] = sim.currentPlayer;
  else sim.vEdges[move.r][move.c] = sim.currentPlayer;

  const boxN = sim.gridSize - 1;
  let captured = 0;
  let progress = true;

  while (progress) {
    progress = false;
    for (let r = 0; r < boxN; r++) {
      for (let c = 0; c < boxN; c++) {
        if (sim.boxes[r][c] === 0 && getBoxSideCount(sim, r, c) === 3) {
          // Fill the missing 4th edge
          if (sim.hEdges[r][c] === 0) sim.hEdges[r][c] = 2;
          else if (sim.hEdges[r + 1][c] === 0) sim.hEdges[r + 1][c] = 2;
          else if (sim.vEdges[r][c] === 0) sim.vEdges[r][c] = 2;
          else if (sim.vEdges[r][c + 1] === 0) sim.vEdges[r][c + 1] = 2;

          // Mark newly completed 4-sided boxes
          for (let rr = Math.max(0, r - 1); rr <= Math.min(boxN - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(boxN - 1, c + 1); cc++) {
              if (sim.boxes[rr][cc] === 0 && getBoxSideCount(sim, rr, cc) === 4) {
                sim.boxes[rr][cc] = 2;
                captured++;
              }
            }
          }
          progress = true;
        }
      }
    }
  }

  return captured;
}

export function analyzeBoardForCoach(
  state: BoardState,
  mode: 'local' | 'ai',
  difficulty: 'easy' | 'medium' | 'hard'
) {
  const available = getAllAvailableMoves(state);
  const boxN = state.gridSize - 1;
  let capturableBoxesCount = 0;

  for (let r = 0; r < boxN; r++) {
    for (let c = 0; c < boxN; c++) {
      if (state.boxes[r][c] === 0 && getBoxSideCount(state, r, c) === 3) {
        capturableBoxesCount++;
      }
    }
  }

  let safeMovesCount = 0;
  let shortestChainOffer: number | null = null;

  for (const mv of available) {
    const adj = getAdjacentBoxes(state.gridSize, mv);
    const completes = adj.some((b) => getBoxSideCount(state, b.r, b.c) === 3);
    if (completes) continue;

    const createsThird = adj.some((b) => getBoxSideCount(state, b.r, b.c) === 2);
    if (!createsThird) {
      safeMovesCount++;
    } else if (safeMovesCount === 0 && available.length <= 80) {
      const chainLen = simulateChainOffered(state, mv);
      if (shortestChainOffer === null || chainLen < shortestChainOffer) {
        shortestChainOffer = chainLen;
      }
    }
  }

  return {
    gridSize: state.gridSize,
    mode,
    difficulty,
    scores: state.scores,
    currentPlayer: state.currentPlayer,
    totalBoxes: boxN * boxN,
    safeMovesCount,
    capturableBoxesCount,
    shortestChainOffer,
    movesPlayed: state.totalMoves,
  };
}
