import { NextResponse } from "next/server";
import { record } from "@/lib/activity";
import { searchFlights } from "@/lib/flights";
import { fail } from "@/lib/http";
import { newId, redis, storeConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const result = await searchFlights({
      origin: u.searchParams.get("from") ?? "",
      destination: u.searchParams.get("to") ?? "",
      date: u.searchParams.get("date") ?? "",
      currency: u.searchParams.get("currency") ?? "USD",
      adults: Number(u.searchParams.get("adults") ?? 1),
    });
    let searchId: string | null = null;
    // Snapshot the results so a booking can only reference an option the server actually returned (no invented prices).
    if (storeConfigured()) {
      searchId = newId("srch");
      await redis("SET", `room:search:${searchId}`, JSON.stringify(result), "EX", 3600);
      await record({ kind: "flight-search", subject: searchId, actor: "agent", summary: `${result.query.origin}->${result.query.destination} ${result.query.date}: ${result.options.length} options, ${result.priced} priced` });
    }
    return NextResponse.json({ ok: true, searchId, ...result });
  } catch (e) {
    return fail(Object.assign(e as Error, { status: (e as { status?: number }).status ?? 400 }));
  }
}
