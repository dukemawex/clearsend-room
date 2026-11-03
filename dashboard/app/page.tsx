import Link from "next/link";
import { listActivity } from "@/lib/activity";
import { listEscrows } from "@/lib/escrow";
import { safe } from "@/lib/safe";
import { listTrips } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [esc, trips, act] = await Promise.all([safe(listEscrows), safe(listTrips), safe(() => listActivity(8))]);
  const err = esc.error || trips.error || act.error;
  return (
    <>
      <h1>The room, at a glance</h1>
      <p className="mut">
        Everything here happens in a chat channel first. A payer, a recipient and a verifier talk to the ClearSend agent through <b>Switch</b>; this page only mirrors the
        shared state the agent writes. Nothing is seeded: an empty page means nobody has used the room yet.
      </p>
      {err && <div className="card err">Storage unavailable: {err}</div>}
      <div className="grid">
        <div className="card"><div className="mut">Escrows</div><h2>{esc.data?.length ?? "-"}</h2><Link href="/escrow">Open</Link></div>
        <div className="card"><div className="mut">Trips</div><h2>{trips.data?.length ?? "-"}</h2><Link href="/trips">Open</Link></div>
        <div className="card"><div className="mut">Awaiting a human</div><h2>{esc.data?.filter((e) => e.state === "verified" || e.state === "created").length ?? "-"}</h2><span className="mut">verified (needs release approval) or unfunded</span></div>
      </div>
      <h2>Latest activity</h2>
      {act.data?.length ? (
        <table><tbody>{act.data.map((a) => <tr key={a.id}><td className="mut">{new Date(a.at).toUTCString()}</td><td><span className="pill">{a.kind}</span></td><td>{a.summary}</td><td className="mut">{a.actor}</td></tr>)}</tbody></table>
      ) : (
        !act.error && <div className="empty">No activity yet. Start in the room: <code>@clearsend find me a flight LOS to LHR on 2026-12-15</code></div>
      )}
    </>
  );
}
