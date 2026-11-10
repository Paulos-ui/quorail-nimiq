export type Mark = "X" | "O" | null;
export function winner(board: Mark[]): Mark {
  for (const [a, b, c] of [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ])
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  return null;
}
export function bestMove(board: Mark[], player: "X" | "O" = "O"): number {
  function score(b: Mark[], turn: "X" | "O"): number {
    const w = winner(b);
    if (w) return w === "O" ? 1 : -1;
    if (b.every(Boolean)) return 0;
    const scores = b.flatMap((v, i) => {
      if (v) return [];
      const n = [...b];
      n[i] = turn;
      return [score(n, turn === "O" ? "X" : "O")];
    });
    return turn === "O" ? Math.max(...scores) : Math.min(...scores);
  }
  if (winner(board)) return -1;
  let choice = -1,
    value = player === "O" ? -2 : 2;
  for (const i of [4, 0, 2, 6, 8, 1, 3, 5, 7])
    if (!board[i]) {
      const b = [...board];
      b[i] = player;
      const s = score(b, player === "O" ? "X" : "O");
      if (player === "O" ? s > value : s < value) {
        value = s;
        choice = i;
      }
    }
  return choice;
}
