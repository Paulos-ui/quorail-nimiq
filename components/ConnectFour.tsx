"use client";
import Localized from "@/components/Localized";

import { useEffect, useState } from "react";
import { drop, fourBot, fourWinner, newGrid } from "@/lib/connect-four";
export default function ConnectFour() {
  const [grid, setGrid] = useState(newGrid),
    [thinking, setThinking] = useState(false);
  const winner = fourWinner(grid),
    drawn = grid[0].every(Boolean);
  useEffect(() => {
    if (!thinking) return;
    const timer = setTimeout(() => {
      setGrid((current) => {
        const column = fourBot(current);
        return column < 0 ? current : drop(current, column, 2)!;
      });
      setThinking(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [thinking]);
  return (
    <>
      <div className="game-title">
        <h2>
          <Localized text={"Connect your next four."} />
        </h2>
        <span className="small-tag">
          <Localized text={"YOU / QUORAIL BOT"} />
        </span>
      </div>
      <p>
        {" "}
        <Localized
          text={
            "You play purple. Drop a disc into a column. Connect four horizontally, vertically or diagonally. The practice bot can win and block immediate threats."
          }
        />{" "}
      </p>
      <div className="four-controls">
        {grid[0].map((_, c) => (
          <button
            key={c}
            className="button outline"
            aria-label={`Drop purple disc into column ${c + 1}`}
            disabled={thinking || !!winner || drawn || !!grid[0][c]}
            onClick={() => {
              const next = drop(grid, c, 1);
              if (next) {
                setGrid(next);
                if (!fourWinner(next) && !next[0].every(Boolean))
                  setThinking(true);
              }
            }}
          >
            {c + 1} ↓
          </button>
        ))}
      </div>
      <div
        className="four-board"
        role="img"
        aria-label={grid
          .map(
            (row, r) =>
              `Row ${r + 1}: ${row.map((d) => (d === 1 ? "purple" : d === 2 ? "gold" : "empty")).join(", ")}`,
          )
          .join(". ")}
      >
        {grid.flat().map((disc, i) => (
          <span key={i} className={`disc disc-${disc}`}>
            <Localized text={disc === 1 ? "●" : disc === 2 ? "×" : ""} />
          </span>
        ))}
      </div>
      <p role="status" className="game-status">
        <Localized
          text={
            winner === 1
              ? "You connected four. Well played!"
              : winner === 2
                ? "The bot connected four. Try a new approach."
                : drawn
                  ? "A full board. It is a draw."
                  : thinking
                    ? "Quorail bot is thinking…"
                    : "Your move. Choose a column."
          }
        />
      </p>
      <button
        className="button dark"
        onClick={() => {
          setThinking(false);
          setGrid(newGrid());
        }}
      >
        {" "}
        <Localized text={"New round"} />{" "}
      </button>
    </>
  );
}
