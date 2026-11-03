import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { verifyRole } from "./links";

/** Service key used by the agent's CLI. 401 when missing, 403 when wrong. */
export function requireServiceKey(req: Request): NextResponse | null {
  const expected = process.env.CLEARSEND_API_KEY;
  if (!expected) return NextResponse.json({ error: "CLEARSEND_API_KEY is not configured on the server." }, { status: 503 });
  const got = req.headers.get("x-clearsend-api-key");
  if (!got) return NextResponse.json({ error: "Missing x-clearsend-api-key" }, { status: 401 });
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  return null;
}

export function hasServiceKey(req: Request) {
  const expected = process.env.CLEARSEND_API_KEY;
  const got = req.headers.get("x-clearsend-api-key");
  if (!expected || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Per-escrow access: service key, or a role token. 401 when missing, 403 when invalid. */
export function requireEscrowAccess(req: Request, escrowId: string, allowed?: string[]): { error?: NextResponse; role?: string } {
  if (hasServiceKey(req)) return { role: "agent" };
  const u = new URL(req.url);
  const role = u.searchParams.get("role") ?? req.headers.get("x-escrow-role");
  const token = u.searchParams.get("token") ?? req.headers.get("x-escrow-token");
  if (!role || !token) return { error: NextResponse.json({ error: "Missing role or token" }, { status: 401 }) };
  let ok = false;
  try {
    ok = verifyRole(escrowId, role, token);
  } catch (e) {
    return { error: NextResponse.json({ error: (e as Error).message }, { status: 503 }) };
  }
  if (!ok) return { error: NextResponse.json({ error: "Invalid token for this role" }, { status: 403 }) };
  if (allowed && !allowed.includes(role)) return { error: NextResponse.json({ error: `Role ${role} cannot do this` }, { status: 403 }) };
  return { role };
}
