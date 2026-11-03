import { NextResponse } from "next/server";
import { requireServiceKey } from "@/lib/auth";
import { createEscrow, listEscrows } from "@/lib/escrow";
import { quote } from "@/lib/fx";
import { bad, body, fail, str } from "@/lib/http";
import { roleLinks } from "@/lib/links";

export const dynamic = "force-dynamic";

// Public list is a summary only. Full records need a role token or the service key.
export async function GET() {
  try {
    const list = await listEscrows();
    return NextResponse.json({ ok: true, escrows: list.map((e) => ({ id: e.id, title: e.title, state: e.state, amount: e.amount, currency: e.currency, recipientCountry: e.recipient.country, createdAt: e.createdAt, lastStep: e.timeline.at(-1) })) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const denied = requireServiceKey(req);
  if (denied) return denied;
  try {
    const b = await body<Record<string, unknown>>(req);
    const amount = Number(b.amount);
    if (!(amount > 0 && amount <= 10000)) bad("amount must be between 0 and 10000");
    const currency = str(b.currency ?? "USD", "currency", 3).toUpperCase();
    const payCurrency = str(b.payCurrency ?? currency, "payCurrency", 3).toUpperCase();
    const recipientEmail = str(b.recipientEmail, "recipientEmail", 200);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) bad("recipientEmail must be the recipient's PayPal email");
    const q = await quote(amount, currency, payCurrency);
    const e = await createEscrow(
      {
        title: str(b.title, "title", 140),
        spec: str(b.spec, "spec", 4000),
        criteria: Array.isArray(b.criteria) ? b.criteria.map(String).filter(Boolean).slice(0, 12) : [],
        amount,
        currency,
        payCurrency,
        quote: q,
        payer: { name: str(b.payerName, "payerName", 80), email: typeof b.payerEmail === "string" ? b.payerEmail : undefined },
        recipient: { name: str(b.recipientName, "recipientName", 80), email: recipientEmail, country: str(b.recipientCountry, "recipientCountry", 60) },
        verifier: { name: str(b.verifierName, "verifierName", 80) },
        room: { platform: typeof b.platform === "string" ? b.platform : undefined, channel: typeof b.channel === "string" ? b.channel : undefined },
      },
      typeof b.requestedBy === "string" ? b.requestedBy : "agent",
    );
    return NextResponse.json({ ok: true, escrow: e, links: roleLinks(e.id), breakdown: q });
  } catch (e) {
    return fail(e);
  }
}
