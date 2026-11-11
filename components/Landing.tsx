"use client";
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
        A little clarity before your next payment.{" "}
        <Link href="/console/?demo=1">Try the 60-second example ↗</Link>
      </div>
      <header className="site-header">
        <Brand />
        <nav>
          <a href="#how">The approach</a>
          <Link href="/play/">Play room</Link>
          <Link href="/docs/">Field guide</Link>
        </nav>
        <Link href="/console/" className="button small dark">
          Open Quorail <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-square" /> A MORE CONSIDERED WAY TO PAY
            </div>
            <h1>
              Make your
              <br />
              next move
              <br />
              <em>make sense.</em>
            </h1>
            <p>
              Rent. Your team. The things you are building.
              <br />
              See what a payment changes before you send it.
            </p>
            <div className="hero-actions">
              <Link className="button dark" href="/console/">
                Plan your next payment <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" href="/console/?demo=1">
                Explore an example <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} /> Your wallet. Your approval. Always.
            </div>
          </div>
          <div className="hero-instrument">
            <div className="instrument-top">
              <span>THE PAYMENT PERSPECTIVE</span>
              <span className="small-tag">ILLUSTRATIVE PLAN</span>
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
                <span>WALLET BALANCE</span>
                <strong>
                  {selected ? "750" : "1,000"}
                  <small>NIM</small>
                </strong>
                <span>
                  {selected
                    ? "AFTER EQUIPMENT PAYMENT"
                    : "BEFORE YOUR NEXT MOVE"}
                </span>
              </div>
              <div className="float-label rent">
                <i />
                Studio rent <b>420 NIM</b>
              </div>
              <div className="float-label reserve">
                <i />
                Reserve target <b>200 NIM</b>
              </div>
              <div className="float-label collaborator">
                <i />
                Collaborator <b>230 NIM</b>
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
                  {selected
                    ? "Equipment payment preview"
                    : "What if I pay for equipment?"}
                </b>
                <small>
                  {selected
                    ? "100 NIM below your reserve target"
                    : "Preview a 250 NIM payment"}
                </small>
              </span>
              <span className="switch-track">
                <i />
              </span>
            </button>
            <div className="instrument-bottom">
              <span className={selected ? "danger-text" : ""}>
                {selected
                  ? "A little context changes the decision."
                  : "Every commitment has its place."}
              </span>
              <span>01 / 03</span>
            </div>
          </div>
        </section>
        <div className="editorial-divider">
          <span>BUILT FOR INDEPENDENT PEOPLE & SMALL TEAMS</span>
          <a href="#how">
            A balance is only the beginning <ChevronDown size={14} />
          </a>
        </div>
        <section className="statement reveal" id="how">
          <span className="eyebrow">01 / THE THINKING</span>
          <h2>
            Enough to send.
            <br />
            <em>But enough for what comes next?</em>
          </h2>
          <p>
            A wallet shows what you have. Quorail adds what you have promised.
            Your rent, your collaborators, your next deadline. Together, they
            tell a more useful story.
          </p>
        </section>
        <section className="method-grid">
          <article className="reveal">
            <span className="step-number">01</span>
            <Layers3 />
            <h3>Give your money context.</h3>
            <p>
              Record the payments ahead. Set a reserve target and choose how far
              to look.
            </p>
            <span className="step-footer">A PLAN THAT STARTS WITH YOU</span>
          </article>
          <article className="reveal">
            <span className="step-number">02</span>
            <MoveUpRight />
            <h3>See the after, before.</h3>
            <p>
              Preview the balance, commitments and remaining buffer before
              approving a payment.
            </p>
            <span className="step-footer">EVERY DECISION IN PERSPECTIVE</span>
          </article>
          <article className="reveal">
            <span className="step-number">03</span>
            <ShieldCheck />
            <h3>Pay with your own say.</h3>
            <p>
              Approve in Nimiq Pay. Follow the transaction and keep the receipt
              alongside your plan.
            </p>
            <span className="step-footer">NIM PAYMENTS. NATIVE APPROVAL.</span>
          </article>
        </section>
        <section className="play-promo reveal">
          <div>
            <span className="eyebrow">A CLEARER HEAD. A BETTER NEXT MOVE.</span>
            <h2>
              Pause. Play.
              <br />
              <em>Think ahead.</em>
            </h2>
            <p>
              A pocket-sized play room for the space between decisions.
              Challenge the bot, share a chessboard, or put your payment
              instincts to work.
            </p>
            <Link href="/play/" className="button dark">
              Step into the Play room ↗
            </Link>
            <small>Free practice. No stakes or NIM rewards.</small>
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
          <span className="eyebrow">YOUR EVERYDAY COMPANION</span>
          <h2>A place on your home screen.</h2>
          <p>
            Open your planner and games from your phone or desktop. Approve
            payments securely inside Nimiq Pay.
          </p>
          <InstallApp />
        </section>
        <section className="closing reveal">
          <div>
            <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
            <h2>
              Make room
              <br />
              for <em>what matters.</em>
            </h2>
          </div>
          <div>
            <p>
              Built around real commitments.
              <br />
              Designed for a moment of clarity.
            </p>
            <Link className="button gold" href="/console/">
              Find your perspective <ArrowUpRight size={18} />
            </Link>
            <small>
              Plans stay on this device. Reserve targets do not lock funds.
            </small>
          </div>
        </section>
        <section className="judge-path">
          <span className="eyebrow">FROM BALANCE TO A DECISION</span>
          <h2>
            Your wallet shows what you have.
            <br />
            <em>Quorail shows what is already spoken for.</em>
          </h2>
          <div className="wallet-comparison">
            <article>
              <span>Wallet balance</span>
              <strong>1,000 NIM</strong>
              <p>The starting number.</p>
            </article>
            <article>
              <span>Illustrative Quorail plan</span>
              <strong>100 NIM buffer</strong>
              <p>1,000 balance minus 700 commitments and a 200 reserve.</p>
            </article>
          </div>
          <p>
            Explore a realistic plan first, then connect inside Nimiq Pay for a
            real payment.
          </p>
          <div className="scenario-links">
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=freelancer"
            >
              Freelancer studio ↗
            </Link>
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=team"
            >
              Small team ↗
            </Link>
            <Link
              className="button outline"
              href="/console/?demo=1&scenario=personal"
            >
              Rent + buffer ↗
            </Link>
          </div>
          <ol className="payment-walkthrough">
            <li>
              <b>01 / Plan</b> Add an amount, recipient and due date.
            </li>
            <li>
              <b>02 / Decide</b> Check commitments and the remaining buffer.
            </li>
            <li>
              <b>03 / Approve</b> Review and approve in your own Nimiq Pay
              wallet.
            </li>
            <li>
              <b>04 / Record</b> Keep the hash and verify its matching receipt.
            </li>
          </ol>
          <p className="helper">
            Example amounts only. Wallet approval and network confirmation times
            vary.
          </p>
        </section>
      </main>
      <FloatingAssistant />
      <footer>
        <Brand />
        <span>A payment is part of a bigger picture.</span>
        <Link href="/docs/">
          About & privacy <ArrowUpRight size={14} />
        </Link>
      </footer>
    </>
  );
}
