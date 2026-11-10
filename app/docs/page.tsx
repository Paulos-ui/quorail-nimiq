import Link from "next/link";
import Brand from "@/components/Brand";
import { ArrowUpRight } from "lucide-react";
export default function Docs() {
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/console/" className="button dark small">
          Open Quorail <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="docs">
        <span className="eyebrow">THE QUORAIL FIELD GUIDE</span>
        <h1>
          A payment has
          <br />
          <em>a bigger picture.</em>
        </h1>
        <p>
          Quorail helps independent workers and small teams plan NIM payments
          around the commitments they have already made.
        </p>
        <section>
          <h2>01. Start with what matters.</h2>
          <ol>
            <li>
              Open Quorail inside an up-to-date Nimiq Pay wallet and connect.
            </li>
            <li>
              Choose the address whose balance you want to plan around. This
              does not choose the wallet's transaction signer.
            </li>
            <li>
              Add upcoming payments with a Nimiq recipient, an amount, a fee and
              a due date.
            </li>
            <li>Set your reserve target and a planning window in Settings.</li>
            <li>
              Review a payment's impact. When recorded commitments remain
              covered, approve the transaction in Nimiq Pay.
            </li>
            <li>
              Check the receipt in Activity. Quorail matches the sender,
              recipient, network and amount before marking the payment
              confirmed.
            </li>
          </ol>
        </section>
        <section>
          <h2>02. Understand the calculation.</h2>
          <p>
            Room to move is your account balance minus recorded commitments
            within the planning window and your reserve target. The payment
            preview subtracts the selected payment and its fee, plus the other
            commitments. It never subtracts the same planned payment twice.
          </p>
          <p>
            Overdue commitments remain included. Confirmed payments leave the
            outstanding plan. Pending and uncertain payments remain reserved
            until their receipts are checked, which can temporarily make the
            forecast conservative. Unrecorded spending, future income and
            exchange-rate changes are not predicted.
          </p>
          <p>
            All calculations use integer Luna. One NIM equals 100,000 Luna.
            Quorail supports amounts with up to five decimal places. There is no
            dollar valuation or promise of yield.
          </p>
        </section>
        <section>
          <h2>03. Your wallet is in control.</h2>
          <p>
            Quorail has no private keys, custody account, background signer or
            autonomous payment agent. The native wallet asks you to approve each
            payment. Always verify the sender, recipient, amount, fee and
            network there.
          </p>
          <p>
            Your reserve is a planning target, not a vault. Quorail blocks its
            own payment flow if a payment would cross that target. It cannot
            prevent direct wallet spending or enforce restrictions outside this
            app. Only ordinary spendable NIM accounts are supported. Contract
            balances may not be spendable.
          </p>
        </section>
        <section>
          <h2>04. Follow the receipt.</h2>
          <p>
            A transaction hash means the wallet returned a submission
            identifier. It does not prove successful execution. Activity uses
            the network-specific RPC service to verify inclusion and execution,
            and it distinguishes pending, confirmed, failed and mismatched
            receipts.
          </p>
          <p>
            Confirmed means successful inclusion reported by the configured RPC,
            not an independent cryptographic finality proof. Use the explorer
            for independent inspection. If a request fails after it may have
            been submitted, Quorail keeps it uncertain and pauses new sends.
            Recover its transaction hash from Nimiq Pay history and check it in
            the payment details. Never blindly retry.
          </p>
          <p>
            If no transaction hash can be found, keep the record and investigate
            the wallet history before taking further action. The app
            deliberately provides no automatic reset for ambiguous payments.
          </p>
        </section>
        <section id="privacy">
          <h2>05. Privacy, without surprises.</h2>
          <p>
            Your plan and payment records are stored unencrypted in this
            browser's local storage, separated by address and network. They do
            not sync across devices. Anyone with access to this browser profile
            may be able to inspect them. Address sharing is not authentication
            and is not presented as proof of ownership.
          </p>
          <p>
            Export a JSON backup in Settings or Activity. Import merges new
            records for the same address and network, preserves existing
            entries, and requires re-verification of imported payment attempts.
            Clearing browser data can remove your plan and payment-attempt
            history.
          </p>
          <p>
            Receipt checks send a transaction hash and your IP address to a
            public Nimiq RPC operator. Google Fonts receives a font request and
            your IP address. Hosting providers may keep ordinary access logs.
            Quorail adds no analytics, advertising trackers or AI service.
            Payment details are public on the blockchain; private labels are not
            sent as transaction messages.
          </p>
        </section>
        <section>
          <h2>06. An example is an example.</h2>
          <p>
            The example workspace lets you explore payment planning without a
            wallet. Its balance and commitments are illustrative. It cannot send
            payments or create transaction receipts. Connect your wallet to
            start a separate real plan.
          </p>
        </section>
        <section>
          <h2>07. Built by Jayking.</h2>
          <p>
            Quorail-Nimiq adapts the original Quorail consequence-planning
            concept into a Nimiq Pay Mini App. The implementation replaces the
            earlier chain-specific execution model with user-approved NIM
            payments.
          </p>
          <p>
            <a
              href="https://github.com/paulos-ui"
              target="_blank"
              rel="noreferrer"
            >
              GitHub: paulos-ui
            </a>{" "}
            ·{" "}
            <a
              href="https://x.com/__official__1"
              target="_blank"
              rel="noreferrer"
            >
              X: @__official__1
            </a>
          </p>
          <p>
            Open source under the MIT License. Independently built, with no
            claim of official Nimiq endorsement.
          </p>
        </section>
      </main>
    </>
  );
}
