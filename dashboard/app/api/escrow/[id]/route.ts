import { NextResponse } from "next/server";
import { listActivity } from "@/lib/activity";
import { requireEscrowAccess, requireServiceKey } from "@/lib/auth";
import { deleteEscrow, getEscrow, nextSteps } from "@/lib/escrow";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const access = requireEscrowAccess(req, id);
  if (access.error) return access.error;
  try {
    const e = await getEscrow(id);
    if (!e) return NextResponse.json({ ok: false, error: "Escrow not found" }, { status: 404 });
    const view = access.role === "recipient" || access.role === "verifier" ? { ...e, payer: { name: e.payer.name } } : e;
    return NextResponse.json({ ok: true, role: access.role, escrow: view, nextSteps: nextSteps(e), activity: await listActivity(200, id) });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireServiceKey(req);
  if (denied) return denied;
  try {
    const id = (await params).id;
    const e = await getEscrow(id);
    if (!e) return NextResponse.json({ ok: false, error: "Escrow not found" }, { status: 404 });
    if (["funded", "submitted", "verified", "rejected"].includes(e.state)) return NextResponse.json({ ok: false, error: "Escrow holds funds; refund or release first." }, { status: 409 });
    await deleteEscrow(id);
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err) {
    return fail(err);
  }
}
