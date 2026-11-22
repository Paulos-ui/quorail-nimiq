import test from "node:test";
import assert from "node:assert/strict";
import {
  previewUsdt,
  requestTransfer,
  verifyUsdtInstallment,
} from "../lib/usdt-request";
import {
  parseUsdt,
  POLYGON_USDT,
  transferData,
  type EvmProvider,
} from "../lib/polygon-usdt";
import { validateBoardInput } from "../lib/boards";
const from = "0x" + "1".repeat(40),
  to = "0x" + "2".repeat(40),
  hash = "0x" + "a".repeat(64),
  reference = "ab".repeat(32),
  units = parseUsdt("40.000001");
const data = requestTransfer(from, to, units, reference).data;
const tx = { hash, from, to: POLYGON_USDT, input: data };
const receipt = {
  transactionHash: hash,
  status: "0x1",
  blockHash: hash,
  blockNumber: "0x20",
  to: POLYGON_USDT,
  logs: [
    {
      address: POLYGON_USDT,
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x" + from.slice(2).padStart(64, "0"),
        "0x" + to.slice(2).padStart(64, "0"),
      ],
      data: "0x" + units.toString(16),
    },
  ],
};
function provider(overrides: Record<string, unknown> = {}): EvmProvider {
  const results: Record<string, unknown> = {
    eth_chainId: "0x89",
    eth_accounts: [from],
    eth_call: "0x5f5e100",
    eth_getBalance: "0xffff",
    eth_estimateGas: "0x100",
    eth_gasPrice: "0x2",
    eth_getTransactionByHash: tx,
    eth_getTransactionReceipt: receipt,
    ...overrides,
  };
  return {
    async request({ method, params }) {
      if (method === "eth_getBlockByNumber")
        return params?.[0] === "finalized" ? { number: "0x21" } : { hash };
      assert.ok(method in results);
      return results[method];
    },
  };
}
test("USDT requests accept only Polygon mainnet, nonzero recipients and integer micro-USDT", () => {
  const b = {
    kind: "request",
    asset: "USDT",
    network: "mainnet",
    title: "Invoice",
    rows: [
      {
        title: "Rent",
        responsible: "Payer",
        recipient: to,
        amount: Number(units),
        due: "2026-12-01",
      },
    ],
  };
  assert.equal(validateBoardInput(b).rows[0].amount, 40000001);
  for (const invalid of [
    { ...b, network: "testnet" },
    { ...b, kind: "team" },
    { ...b, asset: "BTC" },
    { ...b, rows: [{ ...b.rows[0], amount: 0.1 }] },
    { ...b, rows: [{ ...b.rows[0], recipient: "0x" + "0".repeat(40) }] },
  ])
    assert.throws(() => validateBoardInput(invalid));
});
test("USDT review checks token balance, POL estimate, chain and current account without sending", async () => {
  assert.equal(
    (await previewUsdt(provider(), from, to, units, reference)).fee,
    512n,
  );
  for (const overrides of [
    { eth_chainId: "0x1" },
    { eth_accounts: [to] },
    { eth_call: "0x1" },
    { eth_getBalance: "0x1" },
    { eth_gasPrice: "0x0" },
  ])
    await assert.rejects(
      previewUsdt(provider(overrides), from, to, units, reference),
    );
});
test("a finalized event pays only the referenced installment", async () => {
  const check = (w: EvmProvider) =>
    verifyUsdtInstallment(w, hash, from, to, units, reference);
  assert.equal(await check(provider()), "confirmed");
  for (const patch of [
    { eth_getTransactionByHash: { ...tx, input: transferData(to, units) } },
    { eth_getTransactionByHash: { ...tx, input: data.slice(0, -2) + "00" } },
    { eth_getTransactionReceipt: { ...receipt, logs: [] } },
  ])
    assert.equal(await check(provider(patch)), "mismatch");
  assert.equal(
    await check(provider({ eth_getTransactionReceipt: null })),
    "pending",
  );
  assert.equal(
    await check(
      provider({
        eth_getTransactionReceipt: { ...receipt, blockNumber: "0x22" },
      }),
    ),
    "pending",
  );
  assert.equal(
    await check(
      provider({ eth_getTransactionReceipt: { ...receipt, status: "0x0" } }),
    ),
    "failed",
  );
});
