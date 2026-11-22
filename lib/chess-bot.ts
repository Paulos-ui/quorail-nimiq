import { Chess, type Move } from "chess.js";
const values: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};
function evaluation(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === "b" ? -100000 : 100000;
  if (game.isDraw()) return 0;
  return game
    .board()
    .flat()
    .reduce(
      (sum, p) => sum + (p ? (p.color === "b" ? 1 : -1) * values[p.type] : 0),
      0,
    );
}
export function chessBotMove(history: string[], depth = 2): Move | null {
  const game = new Chess();
  for (const m of history) game.move(m);
  if (game.isGameOver()) return null;
  function search(d: number, alpha: number, beta: number): number {
    if (d === 0 || game.isGameOver()) return evaluation(game);
    const max = game.turn() === "b";
    let best = max ? -Infinity : Infinity;
    for (const m of game
      .moves({ verbose: true })
      .sort(
        (a, b) =>
          (values[b.captured || ""] || 0) - (values[a.captured || ""] || 0),
      )) {
      game.move(m);
      const score = search(d - 1, alpha, beta);
      game.undo();
      best = max ? Math.max(best, score) : Math.min(best, score);
      if (max) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best: Move | null = null,
    value = -Infinity;
  for (const move of game.moves({ verbose: true })) {
    game.move(move);
    const score = search(
      Math.min(3, Math.max(1, depth)) - 1,
      -Infinity,
      Infinity,
    );
    game.undo();
    if (score > value) {
      value = score;
      best = move;
    }
  }
  return best;
}
