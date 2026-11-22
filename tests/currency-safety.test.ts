import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCurrencyRates } from '../lib/validateCurrencyRates';
const sample = () => ({nimUsd: 0.0012,usdtUsd: 1,usdToLocal:{USD:1,NGN:1450,EUR:0.9,GBP:0.78,INR:85,CAD:1.35},asOf:new Date().toISOString()});
test('rejects implausibly expensive NIM and inverted FX quotes',()=>{
 assert.equal(validateCurrencyRates({...sample(),nimUsd:2.82}),false);
 assert.equal(validateCurrencyRates({...sample(),usdToLocal:{USD:1,NGN:0.0007}}),false);
});
test('verified quotes convert NIM consistently across currencies',()=>{
 const rates=sample();assert.equal(validateCurrencyRates(rates),true);
 const nim=9874.607;
 assert.ok(Math.abs(nim*rates.nimUsd*rates.usdToLocal.NGN - 17181.81618)<0.001);
 assert.ok(Math.abs(nim*rates.nimUsd*rates.usdToLocal.EUR - 10.66457556)<0.001);
});
test('rejects expired market quotes',()=>{
 const rates=sample();rates.asOf=new Date(Date.now()-5*3600000).toISOString();assert.equal(validateCurrencyRates(rates),false);
});
