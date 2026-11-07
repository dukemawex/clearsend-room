#!/usr/bin/env node
// Released contract: https://docs.switchagents.ai/switch-rooms/internals/agent-connection.md
import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { executeEvent, validateBindings } from './executor.mjs';

function base(name) {
  const u = new URL(process.env[name]);
  if (u.username || u.password || u.search || u.hash || (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)))) throw Error(`${name} requires HTTPS (HTTP loopback only)`);
  return u.href.replace(/\/$/, '');
}
const switchBase = base('SWITCH_BRIDGE_URL'), apiBase = base('CLEARSEND_API_URL');
const agent = process.env.SWITCH_EXECUTOR_AGENT_ID, key = process.env.SWITCH_EXECUTOR_API_KEY;
if (!agent || !key) throw Error('Executor agent id/key required (not the OpenCode agent)');
const bindings = validateBindings(JSON.parse(await readFile(process.env.SWITCH_BINDINGS_FILE, 'utf8')));
const stateFile = process.env.SWITCH_EXECUTOR_STATE_FILE;
if (!stateFile) throw Error('Private durable state file required');
let state;
try { state = JSON.parse(await readFile(stateFile, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; state = { connection: randomUUID(), cursor: null, generation: null, agent, switchBase }; }
if (typeof state.connection !== 'string' || state.agent !== agent || state.switchBase !== switchBase || (state.cursor !== null && !Number.isSafeInteger(state.cursor))) throw Error('Invalid cursor state or changed server/agent; reconcile before replacing state');
async function save() {
  await writeFile(`${stateFile}.tmp`, JSON.stringify(state), { mode: 0o600 });
  await rename(`${stateFile}.tmp`, stateFile);
}
await save();
const url = new URL(`${switchBase}/agents/${encodeURIComponent(agent)}/connection/ws`);
url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
for (const [k,v] of Object.entries({connection_id:state.connection,scope:'all',filter:'all',start_from:state.cursor===null?'head':String(state.cursor)})) url.searchParams.set(k,v);
if (state.generation !== null) url.searchParams.set('expected_generation',String(state.generation));
// No automatic money retries; explicit restart resumes with fencing and stable keys.
const ws = new WebSocket(url, {headers:{authorization:`Bearer ${key}`}, followRedirects:false, maxPayload:1_000_000, handshakeTimeout:10_000});
let stopped=false, initialized=false, queue=Promise.resolve();
await new Promise((resolve,reject)=>{
  const startup=setTimeout(()=>stop(Error('Missing connection_state')),10_000);
  let watchdog;
  function stop(error){
    if(stopped)return;stopped=true;clearTimeout(startup);clearTimeout(watchdog);ws.terminate();
    if(error)reject(error);else resolve();
  }
  function liveness(seconds){clearTimeout(watchdog);watchdog=setTimeout(()=>stop(Error('Switch ping timeout; reconcile before restart')),seconds*3000);}
  ws.on('message',(raw,isBinary)=>{
    try {
      if(isBinary)throw Error('Expected JSON text frame');
      const frame=JSON.parse(raw.toString());
      if(frame.event==='ping'){
        if(!initialized)throw Error('Ping before connection_state');
        // Pings must not queue behind a slow model/payment/API action.
        ws.send(JSON.stringify({type:'pong',cursor:state.cursor}));
        liveness(heartbeatSeconds);return;
      }
      if(['gap','evicted','room_released','subscription_changed','refused'].includes(frame.event)) throw Error('Switch delivery changed/refused: reconcile room/history before restarting');
      queue=queue.then(async()=>{
        if(stopped)return;
        if(frame.event==='connection_state'){
          if(initialized)throw Error('Repeated connection_state');
          const c=frame.data;
          if(c.connection_id!==state.connection||c.agent_id!==agent||!Number.isSafeInteger(c.cursor)||!Array.isArray(c.rooms)||!['number','string'].includes(typeof c.generation))throw Error('Invalid connection state');
          for(const b of Object.values(bindings))if(!c.rooms.includes(b.room))throw Error('Executor is not covering a configured room');
          heartbeatSeconds=c.heartbeat_interval_seconds;
          if(typeof heartbeatSeconds!=='number'||heartbeatSeconds<0.1||heartbeatSeconds>5)throw Error('Unsupported ping interval');
          state.generation=c.generation;
          // Initial head intentionally does not execute history from before activation.
          if(state.cursor===null)state.cursor=c.cursor;
          await save();initialized=true;clearTimeout(startup);liveness(heartbeatSeconds);return;
        }
        if(!initialized)throw Error('Missing connection_state');
        const e=frame.data;
        if(!Number.isSafeInteger(frame.id)||e.sequence!==frame.id||e.type!==frame.event)throw Error('Invalid event envelope');
        if(e.sequence<=state.cursor)return;
        const result=await executeEvent(e,{bindings,apiBase});
        state.cursor=e.sequence;await save();
        if(!result.ignored)console.log(JSON.stringify(result));
      }).catch(stop);
    }catch(error){stop(error);}
  });
  let heartbeatSeconds;
  ws.on('error',()=>stop(Error('Switch WebSocket connection failed')));
  ws.on('close',()=>stop(Error('Socket closed; inspect state then explicitly restart to resume')));
});
