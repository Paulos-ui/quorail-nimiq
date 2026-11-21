"use client";
import { useLanguage as useUILanguage } from "./Preferences";
import Localized from "@/components/Localized";

import { useLanguage } from "./Preferences";
import { useEffect, useState } from "react";
import { chessBotMove } from "@/lib/chess-bot";
import { Chess, type Square } from "chess.js";
import Link from "next/link";
import Brand from "./Brand";
import ConnectFour from "./ConnectFour";
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
  const { tr: ui } = useUILanguage();

  const { tr } = useLanguage();
  const [mode, setMode] = useState("tic"),
    [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [chess, setChess] = useState(() => new Chess()),
    [from, setFrom] = useState<Square | null>(null),
    [promotion, setPromotion] = useState("q");
  const [opponent, setOpponent] = useState("bot");
  const thinking =
    opponent === "bot" && chess.turn() === "b" && !chess.isGameOver();
  useEffect(() => {
    if (!thinking || mode !== "chess") return;
    const timer = setTimeout(() => {
      const m = chessBotMove(chess.history());
      if (m) {
        const next = new Chess();
        for (const move of chess.history()) next.move(move);
        next.move(m);
        setChess(next);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [chess, thinking, mode]);
  const [solved, setSolved] = useState<number | null>(null);
  const win = winner(board),
    over = !!win || board.every(Boolean);
  const legal = from
    ? chess.moves({ square: from, verbose: true }).map((m) => m.to)
    : [];
  function move(square: Square) {
    if (chess.isGameOver() || thinking) return;
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
          <Link href="/">{tr("Home")}</Link>
          <Link href="/docs/">{tr("Guide")}</Link>
        </nav>
        <Link className="button small dark" href="/console/">
          {" "}
          <Localized text={"Payment planner ↗"} />{" "}
        </Link>
      </header>
      <main className="play-page">
        <div className="play-heading">
          <span className="eyebrow">
            <Localized text={"THE QUORAIL PLAY ROOM"} />
          </span>
          <h1>
            {" "}
            <Localized text={"A little play."} /> <br />
            <em>
              <Localized text={"A sharper next move."} />
            </em>
          </h1>
          <p>
            {" "}
            <Localized
              text={
                "Think ahead. Find your move. Take that mindset back to your money."
              }
            />{" "}
          </p>
        </div>
        <div className="play-tabs" role="group" aria-label={ui("Choose game")}>
          {[
            ["tic", "01 / Tic-tac-toe"],
            ["chess", "02 / Chess"],
            ["plan", "03 / Money moves"],
            ["four", "04 / Connect Four"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={mode === id ? "active" : ""}
              onClick={() => setMode(id)}
            >
              <Localized text={label} />
            </button>
          ))}
        </div>
        <div className="play-layout">
          <section className="game-card">
            {mode === "four" ? (
              <ConnectFour />
            ) : mode === "tic" ? (
              <>
                <div className="game-title">
                  <h2>
                    <Localized text={"Three in a row."} />
                  </h2>
                  <span className="small-tag">
                    <Localized text={"YOU × / BOT ○"} />
                  </span>
                </div>
                <p>
                  <Localized
                    text={
                      "Play against a perfect-move bot. A draw is a good result."
                    }
                  />
                </p>
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
                      <Localized
                        text={v === "X" ? "×" : v === "O" ? "○" : ""}
                      />
                    </button>
                  ))}
                </div>
                <p className="game-status" role="status">
                  <Localized
                    text={
                      win
                        ? `${win === "X" ? "You win" : "Bot wins"}. Try another round.`
                        : over
                          ? "A well-played draw."
                          : "Your move. You play ×."
                    }
                  />
                </p>
                <button
                  className="button dark"
                  onClick={() => setBoard(Array(9).fill(null))}
                >
                  {" "}
                  <Localized text={"New round ↗"} />{" "}
                </button>
              </>
            ) : mode === "chess" ? (
              <>
                <div className="game-title">
                  <h2>
                    <Localized text={"Think a move ahead."} />
                  </h2>
                  <span className="small-tag">
                    <Localized
                      text={
                        opponent === "bot"
                          ? "YOU / QUORAIL BOT"
                          : "LOCAL TWO PLAYER"
                      }
                    />
                  </span>
                </div>
                <p>
                  <Localized
                    text={
                      opponent === "bot"
                        ? "You play White. The practice bot plays Black and looks two plies ahead."
                        : "Pass the device between turns."
                    }
                  />
                  <Localized text={" "} />{" "}
                  <Localized
                    text={"Tap a piece, then a highlighted square."}
                  />{" "}
                </p>
                <label className="opponent-select">
                  {" "}
                  <Localized text={"Opponent"} />{" "}
                  <select
                    value={opponent}
                    onChange={(e) => {
                      setOpponent(e.target.value);
                      setChess(new Chess());
                      setFrom(null);
                    }}
                  >
                    <option value="bot">
                      <Localized text={"Quorail bot"} />
                    </option>
                    <option value="local">
                      <Localized text={"Friend on this device"} />
                    </option>
                  </select>
                </label>
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
                            <Localized
                              text={
                                piece ? glyphs[piece.color + piece.type] : ""
                              }
                            />
                          </span>
                          <small>{square}</small>
                        </button>
                      );
                    })}
                </div>
                <p className="game-status" role="status">
                  <Localized
                    text={
                      thinking
                        ? "Quorail bot is thinking…"
                        : chess.isCheckmate()
                          ? `Checkmate. ${chess.turn() === "w" ? "Black" : "White"} wins.`
                          : chess.isDraw()
                            ? "Draw."
                            : `${chess.turn() === "w" ? "White" : "Black"} to move${chess.isCheck() ? " • Check" : ""}.`
                    }
                  />
                </p>
                <div className="game-actions">
                  <button
                    className="button outline"
                    disabled={!chess.history().length}
                    onClick={() => {
                      const n = new Chess();
                      for (const m of chess
                        .history()
                        .slice(
                          0,
                          -(opponent === "bot" && chess.turn() === "w" ? 2 : 1),
                        ))
                        n.move(m);
                      setChess(n);
                      setFrom(null);
                    }}
                  >
                    {" "}
                    <Localized text={"Undo"} />{" "}
                  </button>
                  <button
                    className="button dark"
                    onClick={() => {
                      setChess(new Chess());
                      setFrom(null);
                    }}
                  >
                    {" "}
                    <Localized text={"New game"} />{" "}
                  </button>
                  <label>
                    {" "}
                    <Localized text={"Promote to"} />
                    <Localized text={" "} />
                    <select
                      value={promotion}
                      onChange={(e) => setPromotion(e.target.value)}
                    >
                      <option value="q">
                        <Localized text={"Queen"} />
                      </option>
                      <option value="r">
                        <Localized text={"Rook"} />
                      </option>
                      <option value="b">
                        <Localized text={"Bishop"} />
                      </option>
                      <option value="n">
                        <Localized text={"Knight"} />
                      </option>
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
                <span className="eyebrow">
                  <Localized text={"A REAL-WORLD THINKING EXERCISE"} />
                </span>
                <h2>
                  <Localized text={"Can the equipment wait?"} />
                </h2>
                <p>
                  {" "}
                  <Localized
                    text={
                      "Your wallet holds 1,000 NIM. Rent is 420, a collaborator is owed 230, and your reserve target is 200. Assume zero fees for this exercise."
                    }
                  />{" "}
                </p>
                <div className="budget-slip">
                  <span>
                    {" "}
                    <Localized text={"Wallet"} />{" "}
                    <b>
                      <Localized text={"1,000 NIM"} />
                    </b>
                  </span>
                  <span>
                    {" "}
                    <Localized text={"Committed"} />{" "}
                    <b>
                      <Localized text={"650 NIM"} />
                    </b>
                  </span>
                  <span>
                    {" "}
                    <Localized text={"Reserve target"} />{" "}
                    <b>
                      <Localized text={"200 NIM"} />
                    </b>
                  </span>
                </div>
                <h3>
                  {" "}
                  <Localized
                    text={
                      "What is the most you can spend on equipment while keeping your reserve?"
                    }
                  />{" "}
                </h3>
                <div className="answer-grid">
                  {[150, 250, 350].map((n) => (
                    <button
                      className="button outline"
                      key={n}
                      onClick={() => setSolved(n)}
                    >
                      {n} <Localized text={"NIM"} />{" "}
                    </button>
                  ))}
                </div>
                {solved !== null && (
                  <p role="status" className="game-status">
                    <Localized
                      text={
                        solved === 150
                          ? "Exactly. 1,000 − 650 − 200 = 150 NIM. Fees would reduce this room."
                          : "Try again. Subtract commitments and your reserve from the wallet balance."
                      }
                    />
                  </p>
                )}
                <Link className="button dark" href="/console/?demo=1">
                  {" "}
                  <Localized text={"Try this in the planner ↗"} />{" "}
                </Link>
              </>
            )}
          </section>
          <aside className="play-aside">
            <div className="play-note">
              <span className="eyebrow">
                <Localized text={"PLAY WITH PURPOSE"} />
              </span>
              <h3>
                {" "}
                <Localized text={"Good decisions"} /> <br />{" "}
                <Localized text={"start with practice."} />{" "}
              </h3>
              <p>
                {" "}
                <Localized
                  text={
                    "Tic-tac-toe trains anticipation. Chess rewards patience. Money moves connects both to your next payment."
                  }
                />{" "}
              </p>
              <div className="reward-status">
                <b>
                  <Localized text={"No stakes. No NIM payouts."} />
                </b>
                <p>
                  {" "}
                  <Localized
                    text={
                      "This is free practice. Games do not generate tokens, rewards or claims on your wallet."
                    }
                  />{" "}
                </p>
              </div>
              <p className="muted">
                {" "}
                <Localized
                  text={
                    "A future sponsored competition would need a funded prize pool and verified results before rewards could go live."
                  }
                />{" "}
              </p>
            </div>
            <InstallApp />
            <Link className="text-link" href="/console/">
              {" "}
              <Localized text={"Back to your payment plan ↗"} />{" "}
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
