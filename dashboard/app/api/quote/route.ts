import { NextResponse } from "next/server";
import { quote } from "@/lib/fx";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = await quote(Number(u.searchParams.get("amount")), u.searchParams.get("from") ?? "USD", u.searchParams.get("to") ?? "USD");
    return NextResponse.json({ ok: true, quote: q, fees: { platformFee: "2.5%", fxSpread: "1.2% (0 when same currency)" } });
  } catch (e) {
    return fail(Object.assign(e as Error, { status: 400 }));
  }
}
