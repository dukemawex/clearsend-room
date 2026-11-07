import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handoff } from '../../cli/handoff.mjs';
import { executeEvent } from '../executor.mjs';
import { POST } from '../../dashboard/app/api/escrow/[id]/[action]/route.ts';
import { POST as tripPay } from '../../dashboard/app/api/trips/[id]/pay/route.ts';
import { signRole } from '../../dashboard/lib/links.ts';

test('Switch -> real Next route lifecycle with fixture Redis/PayPal/model; replay and authorization', async () => {
  Object.assign(process.env,{ESCROW_LINK_SECRET:'fixture-secret-at-least-16',CLEARSEND_API_KEY:'fixture-agent',UPSTASH_REDIS_REST_URL:'https://redis.fixture.invalid',UPSTASH_REDIS_REST_TOKEN:'fixture',PAYPAL_CLIENT_ID:'fixture',PAYPAL_CLIENT_SECRET:'fixture',OPENROUTER_API_KEY:'fixture'});
  let invalidVerdict=false;
  const memory=new Map(), counts={capture:0,payout:0,refund:0,order:0};
  const original=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
    url=String(url);const json=Response.json;
    if(url==='https://redis.fixture.invalid'){
      const [cmd,k,v,...args]=JSON.parse(init.body);let result=null;
      if(cmd==='SET'){if(args.includes('NX')&&memory.has(k))result=null;else{memory.set(k,v);result='OK';}}
      else if(cmd==='GET')result=memory.get(k)??null;
      else if(cmd==='DEL'){memory.delete(k);result=1;}
      else if(cmd==='INCR'){result=Number(memory.get(k)??0)+1;memory.set(k,String(result));}
      else if(['EXPIRE','ZADD'].includes(cmd))result=1;
      else throw Error(`Unexpected Redis command ${cmd}`);
      return json({result});
    }
    if(url.startsWith('https://api-m.sandbox.paypal.com/')){
      if(url.endsWith('/token'))return json({access_token:'fixture-token',expires_in:3600});
      if(url.endsWith('/capture')){counts.capture++;return json({status:'COMPLETED',purchase_units:[{payments:{captures:[{id:'cap1',status:'COMPLETED'}]}}]});}
      if(url.endsWith('/refund')){counts.refund++;return json({id:'refund1',status:'COMPLETED'});}
      if(url.endsWith('/payouts')){counts.payout++;return json({batch_header:{payout_batch_id:'batch1',batch_status:'PENDING'}});}
      if(init.method==='POST'){counts.order++;return json({id:'order1',status:'CREATED',links:[{rel:'approve',href:'https://sandbox.fixture.invalid/approve'}]});}
      return json({id:'order1',status:'APPROVED'});
    }
    if(url==='https://openrouter.ai/api/v1/chat/completions')return json({choices:[{message:{content:JSON.stringify({met:invalidVerdict?'false':true,summary:'Pass fixture',criteria:[{criterion:'A',met:true,reason:'Evidence fixture'}]})}}]});
    throw Error(`Unmocked provider blocked: ${url}`);
  };
  try{
    const bindings={};
    for(const id of ['esc_abc','esc_refund']){
      memory.set(`room:escrow:${id}`,JSON.stringify({id,title:'Fixture',spec:'Deliver A',criteria:['A'],amount:10,currency:'USD',payCurrency:'USD',quote:{total:10},payer:{name:'P'},recipient:{name:'R',email:'fixture@example.invalid',country:'NG'},verifier:{name:'V'},state:'created',decisions:[],approvals:[],timeline:[]}));
      bindings[id]={room:'room',participants:Object.fromEntries(['payer','recipient','verifier'].map(role=>[role,{sender:`human-${role}`,token:signRole(id,role)}]))};
    }
    let seq=0,last;
    const make=(id,action,role)=>({type:'message',room_id:'room',sequence:++seq,payload:{addressed:true,sender:`human-${role}`,body:`!clearsend ${id} ${action}`,timestamp:Date.now(),message_id:`msg-${seq}`,attachments:[]}});
    const fetcher=async(url,init)=>{const parts=new URL(url).pathname.split('/');last=await POST(new Request(url,init),{params:Promise.resolve({id:parts[3],action:parts[4]})});return last;};
    const run=e=>executeEvent(e,{bindings,apiBase:'https://app.fixture.invalid',fetcher});
    const req=new Request('https://fixture.invalid',{headers:{'x-clearsend-api-key':'fixture-agent'}});
    assert.equal((await tripPay(req,{params:Promise.resolve({id:'trip_abc'})})).status,403);
    assert.equal((await POST(req,{params:Promise.resolve({id:'esc_abc',action:'release'})})).status,403);
    assert.equal((await POST(new Request('https://fixture.invalid'),{params:Promise.resolve({id:'esc_abc',action:'release'})})).status,401);
    const wrong=new Request('https://fixture.invalid',{headers:{'x-escrow-role':'verifier','x-escrow-token':'f'.repeat(64)}});
    assert.equal((await POST(wrong,{params:Promise.resolve({id:'esc_abc',action:'release'})})).status,403);
    const recipient=new Request('https://fixture.invalid',{headers:{'x-escrow-role':'recipient','x-escrow-token':signRole('esc_abc','recipient')}});
    assert.equal((await POST(recipient,{params:Promise.resolve({id:'esc_abc',action:'release'})})).status,403);
    await assert.rejects(run(make('esc_abc','release','recipient')));assert.equal(counts.payout,0);
    await assert.rejects(run(make('esc_abc','release','verifier')));
    const fund=make('esc_abc','fund','payer');
    const parallel=await Promise.allSettled([run(fund),run(fund)]);
    assert.ok(parallel.some(r=>r.status==='fulfilled'));
    await run(fund);assert.equal(counts.order,1);assert.equal(last.headers.get('idempotent-replay'),'true');
    assert.equal(handoff({escrow:JSON.parse(memory.get('room:escrow:esc_abc'))}).nextRole,'payer');
    const capture=make('esc_abc','capture','payer');await run(capture);await run(capture);assert.equal(counts.capture,1);
    assert.equal(handoff({escrow:JSON.parse(memory.get('room:escrow:esc_abc'))}).nextRole,'recipient');
    await run(make('esc_abc','submit Evidence A','recipient'));
    assert.equal(handoff({escrow:JSON.parse(memory.get('room:escrow:esc_abc'))}).nextRole,'verifier');
    invalidVerdict=true;
    await assert.rejects(run(make('esc_abc','verify','verifier')));
    assert.equal(JSON.parse(memory.get('room:escrow:esc_abc')).state,'submitted');assert.equal(counts.payout,0);
    invalidVerdict=false;
    await run(make('esc_abc','verify','verifier'));
    assert.match(handoff({escrow:JSON.parse(memory.get('room:escrow:esc_abc'))}).humanCommand,/release$/);
    const release=make('esc_abc','release','verifier');await run(release);await run(release);assert.equal(counts.payout,1);
    await assert.rejects(run(make('esc_abc','release','verifier')));assert.equal(counts.payout,1);
    assert.equal(JSON.parse(memory.get('room:escrow:esc_abc')).state,'released');
    await run(make('esc_refund','fund','payer'));await run(make('esc_refund','capture','payer'));
    const refund=make('esc_refund','refund','payer');await run(refund);await run(refund);assert.equal(counts.refund,1);
    assert.equal(JSON.parse(memory.get('room:escrow:esc_refund')).state,'refunded');
  }finally{globalThis.fetch=original;}
});
