"use client";
import { useState } from "react";
import { Chess, type Square } from "chess.js";
import Link from "next/link";
import Brand from "./Brand";
import InstallApp from "./InstallApp";
import { winner, bestMove, type Mark } from "@/lib/play";
const glyphs: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};
export default function PlayRoom() {
  const [mode, setMode] = useState("tic"),
    [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [chess, setChess] = useState(() => new Chess()),
    [from, setFrom] = useState<Square | null>(null),
    [promotion, setPromotion] = useState("q");
  const [solved, setSolved] = useState<number | null>(null);
  const win = winner(board),
    over = !!win || board.every(Boolean);
  const legal = from
    ? chess.moves({ square: from, verbose: true }).map((m) => m.to)
    : [];
  function move(square: Square) {
    if (chess.isGameOver()) return;
    if (from && legal.includes(square)) {
      const next = new Chess();
      for (const m of chess.history()) next.move(m);
      next.move({ from, to: square, promotion });
      setChess(next);
      setFrom(null);
    } else setFrom(chess.get(square)?.color === chess.turn() ? square : null);
  }
  return (
    <>
      <header className="site-header">
        <Brand />
        <nav>
          <Link href="/">Home</Link>
          <Link href="/docs/">Guide</Link>
        </nav>
        <Link className="button small dark" href="/console/">
          Payment planner ↗
        </Link>
      </header>
      <main className="play-page">
        <div className="play-heading">
          <span className="eyebrow">THE QUORAIL PLAY ROOM</span>
          <h1>
            A little play.
            <br />
            <em>A sharper next move.</em>
          </h1>
          <p>
            Think ahead. Find your move. Take that mindset back to your money.
          </p>
        </div>
        <div className="play-tabs" role="group" aria-label="Choose game">
          {[
            ["tic", "01 / Tic-tac-toe"],
            ["chess", "02 / Chess"],
            ["plan", "03 / Money moves"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={mode === id ? "active" : ""}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="play-layout">
          <section className="game-card">
            {mode === "tic" ? (
              <>
                <div className="game-title">
                  <h2>Three in a row.</h2>
                  <span className="small-tag">YOU × / BOT ○</span>
                </div>
                <p>Play against a perfect-move bot. A draw is a good result.</p>
                <div className="tic-board">
                  {board.map((v, i) => (
                    <button
                      key={i}
                      aria-label={`Square ${i + 1}${v ? `: ${v}` : ""}`}
                      disabled={!!v || over}
                      onClick={() => {
                        const b = [...board];
                        b[i] = "X";
                        if (!winner(b)) {
                          const j = bestMove(b);
                          if (j >= 0) b[j] = "O";
                        }
                        setBoard(b);
                      }}
                    >
                      {v === "X" ? "×" : v === "O" ? "○" : ""}
                    </button>
                  ))}
                </div>
                <p className="game-status" role="status">
                  {win
                    ? `${win === "X" ? "You win" : "Bot wins"}. Try another round.`
                    : over
                      ? "A well-played draw."
                      : "Your move. You play ×."}
                </p>
                <button
                  className="button dark"
                  onClick={() => setBoard(Array(9).fill(null))}
                >
                  New round ↗
                </button>
              </>
            ) : mode === "chess" ? (
              <>
                <div className="game-title">
                  <h2>Think a move ahead.</h2>
                  <span className="small-tag">LOCAL TWO PLAYER</span>
                </div>
                <p>
                  Pass the device between turns. Tap a piece, then a highlighted
                  square.
                </p>
                <div className="chess-board">
                  {chess
                    .board()
                    .flat()
                    .map((piece, i) => {
                      const square = ("abcdefgh"[i % 8] +
                        (8 - Math.floor(i / 8))) as Square;
                      return (
                        <button
                          key={square}
                          className={`${(Math.floor(i / 8) + i) % 2 ? "square-dark" : ""} ${from === square ? "chosen" : ""} ${legal.includes(square) ? "legal" : ""}`}
                          aria-label={`${square}${piece ? ` ${piece.color === "w" ? "White" : "Black"} ${{ k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" }[piece.type]}` : ""}${legal.includes(square) ? ", legal destination" : ""}`}
                          onClick={() => move(square)}
                        >
                          <span>
                            {piece ? glyphs[piece.color + piece.type] : ""}
                          </span>
                          <small>{square}</small>
                        </button>
                      );
                    })}
                </div>
                <p className="game-status" role="status">
                  {chess.isCheckmate()
                    ? `Checkmate. ${chess.turn() === "w" ? "Black" : "White"} wins.`
                    : chess.isDraw()
                      ? "Draw."
                      : `${chess.turn() === "w" ? "White" : "Black"} to move${chess.isCheck() ? " • Check" : ""}.`}
                </p>
                <div className="game-actions">
                  <button
                    className="button outline"
                    disabled={!chess.history().length}
                    onClick={() => {
                      const n = new Chess();
                      for (const m of chess.history().slice(0, -1)) n.move(m);
                      setChess(n);
                      setFrom(null);
                    }}
                  >
                    Undo
                  </button>
                  <button
                    className="button dark"
                    onClick={() => {
                      setChess(new Chess());
                      setFrom(null);
                    }}
                  >
                    New game
                  </button>
                  <label>
                    Promote to{" "}
                    <select
                      value={promotion}
                      onChange={(e) => setPromotion(e.target.value)}
                    >
                      <option value="q">Queen</option>
                      <option value="r">Rook</option>
                      <option value="b">Bishop</option>
                      <option value="n">Knight</option>
                    </select>
                  </label>
                </div>
                <p className="move-history">
                  {chess.history().join(" · ") ||
                    "Your moves will appear here."}
                </p>
              </>
            ) : (
              <>
                <span className="eyebrow">A REAL-WORLD THINKING EXERCISE</span>
                <h2>Can the equipment wait?</h2>
                <p>
                  Your wallet holds 1,000 NIM. Rent is 420, a collaborator is
                  owed 230, and your reserve target is 200. Assume zero fees for
                  this exercise.
                </p>
                <div className="budget-slip">
                  <span>
                    Wallet <b>1,000 NIM</b>
                  </span>
                  <span>
                    Committed <b>650 NIM</b>
                  </span>
                  <span>
                    Reserve target <b>200 NIM</b>
                  </span>
                </div>
                <h3>
                  What is the most you can spend on equipment while keeping your
                  reserve?
                </h3>
                <div className="answer-grid">
                  {[150, 250, 350].map((n) => (
                    <button
                      className="button outline"
                      key={n}
                      onClick={() => setSolved(n)}
                    >
                      {n} NIM
                    </button>
                  ))}
                </div>
                {solved !== null && (
                  <p role="status" className="game-status">
                    {solved === 150
                      ? "Exactly. 1,000 − 650 − 200 = 150 NIM. Fees would reduce this room."
                      : "Try again. Subtract commitments and your reserve from the wallet balance."}
                  </p>
                )}
                <Link className="button dark" href="/console/?demo=1">
                  Try this in the planner ↗
                </Link>
              </>
            )}
          </section>
          <aside className="play-aside">
            <div className="play-note">
              <span className="eyebrow">PLAY WITH PURPOSE</span>
              <h3>
                Good decisions
                <br />
                start with practice.
              </h3>
              <p>
                Tic-tac-toe trains anticipation. Chess rewards patience. Money
                moves connects both to your next payment.
              </p>
              <div className="reward-status">
                <b>No stakes. No NIM payouts.</b>
                <p>
                  This is free practice. Games do not generate tokens, rewards
                  or claims on your wallet.
                </p>
              </div>
              <p className="muted">
                A future sponsored competition would need a funded prize pool
                and verified results before rewards could go live.
              </p>
            </div>
            <InstallApp />
            <Link className="text-link" href="/console/">
              Back to your payment plan ↗
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
