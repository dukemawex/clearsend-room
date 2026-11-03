import { NextResponse } from "next/server";
import { requireServiceKey } from "@/lib/auth";
import type { searchFlights } from "@/lib/flights";
import { quote } from "@/lib/fx";
import { bad, body, fail, str } from "@/lib/http";
import { redis } from "@/lib/store";
import { createTrip, listTrips, maskTraveller, type Traveller } from "@/lib/trips";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trips = await listTrips();
    return NextResponse.json({ ok: true, trips: trips.map((t) => ({ ...t, travellers: t.travellers.map(maskTraveller), order: t.order ? { id: t.order.id, status: t.order.status, captureId: t.order.captureId } : undefined })) });
  } catch (e) {
    return fail(e);
  }
}

// Create a priced quote for one option from a server-side search snapshot.
export async function POST(req: Request) {
  const denied = requireServiceKey(req);
  if (denied) return denied;
  try {
    const b = await body<{ searchId?: string; ref?: number; travellers?: Traveller[]; payCurrency?: string; requestedBy?: string }>(req);
    const raw = await redis<string | null>("GET", `room:search:${str(b.searchId, "searchId", 64)}`);
    if (!raw) bad("Search expired or unknown. Search again.", 404);
    const search = JSON.parse(raw as string) as Awaited<ReturnType<typeof searchFlights>>;
    const opt = search.options.find((o) => o.ref === Number(b.ref));
    if (!opt) bad(`Option ${b.ref} is not in search ${b.searchId}`, 404);
    if (!opt!.priced || !opt!.fare) bad("This option is schedule-only (fare unavailable) and cannot be booked or paid. Pick a priced option.", 422);
    const travellers = (b.travellers ?? []).map((t) => ({ fullName: str(t.fullName, "traveller fullName", 120), email: str(t.email, "traveller email", 200), dateOfBirth: t.dateOfBirth, nationality: t.nationality, phone: t.phone }));
    if (travellers.length !== search.query.adults) bad(`Need details for exactly ${search.query.adults} traveller(s).`);
    if (travellers.some((t) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.email))) bad("Each traveller needs a valid email.");
    const q = await quote(opt!.fare!.amount, opt!.fare!.currency, (b.payCurrency ?? "USD").toUpperCase());
    const trip = await createTrip({ flight: opt!, searchedFor: { date: search.query.date, adults: search.query.adults }, travellers, quote: q }, b.requestedBy ?? "agent");
    return NextResponse.json({ ok: true, trip, breakdown: q, ask: "Show this breakdown and ask: 'Would you like me to book this and pay with your PayPal account?'" });
  } catch (e) {
    return fail(e);
  }
}
