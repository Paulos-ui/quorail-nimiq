'use client';
import {useEffect,useState} from 'react';
import {formatUsdt,isEvmAddress,parseUsdt,polygonBalance,requirePolygon,submitPolygonUsdt,verifyPolygonUsdt,type EvmProvider} from '@/lib/polygon-usdt';
import Localized from './Localized';
type WalletWindow = Window & {ethereum?: EvmProvider};
export default function PolygonUsdt() {
 const [wallet,setWallet] = useState<EvmProvider|null>(null);
 const [account,setAccount] = useState('');
 const [balance,setBalance] = useState('');
 const [to,setTo] = useState('');
 const [amount,setAmount] = useState('');
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const [payment,setPayment] = useState<{hash:string;from:string;to:string;units:bigint}|null>(null);
 const [status,setStatus] = useState('');
 useEffect(()=>{try {const raw=localStorage.getItem('quorail-polygon-usdt-pending');if(raw){const p=JSON.parse(raw);if(/^0x[a-fA-F0-9]{64}$/.test(p.hash)&&isEvmAddress(p.from)&&isEvmAddress(p.to)){setPayment({...p,units:BigInt(p.units)});setStatus('pending');}}}catch{/* Ignore invalid local records. */}},[]);
 async function connect() {
  setBusy(true); setMessage('');
  try {
   const provider = (window as WalletWindow).ethereum;
   if (!provider) throw new Error('No compatible EVM wallet provider found in this browser or Nimiq Pay.');
   try { await requirePolygon(provider); } catch {
    try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x89'}]}); }
    catch { throw new Error('Polygon access was not approved or is unavailable in this wallet. Open Quorail in a compatible Polygon wallet.'); }
    await requirePolygon(provider);
   }
   const accounts = await provider.request({method:'eth_requestAccounts'});
   if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !isEvmAddress(accounts[0])) throw new Error('No Polygon account available.');
   const selected = accounts[0];
   setWallet(provider); setAccount(selected); setBalance(formatUsdt(await polygonBalance(provider,selected)));
  } catch(e) {setMessage(e instanceof Error?e.message:'Unable to connect Polygon wallet.');} finally {setBusy(false);}
 }
 async function send() {
  if (!wallet || !account || payment) return;
  setBusy(true);setMessage('');
  try {
   if (!isEvmAddress(to)) throw new Error('Enter a Polygon 0x recipient address. .nim names cannot receive USDT without a verified Polygon mapping.');
   const units=parseUsdt(amount);
   if (!window.confirm(`Send ${formatUsdt(units)} USDT on Polygon to ${to}? Verify the address in your wallet before approving.`)) return;
   const result=await submitPolygonUsdt(wallet,account,to,amount);
   localStorage.setItem('quorail-polygon-usdt-pending',JSON.stringify({hash:result.hash,from:account,to,units:units.toString()}));
   setPayment({hash:result.hash,from:account,to,units});setStatus('pending');
   setMessage('Transaction submitted. Wait for on-chain verification. Do not resend while pending.');
  } catch(e) {setMessage(e instanceof Error?e.message:'Payment was not completed.');} finally {setBusy(false);}
 }
 async function check() {
  if (!wallet || !payment) return;
  setBusy(true);setMessage('');
  try { const next=await verifyPolygonUsdt(wallet,payment.hash,payment.from,payment.to,payment.units);setStatus(next);
    if(next==='confirmed') setBalance(formatUsdt(await polygonBalance(wallet,account)));
    setMessage(next==='confirmed'?'Confirmed: token, sender, recipient and amount match the on-chain transfer.':next==='pending'?'Still pending. Check again shortly.':next==='failed'?'Transaction failed on chain.':'Transaction details did not match. Inspect PolygonScan before proceeding.');
  } catch(e) {setMessage(e instanceof Error?e.message:'Verification unavailable.');} finally {setBusy(false);}
 }
 return <section className="q-usdt" aria-label="Polygon USDT payments">
  <div className="q-usdt-header"><div><div className="q-usdt-title">Send USDT</div><div className="q-usdt-subtitle">A second way to pay, alongside NIM</div></div><span className="q-usdt-tag">USDT · Polygon</span></div>
  {!account ? <><p className="q-usdt-note">Connect a compatible Polygon wallet. Quorail will request network access when supported. Your wallet must approve every transfer.</p><div className="q-usdt-actions"><button className="button" disabled={busy} onClick={connect}>{busy?'Connecting…':'Connect USDT wallet'}</button></div></> : <>
    <div className="q-usdt-grid"><div><span className="q-usdt-subtitle">Available USDT</span><h3>{balance || '…'} USDT</h3></div><div><span className="q-usdt-subtitle">Sending from</span><p style={{overflowWrap:'anywhere',fontSize:13}}>{account.slice(0,8)}…{account.slice(-6)}</p></div></div>
    {!payment ? <><label>Recipient Polygon address<input value={to} onChange={e=>setTo(e.target.value.trim())} placeholder="0x…" autoComplete="off" /></label><label>Amount in USDT<input value={amount} onChange={e=>setAmount(e.target.value.trim())} inputMode="decimal" placeholder="0.00" /></label><p className="q-usdt-note">USDT uses a Polygon 0x address, not a Nimiq NQ address or .nim name. Review the recipient in your wallet before approval. Network fees depend on wallet support.</p><div className="q-usdt-actions"><button className="button" disabled={busy||!isEvmAddress(to)||!amount} onClick={send}>Review USDT payment</button></div></> : <><p className="q-usdt-note">Transaction: {status}. <a href={`https://polygonscan.com/tx/${payment.hash}`} target="_blank" rel="noopener noreferrer">View on PolygonScan</a></p><div className="q-usdt-actions"><button className="button" disabled={busy||account.toLowerCase()!==payment.from.toLowerCase()} onClick={check}>Verify transaction</button>{status==='confirmed'&&<button className="button outline" onClick={()=>{localStorage.removeItem('quorail-polygon-usdt-pending');setPayment(null);setStatus('');setAmount('');}}>New payment</button>}</div></>}
  </>}
  {message&&<p className="q-usdt-message" role="status">{message}</p>}
 </section>;
}
