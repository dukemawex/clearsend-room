import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('real executor: authenticated WebSocket, pong, durable cursor, generation fence, replay, gap (loopback)', {timeout:10000}, async()=>{
  const dir=await mkdtemp(join(tmpdir(),'clearsend-fixture-'));
  const bindings=join(dir,'bindings.json'),state=join(dir,'state.json');
  await writeFile(bindings,JSON.stringify({esc_abc:{room:'room',participants:Object.fromEntries(['payer','recipient','verifier'].map(r=>[r,{sender:`human-${r}`,token:'a'.repeat(64)}]))}}));
  const apiCalls=[],opens=[],pongs=[];let restarting=false,timer;
  const server=createServer(async(req,res)=>{
    if(req.url.startsWith('/api/escrow/')){
      apiCalls.push({path:req.url,headers:req.headers});for await(const c of req){void c;}
      res.writeHead(200,{'content-type':'application/json'});res.end('{"ok":true}');
    }else{res.writeHead(404);res.end();}
  });
  const wss=new WebSocketServer({server});
  wss.on('connection',(socket,req)=>{
    assert.equal(req.headers.authorization,'Bearer fixture-switch-key');
    const url=new URL(req.url,'http://localhost');assert.equal(url.pathname,'/agents/executor/connection/ws');
    opens.push(Object.fromEntries(url.searchParams));
    socket.send(JSON.stringify({event:'connection_state',data:{connection_id:opens.at(-1).connection_id,agent_id:'executor',generation:restarting?2:1,cursor:restarting?42:40,rooms:['room'],heartbeat_interval_seconds:0.1}}));
    if(restarting){setTimeout(()=>socket.send(JSON.stringify({event:'gap',data:{reason:'fixture'}})),30);return;}
    const event=(seq,action)=>({event:'message',id:seq,data:{type:'message',sequence:seq,room_id:'room',payload:{addressed:true,sender:'human-verifier',message_id:`message-${seq}`,body:`@clearsend-executor !clearsend esc_abc ${action}`,timestamp:Date.now(),attachments:[]}}});
    socket.send(JSON.stringify(event(41,'verify')));socket.send(JSON.stringify(event(41,'verify')));socket.send(JSON.stringify(event(42,'release')));
    timer=setInterval(()=>socket.send(JSON.stringify({event:'ping',data:{}})),100);
    socket.on('message',raw=>{const p=JSON.parse(raw.toString());pongs.push(p);if(p.cursor===42){clearInterval(timer);socket.send(JSON.stringify({event:'gap',data:{reason:'fixture reconcile'}}));}});
    socket.on('close',()=>clearInterval(timer));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  async function run(){return await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[fileURLToPath(new URL('../run-executor.mjs',import.meta.url))],{env:{PATH:process.env.PATH,SWITCH_BRIDGE_URL:base,CLEARSEND_API_URL:base,SWITCH_EXECUTOR_AGENT_ID:'executor',SWITCH_EXECUTOR_API_KEY:'fixture-switch-key',SWITCH_BINDINGS_FILE:bindings,SWITCH_EXECUTOR_STATE_FILE:state},stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);child.on('error',reject);child.on('close',code=>resolve({code,output}));
  });}
  try{
    const first=await run();assert.notEqual(first.code,0);assert.match(first.output,/reconcile/);
    assert.equal(apiCalls.length,2);assert.ok(pongs.length>0);assert.equal(pongs[0].type,'pong');
    assert.equal(JSON.parse(await readFile(state,'utf8')).cursor,42);
    assert.equal(apiCalls[1].headers['x-escrow-role'],'verifier');assert.equal(apiCalls[1].headers['x-clearsend-api-key'],undefined);
    assert.ok(!first.output.includes('fixture-switch-key'));assert.ok(!first.output.includes('a'.repeat(64)));
    restarting=true;await run();assert.equal(opens[1].start_from,'42');assert.equal(opens[1].expected_generation,'1');assert.equal(opens[0].connection_id,opens[1].connection_id);assert.equal(apiCalls.length,2);
  }finally{clearInterval(timer);for(const c of wss.clients)c.terminate();await new Promise(resolve=>wss.close(resolve));server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true});}
});
