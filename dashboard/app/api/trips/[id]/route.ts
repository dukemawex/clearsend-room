import { NextResponse } from "next/server";
import { requireServiceKey } from "@/lib/auth";
import { fail } from "@/lib/http";
import { deleteTrip, getTrip, maskTraveller } from "@/lib/trips";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = await getTrip((await params).id);
    if (!t) return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
    const full = !requireServiceKey(req);
    return NextResponse.json({ ok: true, trip: full ? t : { ...t, travellers: t.travellers.map(maskTraveller) } });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireServiceKey(req);
  if (denied) return denied;
  try {
    const id = (await params).id;
    const t = await getTrip(id);
    if (!t) return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
    if (t.state === "paid") return NextResponse.json({ ok: false, error: "Paid trips are kept for the audit trail." }, { status: 409 });
    await deleteTrip(id);
    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    return fail(e);
  }
}
