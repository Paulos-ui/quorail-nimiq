import Localized from "@/components/Localized";
import Link from "next/link";
import Brand from "@/components/Brand";
import { ArrowUpRight } from "lucide-react";
export default function Docs() {
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/console/" className="button dark small">
          {" "}
          <Localized text={"Open Quorail"} /> <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="docs">
        <span className="eyebrow">
          <Localized text={"THE QUORAIL FIELD GUIDE"} />
        </span>
        <h1>
          {" "}
          <Localized text={"A payment has"} /> <br />
          <em>
            <Localized text={"a bigger picture."} />
          </em>
        </h1>
        <p>
          {" "}
          <Localized
            text={
              "Quorail helps independent workers and small teams plan NIM payments around the commitments they have already made."
            }
          />{" "}
        </p>
        <section>
          <h2>
            <Localized text={"01. Start with what matters."} />
          </h2>
          <ol>
            <li>
              {" "}
              <Localized
                text={
                  "Open Quorail inside an up-to-date Nimiq Pay wallet and connect."
                }
              />{" "}
            </li>
            <li>
              {" "}
              <Localized
                text={
                  "Choose the address whose balance you want to plan around. This does not choose the wallet's transaction signer."
                }
              />{" "}
            </li>
            <li>
              {" "}
              <Localized
                text={
                  "Add upcoming payments with a Nimiq recipient, an amount, a fee and a due date."
                }
              />{" "}
            </li>
            <li>
              <Localized
                text={
                  "Set your reserve target and a planning window in Settings."
                }
              />
            </li>
            <li>
              {" "}
              <Localized
                text={
                  "Review a payment's impact. When recorded commitments remain covered, approve the transaction in Nimiq Pay."
                }
              />{" "}
            </li>
            <li>
              {" "}
              <Localized
                text={
                  "Check the receipt in Activity. Quorail matches the sender, recipient, network and amount before marking the payment confirmed."
                }
              />{" "}
            </li>
          </ol>
        </section>
        <section>
          <h2>
            <Localized text={"02. Understand the calculation."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Room to move is your account balance minus recorded commitments within the planning window and your reserve target. The payment preview subtracts the selected payment and its fee, plus the other commitments. It never subtracts the same planned payment twice."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Overdue commitments remain included. Confirmed payments leave the outstanding plan. Pending and uncertain payments remain reserved until their receipts are checked, which can temporarily make the forecast conservative. Unrecorded spending, future income and exchange-rate changes are not predicted."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "All calculations use integer Luna. One NIM equals 100,000 Luna. Quorail supports amounts with up to five decimal places. There is no dollar valuation or promise of yield."
              }
            />{" "}
          </p>
        </section>
        <section>
          <h2>
            <Localized text={"03. Your wallet is in control."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Quorail has no private keys, custody account, background signer or autonomous payment agent. The native wallet asks you to approve each payment. Always verify the sender, recipient, amount, fee and network there."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Your reserve is a planning target, not a vault. Quorail blocks its own payment flow if a payment would cross that target. It cannot prevent direct wallet spending or enforce restrictions outside this app. Only ordinary spendable NIM accounts are supported. Contract balances may not be spendable."
              }
            />{" "}
          </p>
        </section>
        <section>
          <h2>
            <Localized text={"04. Follow the receipt."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "A transaction hash means the wallet returned a submission identifier. It does not prove successful execution. Activity uses the network-specific RPC service to verify inclusion and execution, and it distinguishes pending, confirmed, failed and mismatched receipts."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Confirmed means successful inclusion reported by the configured RPC, not an independent cryptographic finality proof. Use the explorer for independent inspection. If a request fails after it may have been submitted, Quorail keeps it uncertain and pauses new sends. Recover its transaction hash from Nimiq Pay history and check it in the payment details. Never blindly retry."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "If no transaction hash can be found, keep the record and investigate the wallet history before taking further action. The app deliberately provides no automatic reset for ambiguous payments."
              }
            />{" "}
          </p>
        </section>
        <section id="privacy">
          <h2>
            <Localized text={"05. Privacy, without surprises."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Your plan and payment records are stored unencrypted in this browser's local storage, separated by address and network. They do not sync across devices. Anyone with access to this browser profile may be able to inspect them. Address sharing is not authentication and is not presented as proof of ownership."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Export a JSON backup in Settings or Activity. Import merges new records for the same address and network, preserves existing entries, and requires re-verification of imported payment attempts. Clearing browser data can remove your plan and payment-attempt history."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Receipt checks send a transaction hash and your IP address to a public Nimiq RPC operator. Google Fonts receives a font request and your IP address. Hosting providers may keep ordinary access logs. Quorail adds no advertising trackers. Optional Quorail AI sends your question to Anthropic through our server only after consent. You may additionally share a previewed summary of balance, reserve and forecast totals. Titles, addresses and receipts are excluded from that automatic summary. Avoid entering secrets in your question. Payment details are public on the blockchain."
              }
            />{" "}
          </p>
        </section>
        <section>
          <h2>
            <Localized text={"06. Recurring plans, shared boards and AI."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Weekly and monthly commitments appear in the 30, 60 and 90 day projections. Confirmation creates the next occurrence. Each payment still needs wallet approval. There is no automatic debit."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Shared boards are optional snapshots stored on the deployment's Redis service for 30 days. Anyone with an invite can read titles, addresses, amounts, due dates and responsibility labels. Share links only with trusted people. Labels are not verified identities. Private plan edits do not sync into a board. Keep payment execution in one place to avoid duplicate payments."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Collection boards divide a contribution request into exact shares. Each share has a public transaction reference. Confirmed shares update the board total. Collecting a contribution does not pay the original outgoing commitment. A matching reference, amount, recipient and network are required to verify a receipt. No funds are held by Quorail."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "AI explains your plan and cannot execute transactions. Responses may be inaccurate; use the deterministic preview for the calculation. The service uses request limits and temporarily stores salted client hashes for rate limiting. Shared board records expire; keep a local JSON backup. A blockchain reference alone cannot restore a plan."
              }
            />{" "}
          </p>
        </section>
        <section>
          <h2>
            <Localized text={"07. An example is an example."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "The example workspace lets you explore payment planning without a wallet. Its balance and commitments are illustrative. It cannot send payments or create transaction receipts. Connect your wallet to start a separate real plan."
              }
            />{" "}
          </p>
        </section>
        <section>
          <h2>
            <Localized text={"08. Built by Jayking."} />
          </h2>
          <p>
            {" "}
            <Localized
              text={
                "Quorail-Nimiq adapts the original Quorail consequence-planning concept into a Nimiq Pay Mini App. The implementation replaces the earlier chain-specific execution model with user-approved NIM payments."
              }
            />{" "}
          </p>
          <p>
            <a
              href="https://github.com/paulos-ui"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              <Localized text={"GitHub: paulos-ui"} />{" "}
            </a>
            <Localized text={" "} />
            ·<Localized text={" "} />
            <a
              href="https://x.com/__official__1"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              <Localized text={"X: @__official__1"} />{" "}
            </a>
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Open source under the MIT License. Independently built, with no claim of official Nimiq endorsement."
              }
            />{" "}
          </p>
        </section>
      </main>
    </>
  );
}
