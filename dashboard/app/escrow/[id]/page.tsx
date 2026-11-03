import { listActivity } from "@/lib/activity";
import { getEscrow, nextSteps, STATES } from "@/lib/escrow";
import { verifyRole } from "@/lib/links";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

const PARTIES = ["payer", "recipient", "verifier", "agent"] as const;

export default async function EscrowPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ role?: string; token?: string; paypal?: string }> }) {
  const { id } = await params;
  const { role, token, paypal } = await searchParams;
  if (!role || !token) return <div className="card err">401: this page needs the signed link for your role (payer, recipient or verifier) that the agent posted in the room.</div>;
  let ok = false;
  try {
    ok = verifyRole(id, role, token);
  } catch (e) {
    return <div className="card err">{(e as Error).message}</div>;
  }
  if (!ok) return <div className="card err">403: this link is not valid for role &quot;{role}&quot;.</div>;
  const { data: e, error } = await safe(() => getEscrow(id));
  if (error) return <div className="card err">{error}</div>;
  if (!e) return <div className="card err">Escrow not found.</div>;
  const steps = nextSteps(e);
  const { data: activity } = await safe(() => listActivity(200, id));
  const reached = new Set(e.timeline.map((t) => t.state));
  return (
    <>
      <h1>{e.title}</h1>
      <p>
        You are the <b>{role}</b>. State: <b className={`s-${e.state}`}>{e.state}</b>
        {paypal === "approved" && <span className="pill" style={{ marginLeft: 8 }}>PayPal says you approved. Tell the agent in the room so it captures.</span>}
      </p>
      <div className="card">
        <b>Lifecycle</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {STATES.map((s) => <span key={s} className={`pill ${reached.has(s) ? `s-${s}` : ""}`}>{reached.has(s) ? "● " : "○ "}{s}</span>)}
        </div>
      </div>
      <div className="grid">
        {PARTIES.map((p) => (
          <div key={p} className={`card ${p === role ? "you" : ""}`}>
            <div className="mut">{p}{p === role ? " (you)" : ""}</div>
            <b>{p === "payer" ? e.payer.name : p === "recipient" ? e.recipient.name : p === "verifier" ? e.verifier.name : "ClearSend agent"}</b>
            <p>{steps[p]}</p>
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="card">
          <b>Money</b>
          <table><tbody>
            <tr><td>Recipient gets</td><td>{e.amount} {e.currency} in {e.recipient.country}</td></tr>
            <tr><td>Converted</td><td>{e.quote.converted} {e.payCurrency} @ {e.quote.midRate.toFixed(4)} ({e.quote.rateSource})</td></tr>
            <tr><td>FX spread 1.2%</td><td>{e.quote.fxSpreadCost} {e.payCurrency}</td></tr>
            <tr><td>Platform fee 2.5%</td><td>{e.quote.platformFee} {e.payCurrency}</td></tr>
            <tr><td><b>Payer pays</b></td><td><b>{e.quote.total} {e.payCurrency}</b></td></tr>
            <tr><td>PayPal order</td><td>{e.order ? `${e.order.id} (${e.order.status})` : "not created"}{role === "payer" && e.state === "created" && e.order?.approveUrl && <> · <a href={e.order.approveUrl}>Approve in PayPal sandbox</a></>}</td></tr>
            <tr><td>Payout</td><td>{e.payout ? `${e.payout.batchId} (${e.payout.status})` : "none"}</td></tr>
            {e.refund && <tr><td>Refund</td><td>{e.refund.id} ({e.refund.status})</td></tr>}
          </tbody></table>
        </div>
        <div className="card">
          <b>Specification</b>
          <p style={{ whiteSpace: "pre-wrap" }}>{e.spec}</p>
          {!!e.criteria.length && <ol>{e.criteria.map((c) => <li key={c}>{c}</li>)}</ol>}
          <b>Deliverable</b>
          <p style={{ whiteSpace: "pre-wrap" }} className={e.deliverable ? "" : "mut"}>{e.deliverable ? `${e.deliverable.text}\n\n— ${e.deliverable.by}` : "Not posted yet."}</p>
        </div>
      </div>
      <div className="card">
        <b>Agent decisions</b>
        {!e.decisions.length && <p className="mut">No decision yet.</p>}
        {e.decisions.map((d) => (
          <div key={d.at} style={{ marginTop: 10 }}>
            <span className={d.met ? "s-verified" : "s-rejected"}>{d.met ? "VERIFIED" : "REJECTED"}</span> <span className="mut">{d.model} · {d.at}</span>
            <p>{d.summary}</p>
            <ul>{d.criteria.map((c) => <li key={c.criterion}>{c.met ? "✅" : "❌"} {c.criterion}: <span className="mut">{c.reason}</span></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="card"><b>Timeline</b><ol className="tl">{e.timeline.map((t) => <li key={t.at + t.state}><b className={`s-${t.state}`}>{t.state}</b> <span className="mut">{t.at} · {t.by}</span><div>{t.note}</div></li>)}</ol></div>
        <div className="card"><b>Human approvals (verbatim from the room)</b>{e.approvals.length ? <ul>{e.approvals.map((a) => <li key={a.at}><b>{a.action}</b> by {a.by}: &ldquo;{a.text}&rdquo; <span className="mut">{a.at}</span></li>)}</ul> : <p className="mut">None yet.</p>}
          <b>Activity</b>{activity?.length ? <ul>{activity.map((a) => <li key={a.id}><span className="pill">{a.kind}</span> {a.summary}</li>)}</ul> : <p className="mut">None.</p>}</div>
      </div>
    </>
  );
}
