import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handoff } from '../../cli/handoff.mjs';
test('OpenCode handoffs name the next teammate and never leak private records',()=>{
  const e={id:'esc_abc',state:'created',recipient:{email:'private@example.invalid'},secret:'never-echo',order:null};
  assert.equal(handoff({escrow:e}).nextRole,'payer');
  e.state='funded';assert.equal(handoff({escrow:e}).nextRole,'recipient');
  e.state='submitted';assert.equal(handoff({escrow:e}).humanCommand,'@clearsend-executor !clearsend esc_abc verify');
  e.state='verified';assert.equal(handoff({escrow:e}).humanCommand,'@clearsend-executor !clearsend esc_abc release');
  assert.ok(!JSON.stringify(handoff({escrow:e})).includes('private@example.invalid'));
  assert.ok(!JSON.stringify(handoff({escrow:e})).includes('never-echo'));
  e.state='released';assert.match(handoff({escrow:e}).instruction,/final settlement/);
});
