import test from "node:test";
import assert from "node:assert/strict";
import { bestMove, winner, type Mark } from "../lib/play";
import { Chess } from "chess.js";
test("bot never loses across every possible human line", () => {
  function visit(b: Mark[]) {
    assert.notEqual(winner(b), "X");
    if (winner(b) || b.every(Boolean)) return;
    for (let i = 0; i < 9; i++)
      if (!b[i]) {
        const n = [...b];
        n[i] = "X";
        assert.notEqual(winner(n), "X");
        const j = bestMove(n);
        if (j >= 0) n[j] = "O";
        visit(n);
      }
  }
  visit(Array(9).fill(null));
});
test("chess detects checkmate and rejects illegal moves", () => {
  const c = new Chess();
  assert.throws(() => c.move({ from: "e2", to: "e5" }));
  for (const m of ["f3", "e5", "g4", "Qh4#"]) c.move(m);
  assert.equal(c.isCheckmate(), true);
});
test("chess history replay preserves repetition draw", () => {
  const c = new Chess();
  for (const m of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"])
    c.move(m);
  const replay = new Chess();
  for (const m of c.history()) replay.move(m);
  assert.equal(replay.isThreefoldRepetition(), true);
});
