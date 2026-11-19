import {
  BoardState,
  EdgeMove,
  cloneBoard,
  getAdjacentBoxes,
  getAllAvailableMoves,
  getBoxSideCount,
  simulateChainOffered,
} from './dotsAndBoxes';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getEdgeFor3SidedBox(state: BoardState, r: number, c: number): EdgeMove | null {
  if (state.hEdges[r][c] === 0) return { type: 'h', r, c };
  if (state.hEdges[r + 1][c] === 0) return { type: 'h', r: r + 1, c };
  if (state.vEdges[r][c] === 0) return { type: 'v', r, c };
  if (state.vEdges[r][c + 1] === 0) return { type: 'v', r, c: c + 1 };
  return null;
}

function getCompletingMoves(state: BoardState, moves: EdgeMove[]): EdgeMove[] {
  return moves.filter((mv) =>
    getAdjacentBoxes(state.gridSize, mv).some((b) => getBoxSideCount(state, b.r, b.c) === 3)
  );
}

function getSafeMoves(state: BoardState, moves: EdgeMove[]): EdgeMove[] {
  return moves.filter((mv) => {
    const adj = getAdjacentBoxes(state.gridSize, mv);
    return adj.every((b) => {
      const s = getBoxSideCount(state, b.r, b.c);
      return s < 2;
    });
  });
}

/**
 * Counts total boxes currently capturable in one continuous greedy chain.
 */
function measureCurrentCapturableChain(state: BoardState): {
  length: number;
  chainEdges: EdgeMove[];
} {
  const sim = cloneBoard(state);
  const boxN = sim.gridSize - 1;
  const chainEdges: EdgeMove[] = [];
  let length = 0;

  let progress = true;
  while (progress) {
    progress = false;
    for (let r = 0; r < boxN; r++) {
      for (let c = 0; c < boxN; c++) {
        if (sim.boxes[r][c] === 0 && getBoxSideCount(sim, r, c) === 3) {
          const mv = getEdgeFor3SidedBox(sim, r, c);
          if (!mv) continue;
          chainEdges.push(mv);
          if (mv.type === 'h') sim.hEdges[mv.r][mv.c] = 2;
          else sim.vEdges[mv.r][mv.c] = 2;

          for (const adj of getAdjacentBoxes(sim.gridSize, mv)) {
            if (sim.boxes[adj.r][adj.c] === 0 && getBoxSideCount(sim, adj.r, adj.c) === 4) {
              sim.boxes[adj.r][adj.c] = 2;
              length++;
            }
          }
          progress = true;
          break;
        }
      }
      if (progress) break;
    }
  }

  return { length, chainEdges };
}

/**
 * Checks if any safe moves remain after taking the current open chain.
 */
function hasSafeMovesAfterChain(state: BoardState): {
  hasSafe: boolean;
  remainingBoxesAfterChain: number;
} {
  const sim = cloneBoard(state);
  const boxN = sim.gridSize - 1;

  let progress = true;
  while (progress) {
    progress = false;
    for (let r = 0; r < boxN; r++) {
      for (let c = 0; c < boxN; c++) {
        if (sim.boxes[r][c] === 0 && getBoxSideCount(sim, r, c) === 3) {
          const mv = getEdgeFor3SidedBox(sim, r, c);
          if (!mv) continue;
          if (mv.type === 'h') sim.hEdges[mv.r][mv.c] = 2;
          else sim.vEdges[mv.r][mv.c] = 2;
          for (const adj of getAdjacentBoxes(sim.gridSize, mv)) {
            if (sim.boxes[adj.r][adj.c] === 0 && getBoxSideCount(sim, adj.r, adj.c) === 4) {
              sim.boxes[adj.r][adj.c] = 2;
            }
          }
          progress = true;
        }
      }
    }
  }

  const remainingMoves = getAllAvailableMoves(sim);
  const safeMoves = getSafeMoves(sim, remainingMoves);
  let remainingBoxes = 0;
  for (let r = 0; r < boxN; r++) {
    for (let c = 0; c < boxN; c++) {
      if (sim.boxes[r][c] === 0) remainingBoxes++;
    }
  }

  return {
    hasSafe: safeMoves.length > 0,
    remainingBoxesAfterChain: remainingBoxes,
  };
}

/**
 * 3-Tier AI Move Selector:
 * - Easy (آسان): Takes an immediate box if available, otherwise random edge.
 * - Medium (متوسط): Takes available boxes, strictly avoids creating 3rd edges unless forced.
 * - Hard (سخت): Full tactical evaluator — safe moves prioritizing low chain formation,
 *   double-cross sacrifice in endgame chains, and minimal-sacrifice chain counting.
 */
export function chooseAiMove(state: BoardState, difficulty: AiDifficulty): EdgeMove | null {
  const available = getAllAvailableMoves(state);
  if (available.length === 0) return null;

  const completing = getCompletingMoves(state, available);

  // --- EASY ---
  if (difficulty === 'easy') {
    if (completing.length > 0 && Math.random() < 0.85) {
      return pickRandom(completing);
    }
    return pickRandom(available);
  }

  // --- MEDIUM ---
  if (difficulty === 'medium') {
    if (completing.length > 0) {
      // Prefer double-box completion if available
      const doubleCompleting = completing.filter(
        (mv) =>
          getAdjacentBoxes(state.gridSize, mv).filter(
            (b) => getBoxSideCount(state, b.r, b.c) === 3
          ).length === 2
      );
      return doubleCompleting.length > 0
        ? pickRandom(doubleCompleting)
        : pickRandom(completing);
    }
    const safe = getSafeMoves(state, available);
    if (safe.length > 0) {
      return pickRandom(safe);
    }
    return pickRandom(available);
  }

  // --- HARD (Tactical Endgame + Double-Cross + Minimal Sacrifice) ---
  if (completing.length > 0) {
    // Prefer double-box capturing edges immediately when inside a chain
    const doubleCompleting = completing.filter(
      (mv) =>
        getAdjacentBoxes(state.gridSize, mv).filter(
          (b) => getBoxSideCount(state, b.r, b.c) === 3
        ).length === 2
    );

    const { length, chainEdges } = measureCurrentCapturableChain(state);
    const { hasSafe, remainingBoxesAfterChain } = hasSafeMovesAfterChain(state);

    // Double-Cross (Hard-Hearted Handout) check:
    // If NO safe moves remain after this chain, we are down to the last 2 boxes of the current chain,
    // and there are still >= 3 boxes left elsewhere (a bigger chain for us to steal!),
    // sacrifice the last 2 boxes by playing the 2nd edge of the 2-box chain instead of the 1st!
    if (!hasSafe && length === 2 && remainingBoxesAfterChain >= 3 && chainEdges.length >= 2) {
      const doubleCrossMove = chainEdges[1];
      // Verify it's not a completing move itself (i.e., it hands over 2 boxes and keeps control)
      const isDirectCapture = getAdjacentBoxes(state.gridSize, doubleCrossMove).some(
        (b) => getBoxSideCount(state, b.r, b.c) === 3
      );
      if (!isDirectCapture) {
        return doubleCrossMove;
      }
    }

    if (doubleCompleting.length > 0) {
      return pickRandom(doubleCompleting);
    }
    return completing[0];
  }

  // No immediate captures -> evaluate safe moves first
  const safe = getSafeMoves(state, available);
  if (safe.length > 0) {
    // Score safe moves: prefer moves touching 0-sided boxes over 1-sided boxes to delay long chains
    let bestScore = -Infinity;
    let bestMoves: EdgeMove[] = [];

    for (const mv of safe) {
      const adj = getAdjacentBoxes(state.gridSize, mv);
      let score = 0;
      for (const b of adj) {
        const sides = getBoxSideCount(state, b.r, b.c);
        score += sides === 0 ? 3 : 1; // 0-sided is safer than creating a 2-sided corridor
      }
      // Subtle center/balanced preference
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [mv];
      } else if (score === bestScore) {
        bestMoves.push(mv);
      }
    }
    return pickRandom(bestMoves);
  }

  // Forced sacrifice -> evaluate exact chain length opened by each candidate move
  // Pick the move offering the MINIMUM chain length to the opponent!
  let minChain = Infinity;
  let bestSacrifices: EdgeMove[] = [];

  // Sample up to 64 moves if board is massive (14x14) to keep frame rate silky 60fps
  const candidates =
    available.length > 64
      ? available.slice().sort(() => Math.random() - 0.5).slice(0, 64)
      : available;

  for (const mv of candidates) {
    const offered = simulateChainOffered(state, mv);
    if (offered < minChain) {
      minChain = offered;
      bestSacrifices = [mv];
    } else if (offered === minChain) {
      bestSacrifices.push(mv);
    }
  }

  return pickRandom(bestSacrifices);
}
