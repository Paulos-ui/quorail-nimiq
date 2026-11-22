export type Disc = 0 | 1 | 2;
export type Grid = Disc[][];
export const newGrid = (): Grid =>
  Array.from({ length: 6 }, () => Array<Disc>(7).fill(0));
export function drop(grid: Grid, column: number, disc: 1 | 2): Grid | null {
  if (!Number.isInteger(column) || column < 0 || column > 6 || grid[0][column])
    return null;
  const next = grid.map((row) => [...row]);
  for (let row = 5; row >= 0; row--)
    if (!next[row][column]) {
      next[row][column] = disc;
      return next;
    }
  return null;
}
export function fourWinner(grid: Grid): Disc {
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 7; c++) {
      const disc = grid[r][c];
      if (!disc) continue;
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ]) {
        let count = 1;
        for (let k = 1; k < 4; k++)
          if (grid[r + dr * k]?.[c + dc * k] === disc) count++;
          else break;
        if (count === 4) return disc;
      }
    }
  return 0;
}
export function fourBot(grid: Grid): number {
  const columns = [3, 2, 4, 1, 5, 0, 6].filter((c) => !grid[0][c]);
  for (const disc of [2, 1] as const)
    for (const c of columns)
      if (fourWinner(drop(grid, c, disc)!) === disc) return c;
  // Avoid giving the opponent an immediate winning reply when possible.
  return (
    columns.find((c) => {
      const next = drop(grid, c, 2)!;
      return !columns.some((reply) => {
        const g = drop(next, reply, 1);
        return g && fourWinner(g) === 1;
      });
    }) ??
    columns[0] ??
    -1
  );
}
