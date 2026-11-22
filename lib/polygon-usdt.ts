/** Polygon PoS bridged USDT (often displayed as USDT0). Never use on other chains. */
export const POLYGON_CHAIN_ID = '0x89';
export const POLYGON_USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
export const USDT_DECIMALS = 6;
export type EvmProvider = { request(args: {method: string; params?: unknown[]}): Promise<unknown> };
export function isEvmAddress(value: string) { return /^0x[a-fA-F0-9]{40}$/.test(value); }
export function parseUsdt(input: string): bigint {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(input)) throw new Error('Enter a valid USDT amount (up to 6 decimal places).');
  const [whole, fraction = ''] = input.split('.');
  const units = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  if (units <= 0n || units >= (1n << 256n)) throw new Error('Enter a positive USDT amount.');
  return units;
}
export function formatUsdt(units: bigint) {
  const whole = units / 1000000n;
  const frac = (units % 1000000n).toString().padStart(6,'0').replace(/0+$/,'');
  return `${whole}${frac ? '.' + frac : ''}`;
}
export function transferData(to: string, units: bigint) {
  if (!isEvmAddress(to)) throw new Error('Use a valid Polygon 0x recipient address.');
  if (units <= 0n) throw new Error('Amount must be positive.');
  return '0xa9059cbb' + to.slice(2).toLowerCase().padStart(64,'0') + units.toString(16).padStart(64,'0');
}
export async function requirePolygon(wallet: EvmProvider) {
  const chain = await wallet.request({method:'eth_chainId'});
  if (typeof chain !== 'string' || chain.toLowerCase() !== POLYGON_CHAIN_ID) throw new Error('Switch your EVM wallet to Polygon PoS (chain 137) and try again.');
}
export async function polygonBalance(wallet: EvmProvider, account: string) {
  if (!isEvmAddress(account)) throw new Error('Invalid Polygon account.');
  await requirePolygon(wallet);
  const raw = await wallet.request({method:'eth_call',params:[{to:POLYGON_USDT,data:'0x70a08231'+account.slice(2).padStart(64,'0')},'latest']});
  if (typeof raw !== 'string' || !/^0x[0-9a-fA-F]+$/.test(raw)) throw new Error('Could not read the USDT balance.');
  return BigInt(raw);
}
export async function submitPolygonUsdt(wallet: EvmProvider, from: string, to: string, amount: string, beforeApproval?: () => void) {
  if (!isEvmAddress(from) || !isEvmAddress(to)) throw new Error('Check the sender and recipient Polygon addresses.');
  if (from.toLowerCase() === to.toLowerCase()) throw new Error('Sender and recipient cannot be the same.');
  const units = parseUsdt(amount);
  await requirePolygon(wallet);
  const available = await polygonBalance(wallet,from);
  if (available < units) throw new Error('Insufficient USDT balance.');
  await requirePolygon(wallet);
  const accounts = await wallet.request({method:'eth_accounts'});
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || accounts[0].toLowerCase() !== from.toLowerCase())
    throw new Error('The sending account changed. Reconnect before paying.');
  await requirePolygon(wallet);
  beforeApproval?.();
  const hash = await wallet.request({method:'eth_sendTransaction',params:[{from,to:POLYGON_USDT,data:transferData(to,units),value:'0x0'}]});
  if (typeof hash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(hash)) throw new Error('Wallet returned no valid transaction hash. Check wallet history before retrying.');
  return {hash,from,to,units,contract:POLYGON_USDT};
}
export async function verifyPolygonUsdt(wallet: EvmProvider, hash: string, from: string, to: string, units: bigint) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) throw new Error('Invalid transaction hash.');
  await requirePolygon(wallet);
  const tx = await wallet.request({method:'eth_getTransactionByHash',params:[hash]}) as null | {hash?:string;from?:string;to?:string;input?:string};
  const receipt = await wallet.request({method:'eth_getTransactionReceipt',params:[hash]}) as null | {transactionHash?:string;status?:string;to?:string;logs?:Array<{address?:string;topics?:string[];data?:string}>};
  if (!tx || !receipt) return 'pending' as const;
  if (tx.hash?.toLowerCase() !== hash.toLowerCase() || receipt.transactionHash?.toLowerCase() !== hash.toLowerCase()) return 'mismatch' as const;
  if (tx.from?.toLowerCase() !== from.toLowerCase() || tx.to?.toLowerCase() !== POLYGON_USDT.toLowerCase() || receipt.to?.toLowerCase() !== POLYGON_USDT.toLowerCase() || tx.input?.toLowerCase() !== transferData(to,units).toLowerCase()) return 'mismatch' as const;
  if (receipt.status === '0x0') return 'failed' as const;
  if (receipt.status !== '0x1') return 'pending' as const;
  const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const matched = receipt.logs?.some(log => log.address?.toLowerCase() === POLYGON_USDT.toLowerCase() && log.topics?.[0]?.toLowerCase() === transferTopic && log.topics?.[1]?.slice(-40).toLowerCase() === from.slice(2).toLowerCase() && log.topics?.[2]?.slice(-40).toLowerCase() === to.slice(2).toLowerCase() && typeof log.data === 'string' && BigInt(log.data) === units);
  return matched ? 'confirmed' as const : 'mismatch' as const;
}
