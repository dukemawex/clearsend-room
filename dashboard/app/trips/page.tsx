import { safe } from "@/lib/safe";
import { listTrips, maskTraveller } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function Trips() {
  const { data, error } = await safe(listTrips);
  return (
    <>
      <h1>Trips</h1>
      <p className="mut">Flights the agent quoted in the room. Only provider-priced options can be booked; schedule-only results (OpenFlights/OpenSky) show &ldquo;fare unavailable&rdquo;.</p>
      {error && <div className="card err">{error}</div>}
      {data && !data.length && <div className="empty">No trips yet. In the room: <code>@clearsend flights LOS to LHR on 2026-12-15 for 1 adult</code></div>}
      {data?.map((t) => (
        <div className="card" key={t.id}>
          <b>{t.flight.airline} {t.flight.flightNumber ?? ""}</b> {t.flight.origin} → {t.flight.destination} · {t.searchedFor.date} · <span className={`s-${t.state}`}>{t.state}</span>
          <div className="mut">{t.flight.departure ?? ""} {t.flight.arrival ? `→ ${t.flight.arrival}` : ""} · {t.flight.stops} stop(s) · source {t.flight.source}</div>
          <p>Fare {t.flight.fareLabel} · payer pays <b>{t.quote.total} {t.quote.payCurrency}</b> (converted {t.quote.converted}, spread {t.quote.fxSpreadCost}, fee {t.quote.platformFee}, rate {t.quote.midRate.toFixed(4)} via {t.quote.rateSource})</p>
          <p>Travellers: {t.travellers.map(maskTraveller).map((x) => `${x.fullName} (${x.email})`).join(", ")}</p>
          {t.confirmation && <p>Confirmed in room by <b>{t.confirmation.by}</b>: &ldquo;{t.confirmation.text}&rdquo;</p>}
          <p>PayPal: {t.order ? `${t.order.id} ${t.order.status}${t.order.captureId ? ` · capture ${t.order.captureId}` : ""}` : "no order"}</p>
          <p className="mut">Ticketing: {t.ticketing}</p>
        </div>
      ))}
    </>
  );
}
