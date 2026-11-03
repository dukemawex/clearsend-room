import { paypalConfigured } from "@/lib/paypal";
import { storeConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

const Check = ({ ok, label }: { ok: boolean; label: string }) => <li>{ok ? "✅" : "⚠️"} {label} {ok ? "" : <span className="mut">(not configured on this deployment)</span>}</li>;

export default function Judges() {
  return (
    <>
      <h1>For judges</h1>
      <div className="card">
        <b>What you are looking at</b>
        <p>
          ClearSend Room turns a Slack / Discord / Mattermost / Telegram / Teams channel into a <b>Switch room</b> where a payer, a recipient and a verifier finish a
          cross-border payment with an AI agent: search real flights, book and pay through PayPal sandbox, and run an escrow that only releases after the agent verifies
          the deliverable <i>and</i> a human types the approval. The agent is an OpenCode session that Switch Console starts, running a free OpenRouter model.
          Without Switch there is no room, no shared history, no roles and no way for the three people to reach the agent.
        </p>
      </div>
      <div className="card">
        <b>This deployment</b>
        <ul>
          <Check ok={storeConfigured()} label="Upstash Redis (escrow, trips, audit log)" />
          <Check ok={paypalConfigured()} label="PayPal sandbox (Orders v2, Payouts, Refunds)" />
          <Check ok={Boolean(process.env.ESCROW_LINK_SECRET)} label="HMAC role links" />
          <Check ok={Boolean(process.env.CLEARSEND_API_KEY)} label="Agent service key" />
          <Check ok={Boolean(process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY)} label="Free model for verification" />
          <Check ok={Boolean(process.env.RAPIDAPI_KEY)} label="Sky-Scrapper priced fares (optional)" />
        </ul>
        <p className="mut">Live JSON: <a href="/api/health">/api/health</a></p>
      </div>
      <div className="card">
        <b>Reproduce in 5 minutes (in the Switch room)</b>
        <ol>
          <li><code>@clearsend flights LOS to LHR on 2026-12-15, 1 adult, I pay in USD</code> → real options; schedule-only ones say &ldquo;fare unavailable&rdquo;.</li>
          <li>Agent asks <i>&ldquo;Which flight would you like?&rdquo;</i> → reply with the option number (priced only).</li>
          <li>Agent asks <i>&ldquo;Would you like me to book this and pay with your PayPal account?&rdquo;</i>, collects traveller details, shows the FX + fee breakdown.</li>
          <li>Type <code>yes, book it</code> → PayPal sandbox approve link. Approve with a sandbox buyer, say <code>paid</code> → capture. See <a href="/trips">Trips</a>.</li>
          <li><code>@clearsend open an escrow: 50 USD to Ada (ada@example.com sandbox) in Ghana for a 3-slide pitch deck; verifier Tunde</code> → three signed links, one per role.</li>
          <li>Payer: <code>confirm fund</code> → approve → <code>paid</code>. Recipient posts the deliverable. Agent posts a criterion-by-criterion decision.</li>
          <li>Verifier types <code>approve release</code> → PayPal Payout. Every step shows up in <a href="/activity">Decisions &amp; PayPal</a>.</li>
        </ol>
      </div>
      <div className="card">
        <b>Guardrails you can test</b>
        <ul>
          <li><code>GET /api/escrow/&lt;id&gt;</code> without a token → 401; wrong token → 403 (HMAC-SHA256, timingSafeEqual).</li>
          <li>Booking a schedule-only option → 422. Prices only come from a server-side search snapshot, so the agent cannot invent one.</li>
          <li>Creating a PayPal order, releasing or refunding without a verbatim human confirmation → 428. A confirmation &ldquo;by&rdquo; the agent → 403. The recipient approving their own release → 403.</li>
          <li>The verifier model treats the deliverable as untrusted and fails closed: every criterion must pass.</li>
        </ul>
      </div>
    </>
  );
}
