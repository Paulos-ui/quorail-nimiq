import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRecipientQR } from "../lib/recipient-qr";

const nim = "NQ0700000000000000000000000000000000";
const evm = "0x2222222222222222222222222222222222222222";

test("imports checksummed Nimiq addresses, supported payment links, and existing .nim names", () => {
  assert.equal(parseRecipientQR("NQ07 0000 0000 0000 0000 0000 0000 0000 0000", "NIM"), nim);
  assert.equal(parseRecipientQR(`nimiq:${nim}?amount=123&message=Coffee`, "NIM"), nim);
  assert.equal(parseRecipientQR(`https://wallet.nimiq.com/#_request/${nim}/123/Coffee`, "NIM"), nim);
  assert.equal(parseRecipientQR("nimiqpay://pay?recipient=Paul.nim", "NIM"), "paul.nim");
});

test("rejects invalid checksums, conflicting recipients, unrelated URLs, and cross-network QRs", () => {
  for (const raw of ["NQ0800000000000000000000000000000000", `nimiq:${nim}?to=other.nim`, `https://wallet.nimiq.com.example/#_request/${nim}`, "nimiq:%XX", evm]) {
    assert.equal(parseRecipientQR(raw, "NIM"), null);
  }
  assert.equal(parseRecipientQR(`ethereum:${evm}@137?value=1`, "USDT"), evm);
  assert.equal(parseRecipientQR(`ethereum:${evm}@1`, "USDT"), null);
  assert.equal(parseRecipientQR(`ethereum:${evm}@137/transfer`, "USDT"), null);
});

test("deployment policy permits same-origin camera while retaining microphone restrictions", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const header = config.headers[0].headers.find(({ key }: {key: string}) => key === "Permissions-Policy");
  assert.equal(header.value, "camera=(self), microphone=(), geolocation=()");
});
