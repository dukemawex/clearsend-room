import { NextResponse } from "next/server";
import { listActivity } from "@/lib/activity";
import { hasServiceKey } from "@/lib/auth";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const items = await listActivity(200, u.searchParams.get("subject") ?? undefined);
    // Public view drops the raw data payloads; the service key sees everything.
    return NextResponse.json({ ok: true, items: hasServiceKey(req) ? items : items.map(({ data: _d, ...rest }) => (void _d, rest)) });
  } catch (e) {
    return fail(e);
  }
}
