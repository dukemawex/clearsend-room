import { NextResponse } from "next/server";
import { record } from "@/lib/activity";
import { requireServiceKey } from "@/lib/auth";
import { fail } from "@/lib/http";
import { captureOrder, getOrder } from "@/lib/paypal";
import { getTrip, saveTrip } from "@/lib/trips";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireServiceKey(req);
  if (denied) return denied;
  try {
    const t = await getTrip((await params).id);
    if (!t) return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
    if (t.state !== "awaiting_payment" || !t.order) return NextResponse.json({ ok: false, error: `Trip is ${t.state}` }, { status: 409 });
    const o = await getOrder(t.order.id);
    if (o.status !== "APPROVED") return NextResponse.json({ ok: false, error: `PayPal order is ${o.status}; the payer has not approved it yet.`, approveUrl: t.order.approveUrl }, { status: 409 });
    const c = await captureOrder(t.order.id);
    if (c.status !== "COMPLETED") return NextResponse.json({ ok: false, error: `Capture status ${c.status}` }, { status: 502 });
    const at = new Date().toISOString();
    t.order = { ...t.order, status: c.status, captureId: c.captureId };
    t.state = "paid";
    t.timeline.push({ state: "paid", at, by: "agent", note: `PayPal capture ${c.captureId} ${c.captureStatus}. ${t.ticketing}` });
    await saveTrip(t);
    await record({ kind: "paypal", subject: t.id, actor: "agent", summary: `Captured ${t.quote.total} ${t.quote.payCurrency} (capture ${c.captureId})` });
    return NextResponse.json({ ok: true, trip: t });
  } catch (e) {
    return fail(e);
  }
}
