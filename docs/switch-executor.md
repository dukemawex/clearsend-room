# Authenticated Switch executor (sandbox)

## What is implemented — and what is not

`switch/run-executor.mjs` is a real, deterministic Switch agent client: authenticated
WebSocket JSON frames down, ClearSend HTTPS calls up, connection-state negotiation, ping/pong, generation fencing,
durable cursor, stable message-based idempotency keys, and fail-stop handling of
gaps/eviction/transport errors. It does **not** invent an incoming webhook that Switch
would have to support. It does not post external messages. The existing OpenCode
agent remains the conversational planner, flight/FX search assistant and status
reader; a **separate** executor agent consumes exact human commands. Never run both
clients with the same agent ID/connection ID.

Protocol reference inspected for this implementation:
https://docs.switchagents.ai/switch-rooms/internals/agent-protocol.md
(public source inspected 7 November 2026). WebSocket envelopes use `type`, `sequence`,
`room_id`, and `payload.sender/message_id/body/timestamp`, not display-name claims.
The current released docs (agent-connection.md) supersede the generated GitHub docs: SSE is deprecated. This client uses `/connection/ws` with server pings and immediate cursor pongs. No registration, live room connection, provider payment or message posting was
performed while implementing this. Fixtures prove the contract and API lifecycle,
not a successful live Switch deployment.

## Trust boundary

- Trust the authenticated Switch server/bridge to assign participant IDs. Treat
  IDs as opaque. An operator assigns each verified **human** ID to a role out of band;
  display names, agent-supplied `by`, forwarded platform messages and model output
  never assign that role. A bridge/server compromise is outside this guarantee.
- Private role capabilities are HMAC-signed **bearer** links from the existing web
  flow. They are not independent human identity proofs and are currently not expiring.
  Anyone who obtains one can act as its role. Distribute each only to its intended
  person; **never put all three links, tokens or the bindings file in a shared room**.
- Keep executor credentials/bindings on a separate trusted host, OS account or
  container which the OpenCode agent cannot read. Merely adding a filename to
  `.gitignore` does not isolate it from an agent with shell access. Do not run the
  executor from an agent-writable checkout. Pin/review its code and dependencies.
- Money routes now reject service-key-only agent requests, before idempotency or
  provider calls. They require private role/payer capabilities. Creation responses
  authenticated as the agent omit these links. Existing CLI money commands will
  intentionally return 403: **do not bypass this by removing its service header**.
- Signed role links still permit the person to use the existing web flow; the
  executor is optional, not a relaxation of web auth. Role capabilities must be
  provisioned by the human creating the record through `/escrow/new` or `/plan`.
  Agent-created records have no automatic capability-distribution path: create
  through the human web flow instead of trying to recover keys through the agent.
- Deliverable verification uses a third-party model provider. Acceptance criteria,
  specifications and deliverable text leave your server. Do not submit confidential
  client/traveller material without appropriate consent/provider safeguards.
  Secrets/role tokens are never included in verification prompts or executor logs.
  OpenRouter `:free` is enforced there, but the optional NVIDIA fallback has its own
  provider terms: do not assume it is always free. No live model calls are tests.

## Operator setup (user-only credentials; do not paste them into chat)

1. Configure the dashboard's existing sandbox PayPal, Upstash, link secret and model
   variables on your deployment. Nothing in this change automatically deploys it.
2. Register a separate `clearsend-executor` custom agent out of band using
   `POST /agents` with a **registration** key created by the owner in Gateway.
   Do **not** use `/agents/register-known`: current docs reserve that for
   Console-run agents. Set the integration profile to `always_on`. Save its returned agent ID/API key privately.
   The registration token is not the runtime API key. This repo does not register
   or invite an agent on your behalf.
3. Invite the executor and the three real participants into the desired room.
   The existing `clearsend` OpenCode template is for the **planner**, not this client.
   Obtain the exact opaque participant IDs and room ID from authenticated room
   context/participant operations in Switch, independently of model suggestions.
4. Human creates escrow/trip in the web UI, checks names, acceptance criteria,
   amounts/currencies and payee. Privately retain each role link (or trip payer
   link). Enter only the `token` query value for escrow, or `t` for trip, into a
   private JSON file outside both the repo and the model runtime:

```json
{
  "esc_REPLACE": {
    "room": "opaque-room-id",
    "participants": {
      "payer": {"sender": "opaque-human-payer-id", "token": "64-lowercase-hex-from-payer-link"},
      "recipient": {"sender": "opaque-human-recipient-id", "token": "64-lowercase-hex-from-recipient-link"},
      "verifier": {"sender": "opaque-human-verifier-id", "token": "64-lowercase-hex-from-verifier-link"}
    }
  },
  "trip_REPLACE": {
    "room": "opaque-room-id",
    "participants": {
      "payer": {"sender": "opaque-human-payer-id", "token": "64-lowercase-hex-from-trip-link"}
    }
  }
}
```

Replace example record IDs with real lowercase `esc_...` / `trip_...` IDs. The three
escrow senders must be distinct. Do not commit this file. Restrict file permissions
to the executor owner (`chmod 600`). The private bindings are authoritative and must
not be editable through the model, chat or public web API.

5. Set these **only** in the isolated executor environment:
   `SWITCH_BRIDGE_URL` (bridge base, not Gateway), `SWITCH_EXECUTOR_AGENT_ID`,
   `SWITCH_EXECUTOR_API_KEY`, `SWITCH_BINDINGS_FILE`,
   `SWITCH_EXECUTOR_STATE_FILE` (private durable path), `CLEARSEND_API_URL`.
   HTTPS is required except HTTP loopback for local fixtures. No ClearSend service
   key, PayPal key, Redis key or model key is needed by this process.
6. Run `npm ci --ignore-scripts` at the repository root, then `node switch/run-executor.mjs`. Keep one process per state file/agent.
   It reads all rooms this executor covers without claiming the planner's sessions.
   It checks configured rooms are present in `connection_state`, uses the server's
   ping cadence and replies immediately with a committed cursor pong, and uses the same connection UUID/cursor plus `expected_generation` on explicit restart.
   It never auto-retries failed money operations. A gap, eviction, room coverage
   change, stale command, denied action or API failure stops it for operator review.
   Never delete/reset the cursor to silently skip an unreviewed financial action.
   Inspect current backend/provider state before resuming. A changed stream/server
   or reassigned room requires deliberate reconciliation, not reuse of old state.

## Human commands (exact, no quoted/negated approvals)

```text
@clearsend-executor !clearsend flights LOS LHR 2026-12-15
@clearsend-executor !clearsend esc_abc fund
@clearsend-executor !clearsend esc_abc capture
@clearsend-executor !clearsend esc_abc submit Here is the deliverable text ...
@clearsend-executor !clearsend esc_abc verify
@clearsend-executor !clearsend esc_abc release
@clearsend-executor !clearsend esc_abc refund
@clearsend-executor !clearsend trip_abc pay
@clearsend-executor !clearsend trip_abc capture
```

Flight search is available to bound participants. Payer: fund/capture/refund,
trip pay/capture. Recipient: submit. Verifier: verify/release/refund. The trusted
sender's exact command is recorded for financial confirmations. Only `submit`
accepts trailing text. Commands older than five minutes, future-dated by over
30 seconds, forwarded/platform-authored, or with attachments are refused.
The executor prints only subject/action/HTTP status, not raw financial records,
private tokens or PayPal approval URLs. Use the private role view for PayPal
approval; the executor does not post those links into the shared room.

OpenCode may explain outcomes using its read-only CLI/status mirror, but it must
never author these human commands. The sender binding, not its explanation,
authorizes execution. No airline tickets are issued. These are sandbox fund holds,
not regulated escrow. Existing payout batches/refunds can be asynchronous; the
current dashboard's `released` flag means a batch was submitted, not proof of final
settlement. Provider reconciliation/webhooks, expiring/revocable capabilities,
audit access/privacy and lock/timeout hardening remain production work.

## Offline verification/demo

```sh
npm ci --ignore-scripts # root: WebSocket client dependency
cd dashboard
npm ci --ignore-scripts
npm test
npm run lint
npm run typecheck
npm run build
```

The suite runs strict verifier regressions, authenticated-envelope routing,
unauthorized/spoofed/stale/cross-room rejection, WebSocket numeric envelope validation, local WebSocket
transport/heartbeat/resume fixtures, and the **real Next escrow route** through
fund → capture → submit → verify → release plus refund. Redis, PayPal and model
responses are fixtures; an unexpected provider request throws. Replayed requests
reuse the same idempotency key and cannot duplicate fixture capture/payout/refund.
No real credentials, external messages, bookings or live provider actions required.

## Reference chat route: existing OpenCode → Switch → Mattermost teammates

Start with the bundled Mattermost bridge rather than configuring four vendors at
once. In Console's template form choose **Existing agent** (the official
`allow_existing: true` option) and pick the OpenCode agent you already use; the
provider session, coding environment and model remain Switch-managed. The template
uses official v1 fields from https://github.com/sandbox-quantum/switch/blob/main/docs/TEMPLATES.md.
Select Mattermost, connect your creator account if Switch requests it, and review
before Create (which posts a kickoff). No import or kickoff has been performed by
this change. Exact labels can differ with Switch versions; if the server refuses
the template, use its field errors rather than inventing schema fields.

The new `docs/skills/team-handoff.md` is the agent's workflow. It uses real flight/FX
CLI tools, helps teammates agree deliverables and acceptance criteria, then calls
`node cli/clearsend.mjs handoff --escrow <id>` to ask the next person to act. That
command returns only a minimal safe summary and exact human command, never private
links or raw records. The trusted executor is a payment-authorization sidecar, **not
a replacement for the OpenCode teammate**. Switch carries the OpenCode agent's
ordinary replies into Mattermost. Other chat vendors can be selected later through
Switch; none are claimed connected or verified here.

### Custom-agent registration body (operator review only)

The following is the documented body for `POST /agents`, not a request executed
by this change. Authenticate separately with the registration key; never put the
key in a model prompt, this JSON, or a room document.

```json
{
  "name": "clearsend-executor",
  "description": "Deterministic human-authorized ClearSend sandbox executor",
  "connector_type": "clearsend-executor",
  "integration_profile": {
    "connection_model": "always_on",
    "message_exchange": true,
    "pre_invocation_mediation": [],
    "post_invocation_mediation": [],
    "event_reporting": []
  }
}
```

Owner must also permit the intended room participants to address this agent in
Switch's agent settings; new agents answer only their owner by default. The
executor requires `payload.addressed: true` and trusts only independently bound
human IDs. Mention `@clearsend-executor` in each command, as shown above. The
bridge may preserve that mention or normalize it away; both forms are accepted
only when the authenticated envelope says the executor was addressed.

Official pages consulted: [quickstart](https://docs.switchagents.ai/switch-rooms/getting-started/index.md),
[payments-room worked example](https://docs.switchagents.ai/switch-rooms/building/payments-room.md),
[agent connection](https://docs.switchagents.ai/switch-rooms/internals/agent-connection.md),
and [agent events](https://docs.switchagents.ai/switch-rooms/internals/agent-events.md).
The official payments-room example concerns a payments **engineering team**
(review/release roles), not an escrow API. We reuse its room briefing, shared
context and handoff pattern; we do not claim it supplies ClearSend payment tools.

## Review-only branch

`dashboard/vercel.json` disables automatic Vercel Git deployments for
`feat/switch-verified-confirmations` only, so pushing this review branch does not
request a preview or alter the live site. Other branches retain their existing
default behavior. This uses Vercel's documented `git.deploymentEnabled` setting;
no Vercel project settings or deployment APIs were changed.

For Console-managed local Mattermost, the released setup guide locates its login
under the server Home → Messaging apps → **Sign-in details…**. Sign in yourself,
then **Link my account… / This is me** before room creation. This is a user-only
account/linking step, not a need to install a separate Slack/Teams connector.
Sources: https://docs.switchagents.ai/switch-rooms/getting-started/add-a-server.md
and https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/mattermost.md.
