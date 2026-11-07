// Deterministic executor. Run outside the OpenCode/model workspace.
import { createHash } from 'node:crypto';

export function validateBindings(bindings) {
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings)) throw Error('Bindings must be an object');
  for (const [id, b] of Object.entries(bindings)) {
    if (!/^(esc|trip)_[a-z0-9]+$/.test(id) || typeof b.room !== 'string' || !b.room) throw Error('Invalid subject/room');
    const roles = id.startsWith('esc_') ? ['payer', 'recipient', 'verifier'] : ['payer'];
    const senders = new Set();
    for (const role of roles) {
      const p = b.participants?.[role];
      if (!p || typeof p.sender !== 'string' || !p.sender || !/^[a-f0-9]{64}$/.test(p.token)) throw Error('Invalid private participant capability');
      if (senders.has(p.sender)) throw Error('Roles must be assigned to distinct human participants');
      senders.add(p.sender);
    }
  }
  return bindings;
}

const allowed = { fund: ['payer'], capture: ['payer'], submit: ['recipient'], verify: ['verifier'], release: ['verifier'], refund: ['payer', 'verifier'], pay: ['payer'] };

/** Only accept authenticated Switch envelopes, never model-generated webhook input. */
export async function executeEvent(event, { bindings, apiBase, fetcher = fetch, now = Date.now() }) {
  if (event.type !== 'message') return { ignored: true };
  const p = event.payload;
  if (!p || typeof p.body !== 'string') return { ignored: true };
  const command = p.body.replace(/^@clearsend-executor\s+/, '');
  if (!command.startsWith('!clearsend ')) return { ignored: true };
  if (p.addressed !== true) throw Error('Command must address the executor through Switch');
  if (!Number.isSafeInteger(event.sequence) || typeof p.message_id !== 'string' || !p.message_id ||
      typeof p.sender !== 'string' || p.sender_kind || p.on_behalf_of || p.attachments?.length) throw Error('Unsupported message provenance');
  if (!Number.isSafeInteger(p.timestamp) || now - p.timestamp > 300_000 || p.timestamp > now + 30_000) throw Error('Stale/future confirmation; send a new command');
  const flight = command.match(/^!clearsend flights ([A-Z]{3}) ([A-Z]{3}) (\d{4}-\d{2}-\d{2})$/);
  if (flight) {
    if (!Object.values(bindings).some(b => b.room === event.room_id && Object.values(b.participants).some(person => person.sender === p.sender))) throw Error('Sender is not bound to this room');
    const query = new URLSearchParams({ from: flight[1], to: flight[2], date: flight[3], adults: '1', currency: 'USD' });
    const response = await fetcher(`${apiBase}/api/flights/search?${query}`, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw Error(`Flight search rejected: HTTP ${response.status}`);
    return { ok: true, action: 'flights', httpStatus: response.status };
  }
  // Exact commands prevent quoted/negated approvals being interpreted as consent.
  const match = command.match(/^!clearsend ((?:esc|trip)_[a-z0-9]+) (fund|capture|submit|verify|release|refund|pay)(?: ([\s\S]{1,12000}))?$/);
  if (!match) throw Error('Use !clearsend <subject> <action>; only submit accepts text');
  const [, id, action, text] = match;
  if ((action === 'submit') !== Boolean(text)) throw Error('Only submit requires deliverable text');
  const b = bindings[id];
  if (!b || b.room !== event.room_id) throw Error('Subject not bound to this room');
  const role = Object.keys(b.participants).find(r => b.participants[r].sender === p.sender);
  if (!role || !allowed[action].includes(role)) throw Error('Sender is not authorized for this action');
  const trip = id.startsWith('trip_');
  if (trip ? !['pay', 'capture'].includes(action) : action === 'pay') throw Error('Action does not apply to this subject');
  const participant = b.participants[role];
  const path = `/api/${trip ? 'trips' : 'escrow'}/${id}/${action}`;
  const key = createHash('sha256').update(JSON.stringify([event.room_id, p.message_id, id, action])).digest('hex');
  const body = action === 'submit' ? { deliverable: text, by: p.sender } : { confirmation: { by: p.sender, text: p.body, platform: 'switch' } };
  const response = await fetcher(`${apiBase}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': key,
      ...(trip ? { 'x-trip-token': participant.token } : { 'x-escrow-role': role, 'x-escrow-token': participant.token }) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(120_000), redirect: 'error',
  });
  // Do not print API response bodies: they can contain private records or approval URLs.
  if (!response.ok) throw Error(`ClearSend rejected ${action}: HTTP ${response.status}`);
  return { ok: true, subject: id, action, httpStatus: response.status };
}
