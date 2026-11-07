import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDecision } from '../lib/decision';
const row = (criterion = 'A', met: unknown = true) => ({ criterion, met, reason: 'evidence' });
const verdict = (criteria: unknown[] = [row('A'), row('B')], met: unknown = true) => JSON.stringify({ met, summary: 'Checked', criteria });
test('strict verdict, reorder to original criteria and fail overall if any criterion fails', () => {
  assert.equal(parseDecision(verdict([row('B'), row('A')]), ['A','B']).criteria[0].criterion, 'A');
  assert.equal(parseDecision(verdict([row('A'),row('B',false)]), ['A','B']).met, false);
  assert.equal(parseDecision(verdict([row('Meets the specification')]), []).met, true);
});
for (const [name, content] of Object.entries({
  'false string overall': verdict(undefined, 'false'),
  'false string criterion': verdict([row('A','false'),row('B')]),
  missing: verdict([row('A')]), duplicate: verdict([row('A'),row('A')]),
  unknown: verdict([row('A'),row('C')]), empty: verdict([]),
  malformed: '{"met": true}', prose: 'Here is ' + verdict(),
})) test(`reject ${name}`, () => assert.throws(() => parseDecision(content, ['A','B'])));
test('reject duplicate original criteria', () => assert.throws(() => parseDecision(verdict(), ['A','A'])));
