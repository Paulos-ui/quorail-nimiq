import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cleanAssistantAnswer } from '../lib/ai-presentation';
import { isNimName, normalizeNimName } from '../lib/nim-identity';
test('AI formatting artifacts are removed safely', () => {
  assert.deepEqual(cleanAssistantAnswer('## Summary\n\n**Your reserve** looks good.\n\n- Check fees.'), ['Summary', 'Your reserve looks good.', '• Check fees.']);
});
test('NIM usernames require a valid format', () => {
  assert.equal(normalizeNimName(' Paul.NIM '), 'paul.nim');
  assert.equal(isNimName('paul.nim'), true);
  assert.equal(isNimName('paul.nim.evil.com'), false);
  assert.equal(isNimName('paul nim'), false);
});
