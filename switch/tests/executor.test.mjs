import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeEvent, validateBindings } from '../executor.mjs';
const token = 'a'.repeat(64);
const bindings = { esc_abc: { room: 'room1', participants: Object.fromEntries(['payer','recipient','verifier'].map(role => [role,{sender: `opaque-${role}`,token}])) }, trip_abc: {room:'room1',participants:{payer:{sender:'opaque-payer',token}}} };
const event = (action = 'release', role = 'verifier', id='esc_abc') => ({ type:'message', sequence:12, room_id:'room1', payload:{ addressed:true, sender:`opaque-${role}`,sender_name:'untrusted name',body:`!clearsend ${id} ${action}`,message_id:'message1',timestamp:Date.now(),attachments:[] } });
const options = fetcher => ({ bindings, apiBase:'https://fixture.invalid', fetcher });
test('validate private bindings and prevent self-verification', () => {
  validateBindings(bindings);
  const bad = structuredClone(bindings); bad.esc_abc.participants.verifier.sender='opaque-recipient';
  assert.throws(() => validateBindings(bad));
});
test('authorized exact commands use private capability, authenticated sender and stable replay key', async () => {
  const calls=[];
  const fetcher = async (url, init) => {calls.push({url,init});return new Response('{}');};
  const e=event(); await executeEvent(e,options(fetcher)); await executeEvent(e,options(fetcher));
  assert.equal(calls[0].init.headers['x-escrow-role'],'verifier');
  assert.equal(calls[0].init.headers['x-clearsend-api-key'],undefined);
  assert.equal(calls[0].init.headers['idempotency-key'],calls[1].init.headers['idempotency-key']);
  assert.equal(JSON.parse(calls[0].init.body).confirmation.by,'opaque-verifier');
});
test('no network for unauthorized, spoofed, quoted, stale or cross-room confirmations', async () => {
  const fetcher=()=>{throw Error('Network must not run');};
  const cases=[event('release','recipient'),event('fund','verifier'),event('pay','recipient','trip_abc')];
  for (const change of [e=>e.payload.addressed=false,e=>e.room_id='wrong',e=>e.payload.sender_kind='platform',e=>e.payload.on_behalf_of='payer',e=>e.payload.sender='unknown',e=>e.payload.timestamp=0,e=>e.payload.body+=' no do not release',e=>e.payload.attachments=[{}]]) {const e=event();change(e);cases.push(e);}
  for (const e of cases) await assert.rejects(executeEvent(e,options(fetcher)));
  assert.deepEqual(await executeEvent({...event(),payload:{body:'quoted !clearsend esc_abc release'}},options(fetcher)),{ignored:true});
});
test('payer trip capability and recipient submission are scoped correctly', async () => {
  const calls=[];const fetcher=async(url,init)=>{calls.push({url,init});return new Response('{}');};
  await executeEvent(event('pay','payer','trip_abc'),options(fetcher));
  assert.equal(calls[0].init.headers['x-trip-token'],token);
  await executeEvent(event('submit the deliverable','recipient'),options(fetcher));
  assert.equal(JSON.parse(calls[1].init.body).deliverable,'the deliverable');
});
test('flight search only for bound participants',async()=>{
  let called=false;
  const e=event(); e.payload.body='!clearsend flights LOS LHR 2026-12-15';
  await executeEvent(e,options(async(url,init)=>{called=true;assert.match(url,/from=LOS/);assert.equal(init.method,undefined);return new Response('{}');}));
  assert.ok(called);
});
test('API failures are surfaced, never retried automatically',async()=>{
  let n=0; await assert.rejects(executeEvent(event(),options(async()=>{n++;return new Response('{}',{status:409});}))); assert.equal(n,1);
});
