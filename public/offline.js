// Never send or verify a payment here. Render untrusted local data as text only.
(() => {
 const select=document.getElementById('plans'), status=document.getElementById('status'), details=document.getElementById('details');
 let selected=null;
 const nim=n=>new Intl.NumberFormat('en',{maximumFractionDigits:5}).format(n/100000)+' NIM';
 try {
  for(let i=0;i<localStorage.length;i++) {
   const key=localStorage.key(i);
   if(!key || !/^quorail-nimiq:v1:[^:]+:[^:]+$/.test(key))continue;
   const parts=key.split(':');
   const option=document.createElement('option');option.value=key;option.textContent=parts[2]+' / '+parts[3].slice(0,8)+'…'+parts[3].slice(-4);select.append(option);
  }
  if(select.options.length===1) status.textContent='No saved plans found in this browser. Open Quorail online first to create one.';
 } catch {status.textContent='Browser storage is unavailable. Reconnect to open Quorail.';}
 select.addEventListener('change',()=>{
  selected=null;details.hidden=true;status.textContent='';
  if(!select.value)return;
  try {
   const plan=JSON.parse(localStorage.getItem(select.value));
   if(!plan || plan.version!==1 || !Number.isSafeInteger(plan.reserve) || plan.reserve<0 || !Array.isArray(plan.payments) || plan.payments.length>2000)throw new Error();
   const rows=document.getElementById('rows');rows.replaceChildren();
   for(const payment of plan.payments) {
    if(typeof payment.title!=='string' || typeof payment.due!=='string' || typeof payment.status!=='string' || !Number.isSafeInteger(payment.amount) || payment.amount<0)throw new Error();
    const row=document.createElement('li');row.textContent=payment.title+' / '+nim(payment.amount)+' / due '+payment.due+' / saved state: '+payment.status;rows.append(row);
   }
   document.getElementById('reserve').textContent='Saved reserve target: '+nim(plan.reserve);
   const parts=select.value.split(':');selected={network:parts[2],address:parts[3],plan};details.hidden=false;
   if(!plan.payments.length)status.textContent='This plan has no saved commitments.';
  } catch {status.textContent='This record cannot be displayed safely. It has not been changed. Reconnect to recover it.';}
 });
 document.getElementById('export').addEventListener('click',()=>{
  if(!selected)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(selected,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='quorail-offline-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Download requested. Check that your browser saved the backup.';
 });
})();
