import { listEscrows } from "@/lib/escrow";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

export default async function Escrows() {
  const { data, error } = await safe(listEscrows);
  return (
    <>
      <h1>Escrows</h1>
      <p className="mut">Summary only. Each party opens the full record with the signed link the agent posted for their role in the room.</p>
      {error && <div className="card err">{error}</div>}
      {data && !data.length && <div className="empty">No escrows yet. In the room: <code>@clearsend open an escrow: 300 USD to Ada in Ghana for a logo, verifier Tunde</code></div>}
      {!!data?.length && (
        <table>
          <thead><tr><th>Title</th><th>State</th><th>Amount</th><th>To</th><th>Last step</th></tr></thead>
          <tbody>{data.map((e) => <tr key={e.id}><td>{e.title}<div className="mut">{e.id}</div></td><td className={`s-${e.state}`}>{e.state}</td><td>{e.amount} {e.currency}</td><td>{e.recipient.country}</td><td className="mut">{e.timeline.at(-1)?.note}</td></tr>)}</tbody>
        </table>
      )}
    </>
  );
}
