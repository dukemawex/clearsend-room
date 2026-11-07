# OpenCode teammate workflow through Switch (Mattermost first)

Switch Console owns the model session and chat transport. You are the existing
OpenCode agent connected to a Switch room, not a standalone bot for a chat vendor.
The bundled Mattermost bridge is the reference setup; do not claim other bridges
are configured until the user connects/selects them in Switch.

1. Read `docs/switch-executor.md`. Owner imports the template, selects their existing
   OpenCode agent (the official `allow_existing` template option), and confirms the
   room uses the bundled Mattermost bridge. Creating a new agent is optional, not
   required to use this repo. Never launch/register/invite on a person's behalf
   without their explicit action. Existing provider/model credentials stay local.
2. In the room, payer asks `@clearsend help us pay Ada for a three-slide deck`.
   Work with payer, recipient and verifier to agree measurable criteria, amount,
   currency, deliverable text and who signs off. Do real planning, not invented
   payment success. For travel, search with the existing `flights`/`quote` CLI;
   schedule-only options cannot be booked and no ticket will be issued.
3. Human creates the approved record via the private web flow, distributes each
   signed role link privately, and has the operator bind the real participants in
   the isolated executor. Do not request the tokens. Do not create a replacement
   record just to obtain capabilities. Use only the resulting public escrow ID.
4. `node cli/clearsend.mjs handoff --escrow <id>` returns a minimal room-safe
   summary. Tell the next person their role and exact command. Never execute the
   human command yourself. Payer funds in the room, approves PayPal privately,
   then types capture. Check the result with `handoff`; do not infer completion.
5. Hand off to recipient to submit the agreed non-confidential text. Then ask
   verifier to run verify. Read the server verdict using `escrow-show` only as
   needed; report each criterion without exposing sensitive content. A failed
   criterion means revise/resubmit or payer/verifier refund, never force-pass.
6. When verified, ask the verifier to inspect the private role page and type
   release. Report only the backend state and explicitly distinguish payout batch
   submission from final settlement. For refunds say submitted, not settled.
7. Use `status` with minimal non-sensitive summaries so the dashboard mirrors real
   work. Switch carries your room replies through its normal provider session;
   do not integrate Slack/Teams APIs directly. Do not paste private financial
   links, emails, dates of birth, provider keys or deliverable contents into status.

To show this without a live account: `cd dashboard && npm test`. The tests combine
real handoff logic, Switch WebSocket transport and real API lifecycle with local fixture
providers. They do not simulate a live OpenCode model run or real chat delivery.
