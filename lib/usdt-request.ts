import {
  POLYGON_USDT,
  isEvmAddress,
  polygonBalance,
  requirePolygon,
  transferData,
  verifyPolygonUsdt,
  type EvmProvider,
} from "./polygon-usdt";

export const usdtInboxNetwork = "polygon:137";
export const evmHash = /^0x[0-9a-f]{64}$/i;
export function quantity(value: unknown) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value))
    throw new Error("Polygon returned an invalid quantity.");
  return BigInt(value);
}
export function requestTransfer(
  from: string,
  to: string,
  units: bigint,
  reference: string,
) {
  if (
    !isEvmAddress(from) ||
    !isEvmAddress(to) ||
    /^0x0{40}$/i.test(to) ||
    from.toLowerCase() === to.toLowerCase()
  )
    throw new Error("Choose a different, valid receiving account.");
  if (!/^[0-9a-f]{64}$/.test(reference))
    throw new Error("Invalid installment reference.");
  return {
    from,
    to: POLYGON_USDT,
    value: "0x0",
    data: transferData(to, units) + reference,
  };
}
export async function previewUsdt(
  wallet: EvmProvider,
  from: string,
  to: string,
  units: bigint,
  reference: string,
) {
  const tx = requestTransfer(from, to, units, reference);
  const balance = await polygonBalance(wallet, from);
  if (balance < units)
    throw new Error("Insufficient USDT for this installment.");
  const [gas, price, native] = await Promise.all([
    wallet.request({ method: "eth_estimateGas", params: [tx] }),
    wallet.request({ method: "eth_gasPrice" }),
    wallet.request({ method: "eth_getBalance", params: [from, "pending"] }),
  ]);
  const fee = quantity(gas) * quantity(price);
  if (fee <= 0n || quantity(native) < fee)
    throw new Error("Insufficient POL or unavailable network fee estimate.");
  await requirePolygon(wallet);
  const accounts = await wallet.request({ method: "eth_accounts" });
  if (
    !Array.isArray(accounts) ||
    accounts[0]?.toLowerCase() !== from.toLowerCase()
  )
    throw new Error("Wallet account changed. Connect again.");
  return { balance, fee, tx };
}
export async function verifyUsdtInstallment(
  wallet: EvmProvider,
  hash: string,
  from: string,
  to: string,
  units: bigint,
  reference: string,
) {
  const expected = requestTransfer(from, to, units, reference);
  const status = await verifyPolygonUsdt(
    wallet,
    hash,
    from,
    to,
    units,
    expected.data,
  );
  if (status !== "confirmed" && status !== "failed") return status;
  const receipt = (await wallet.request({
    method: "eth_getTransactionReceipt",
    params: [hash],
  })) as {
    blockNumber?: string;
    blockHash?: string;
    status?: string;
    transactionHash?: string;
  } | null;
  if (
    !receipt?.blockNumber ||
    !receipt.blockHash ||
    receipt.transactionHash?.toLowerCase() !== hash.toLowerCase() ||
    receipt.status !== (status === "confirmed" ? "0x1" : "0x0")
  )
    return "pending";
  const final = (await wallet.request({
    method: "eth_getBlockByNumber",
    params: ["finalized", false],
  })) as { number?: string } | null;
  if (!final || quantity(final.number) < quantity(receipt.blockNumber))
    return "pending";
  const block = (await wallet.request({
    method: "eth_getBlockByNumber",
    params: [receipt.blockNumber, false],
  })) as { hash?: string } | null;
  return block?.hash === receipt.blockHash ? status : "pending";
}
