import { listActivity } from "@/lib/activity";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

export default async function Activity() {
  const { data, error } = await safe(() => listActivity(200));
  const groups = [
    ["Agent decisions", ["decision"]],
    ["Human confirmations", ["confirmation"]],
    ["PayPal sandbox activity", ["paypal"]],
    ["Everything else", ["escrow", "trip", "flight-search"]],
  ] as const;
  return (
    <>
      <h1>Decisions &amp; PayPal activity</h1>
      {error && <div className="card err">{error}</div>}
      {groups.map(([title, kinds]) => {
        const items = data?.filter((a) => (kinds as readonly string[]).includes(a.kind)) ?? [];
        return (
          <div className="card" key={title}>
            <b>{title}</b>
            {items.length ? <table><tbody>{items.map((a) => <tr key={a.id}><td className="mut">{new Date(a.at).toUTCString()}</td><td>{a.summary}</td><td className="mut">{a.actor}</td><td className="mut">{a.subject}</td></tr>)}</tbody></table> : <p className="mut">Nothing yet.</p>}
          </div>
        );
      })}
    </>
  );
}
