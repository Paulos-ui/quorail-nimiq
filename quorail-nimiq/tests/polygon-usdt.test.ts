import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {parseUsdt,formatUsdt,transferData,requirePolygon,verifyPolygonUsdt,POLYGON_USDT} from '../lib/polygon-usdt.ts';
const from='0x1111111111111111111111111111111111111111';
const to='0x2222222222222222222222222222222222222222';
test('USDT exact decimal arithmetic',()=>{assert.equal(parseUsdt('1.000001'),1000001n);assert.equal(formatUsdt(1000001n),'1.000001');for(const bad of ['1.0000001','-1','0','1e4','abc'])assert.throws(()=>parseUsdt(bad));});
test('ERC20 calldata',()=>{assert.equal(transferData(to,1000000n),'0xa9059cbb'+to.slice(2).padStart(64,'0')+(1000000n).toString(16).padStart(64,'0'));});
test('wrong chain blocks payments',async()=>{await assert.rejects(()=>requirePolygon({request:async()=> '0x1'}));});
test('receipt requires exact transfer event',async()=>{
 const units=1000000n, hash='0x'+'a'.repeat(64);
 const tx={from,to:POLYGON_USDT,input:transferData(to,units)};
 const receipt={status:'0x1',to:POLYGON_USDT,logs:[{address:POLYGON_USDT,topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef','0x'+from.slice(2).padStart(64,'0'),'0x'+to.slice(2).padStart(64,'0')],data:'0x'+units.toString(16)}]};
 const wallet={request:async({method}:{method:string})=>method==='eth_chainId'?'0x89':method==='eth_getTransactionByHash'?tx:receipt};
 assert.equal(await verifyPolygonUsdt(wallet,hash,from,to,units),'confirmed');
 assert.equal(await verifyPolygonUsdt(wallet,hash,from,to,units+1n),'mismatch');
});
