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
   await requirePolygon(provider);
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
 return <section className="card" style={{padding:20,marginTop:24,border:'1px solid var(--line, #ddd)',borderRadius:16}}>
  <h3><Localized text="Pay with USDT" /> <small style={{fontWeight:400}}>· Polygon</small></h3>
  <p style={{fontSize:14}}>Send Polygon PoS USDT using an EVM wallet. This is separate from NIM payments and NIM reserves. Every transfer needs wallet approval.</p>
  <p style={{fontSize:12}}>Recipient must be a Polygon 0x address. A .nim name is not a Polygon address. Network fees may require POL depending on your wallet.</p>
  {!account?<button className="button" disabled={busy} onClick={connect}>Connect Polygon wallet</button>:<><p style={{overflowWrap:'anywhere'}}>Wallet: {account}</p><p>USDT balance: {balance || 'Loading…'}</p>
  {!payment?<><label style={{display:'block',marginTop:12}}>Recipient Polygon address<input style={{display:'block',width:'100%',marginTop:5}} value={to} onChange={e=>setTo(e.target.value.trim())} placeholder="0x…" /></label>
  <label style={{display:'block',marginTop:12}}>Amount (USDT)<input style={{display:'block',width:'100%',marginTop:5}} value={amount} onChange={e=>setAmount(e.target.value.trim())} inputMode="decimal" placeholder="10.00" /></label>
  <button className="button" style={{marginTop:14}} disabled={busy || !to || !amount} onClick={send}>Review and pay USDT</button></>:<><p style={{overflowWrap:'anywhere'}}>Status: {status}. <a href={`https://polygonscan.com/tx/${payment.hash}`} target="_blank" rel="noopener noreferrer">View on PolygonScan</a></p>
  <button className="button" disabled={busy || account.toLowerCase()!==payment.from.toLowerCase()} onClick={check}>Verify receipt</button> {status==='confirmed'&&<button className="button outline" onClick={()=>{localStorage.removeItem('quorail-polygon-usdt-pending');setPayment(null);setStatus('');setAmount('');}}>New payment</button>}</>}
  </>}
  {message&&<p role="status" style={{marginTop:12}}>{message}</p>}
 </section>;
}
