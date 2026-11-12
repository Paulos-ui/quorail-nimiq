"use client";
import Localized from "@/components/Localized";

import { useLanguage } from "./Preferences";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Layers3,
  MoveUpRight,
} from "lucide-react";
import Brand from "./Brand";
import FloatingAssistant from "./FloatingAssistant";
import InstallApp from "./InstallApp";
export default function Landing() {
  const { tr } = useLanguage();
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className="welcome-strip">
        {" "}
        <Localized text={"A little clarity before your next payment."} />
        <Localized text={" "} />
        <Link href="/console/?demo=1">
          <Localized text={"Try the 60-second example ↗"} />
        </Link>
      </div>
      <header className="site-header">
        <Brand />
        <nav>
          <a href="#how">{tr("The approach")}</a>
          <Link href="/play/">{tr("Play room")}</Link>
          <Link href="/docs/">{tr("Field guide")}</Link>
        </nav>
        <Link href="/console/" className="button small dark">
          {tr("Open Quorail")} <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-square" />{" "}
              <Localized text={"A MORE CONSIDERED WAY TO PAY"} />{" "}
            </div>
            <h1>
              {" "}
              <Localized text={"Make your"} /> <br />{" "}
              <Localized text={"next move"} /> <br />
              <em>
                <Localized text={"make sense."} />
              </em>
            </h1>
            <p>
              {" "}
              <Localized
                text={"Rent. Your team. The things you are building."}
              />{" "}
              <br />{" "}
              <Localized
                text={"See what a payment changes before you send it."}
              />{" "}
            </p>
            <div className="hero-actions">
              <Link className="button dark" href="/console/">
                {" "}
                <Localized text={"Plan your next payment"} />{" "}
                <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" href="/console/?demo=1">
                {" "}
                <Localized text={"Explore an example"} />{" "}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} />{" "}
              <Localized text={"Your wallet. Your approval. Always."} />{" "}
            </div>
          </div>
          <div className="hero-instrument">
            <div className="instrument-top">
              <span>
                <Localized text={"THE PAYMENT PERSPECTIVE"} />
              </span>
              <span className="small-tag">
                <Localized text={"ILLUSTRATIVE PLAN"} />
              </span>
            </div>
            <div className="orbit-stage">
              <svg className="orbit" viewBox="0 0 540 440" aria-hidden="true">
                <ellipse cx="270" cy="220" rx="224" ry="152" />
                <ellipse
                  cx="270"
                  cy="220"
                  rx="224"
                  ry="152"
                  transform="rotate(-32 270 220)"
                />
                <ellipse
                  cx="270"
                  cy="220"
                  rx="224"
                  ry="152"
                  transform="rotate(32 270 220)"
                />
                <path
                  className="gold-path"
                  d="M55 252C125 390 399 379 484 196"
                />
                <circle cx="484" cy="196" r="5" className="orbit-dot" />
              </svg>
              <div className="balance-center">
                <span>
                  <Localized text={"WALLET BALANCE"} />
                </span>
                <strong>
                  <Localized text={selected ? "750" : "1,000"} />
                  <small>
                    <Localized text={"NIM"} />
                  </small>
                </strong>
                <span>
                  <Localized
                    text={
                      selected
                        ? "AFTER EQUIPMENT PAYMENT"
                        : "BEFORE YOUR NEXT MOVE"
                    }
                  />
                </span>
              </div>
              <div className="float-label rent">
                <i /> <Localized text={"Studio rent"} />{" "}
                <b>
                  <Localized text={"420 NIM"} />
                </b>
              </div>
              <div className="float-label reserve">
                <i /> <Localized text={"Reserve target"} />{" "}
                <b>
                  <Localized text={"200 NIM"} />
                </b>
              </div>
              <div className="float-label collaborator">
                <i /> <Localized text={"Collaborator"} />{" "}
                <b>
                  <Localized text={"230 NIM"} />
                </b>
              </div>
            </div>
            <button
              className={"scenario-switch " + (selected ? "selected" : "")}
              onClick={() => setSelected(!selected)}
            >
              <span className="scenario-icon">
                <MoveUpRight size={23} />
              </span>
              <span>
                <b>
                  <Localized
                    text={
                      selected
                        ? "Equipment payment preview"
                        : "What if I pay for equipment?"
                    }
                  />
                </b>
                <small>
                  <Localized
                    text={
                      selected
                        ? "100 NIM below your reserve target"
                        : "Preview a 250 NIM payment"
                    }
                  />
                </small>
              </span>
              <span className="switch-track">
                <i />
              </span>
            </button>
            <div className="instrument-bottom">
              <span className={selected ? "danger-text" : ""}>
                <Localized
                  text={
                    selected
                      ? "A little context changes the decision."
                      : "Every commitment has its place."
                  }
                />
              </span>
              <span>01 / 03</span>
            </div>
          </div>
        </section>
        <div className="editorial-divider">
          <span>
            <Localized text={"BUILT FOR INDEPENDENT PEOPLE & SMALL TEAMS"} />
          </span>
          <a href="#how">
            {" "}
            <Localized text={"A balance is only the beginning"} />{" "}
            <ChevronDown size={14} />
          </a>
        </div>
        <section className="statement reveal" id="how">
          <span className="eyebrow">
            <Localized text={"01 / THE THINKING"} />
          </span>
          <h2>
            {" "}
            <Localized text={"Enough to send."} /> <br />
            <em>
              <Localized text={"But enough for what comes next?"} />
            </em>
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "A wallet shows what you have. Quorail adds what you have promised. Your rent, your collaborators, your next deadline. Together, they tell a more useful story."
              }
            />{" "}
          </p>
        </section>
        <section className="method-grid">
          <article className="reveal">
            <span className="step-number">01</span>
            <Layers3 />
            <h3>
              <Localized text={"Give your money context."} />
            </h3>
            <p>
              {" "}
              <Localized
                text={
                  "Record the payments ahead. Set a reserve target and choose how far to look."
                }
              />{" "}
            </p>
            <span className="step-footer">
              <Localized text={"A PLAN THAT STARTS WITH YOU"} />
            </span>
          </article>
          <article className="reveal">
            <span className="step-number">02</span>
            <MoveUpRight />
            <h3>
              <Localized text={"See the after, before."} />
            </h3>
            <p>
              {" "}
              <Localized
                text={
                  "Preview the balance, commitments and remaining buffer before approving a payment."
                }
              />{" "}
            </p>
            <span className="step-footer">
              <Localized text={"EVERY DECISION IN PERSPECTIVE"} />
            </span>
          </article>
          <article className="reveal">
            <span className="step-number">03</span>
            <ShieldCheck />
            <h3>
              <Localized text={"Pay with your own say."} />
            </h3>
            <p>
              {" "}
              <Localized
                text={
                  "Approve in Nimiq Pay. Follow the transaction and keep the receipt alongside your plan."
                }
              />{" "}
            </p>
            <span className="step-footer">
              <Localized text={"NIM PAYMENTS. NATIVE APPROVAL."} />
            </span>
          </article>
        </section>
        <section className="play-promo reveal">
          <div>
            <span className="eyebrow">
              <Localized text={"A CLEARER HEAD. A BETTER NEXT MOVE."} />
            </span>
            <h2>
              {" "}
              <Localized text={"Pause. Play."} /> <br />
              <em>
                <Localized text={"Think ahead."} />
              </em>
            </h2>
            <p>
              {" "}
              <Localized
                text={
                  "A pocket-sized play room for the space between decisions. Challenge the bot, share a chessboard, or put your payment instincts to work."
                }
              />{" "}
            </p>
            <Link href="/play/" className="button dark">
              {" "}
              <Localized text={"Step into the Play room ↗"} />{" "}
            </Link>
            <small>
              <Localized text={"Free practice. No stakes or NIM rewards."} />
            </small>
          </div>
          <div className="promo-board" aria-hidden="true">
            <span>×</span>
            <span>○</span>
            <span>×</span>
            <span>○</span>
            <span>✳</span>
            <span>○</span>
            <span>×</span>
            <span>○</span>
            <span>×</span>
          </div>
        </section>
        <section className="install-section reveal">
          <span className="eyebrow">
            <Localized text={"YOUR EVERYDAY COMPANION"} />
          </span>
          <h2>
            <Localized text={"A place on your home screen."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Open your planner and games from your phone or desktop. Approve payments securely inside Nimiq Pay."
              }
            />{" "}
          </p>
          <InstallApp />
        </section>
        <section className="closing reveal">
          <div>
            <span className="eyebrow">
              <Localized text={"A LITTLE CLARITY GOES A LONG WAY"} />
            </span>
            <h2>
              {" "}
              <Localized text={"Make room"} /> <br /> <Localized text={"for"} />{" "}
              <em>
                <Localized text={"what matters."} />
              </em>
            </h2>
          </div>
          <div>
            <p>
              {" "}
              <Localized text={"Built around real commitments."} /> <br />{" "}
              <Localized text={"Designed for a moment of clarity."} />{" "}
            </p>
            <Link className="button gold" href="/console/">
              {" "}
              <Localized text={"Find your perspective"} />{" "}
              <ArrowUpRight size={18} />
            </Link>
            <small>
              {" "}
              <Localized
                text={
                  "Plans stay on this device. Reserve targets do not lock funds."
                }
              />{" "}
            </small>
          </div>
        </section>
        <section className="judge-path">
          <span className="eyebrow">
            <Localized text={"FROM BALANCE TO A DECISION"} />
          </span>
          <h2>
            {" "}
            <Localized text={"Your wallet shows what you have."} /> <br />
            <em>
              <Localized text={"Quorail shows what is already spoken for."} />
            </em>
          </h2>
          <div className="wallet-comparison">
            <article>
              <span>
                <Localized text={"Wallet balance"} />
              </span>
              <strong>
                <Localized text={"1,000 NIM"} />
              </strong>
              <p>
                <Localized text={"The starting number."} />
              </p>
            </article>
            <article>
              <span>
                <Localized text={"Illustrative Quorail plan"} />
              </span>
              <strong>
                <Localized text={"100 NIM buffer"} />
              </strong>
              <p>
                <Localized
                  text={
                    "1,000 balance minus 700 commitments and a 200 reserve."
                  }
                />
              </p>
            </article>
          </div>
          <p>
            {" "}
            <Localized
              text={
                "Explore a realistic plan first, then connect inside Nimiq Pay for a real payment."
              }
            />{" "}
          </p>
          <div className="scenario-links">
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=freelancer"
            >
              {" "}
              <Localized text={"Freelancer studio ↗"} />{" "}
            </Link>
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=team"
            >
              {" "}
              <Localized text={"Small team ↗"} />{" "}
            </Link>
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=personal"
            >
              {" "}
              <Localized text={"Rent + buffer ↗"} />{" "}
            </Link>
          </div>
          <ol className="payment-walkthrough">
            <li>
              <b>
                <Localized text={"01 / Plan"} />
              </b>{" "}
              <Localized text={"Add an amount, recipient and due date."} />{" "}
            </li>
            <li>
              <b>
                <Localized text={"02 / Decide"} />
              </b>{" "}
              <Localized
                text={"Check commitments and the remaining buffer."}
              />{" "}
            </li>
            <li>
              <b>
                <Localized text={"03 / Approve"} />
              </b>{" "}
              <Localized
                text={"Review and approve in your own Nimiq Pay wallet."}
              />{" "}
            </li>
            <li>
              <b>
                <Localized text={"04 / Record"} />
              </b>{" "}
              <Localized
                text={"Keep the hash and verify its matching receipt."}
              />{" "}
            </li>
          </ol>
          <p className="helper">
            {" "}
            <Localized
              text={
                "Example amounts only. Wallet approval and network confirmation times vary."
              }
            />{" "}
          </p>
        </section>
      </main>
      <FloatingAssistant />
      <footer>
        <Brand />
        <span>
          <Localized text={"A payment is part of a bigger picture."} />
        </span>
        <Link href="/docs/">
          {" "}
          <Localized text={"About & privacy"} /> <ArrowUpRight size={14} />
        </Link>
      </footer>
    </>
  );
}
