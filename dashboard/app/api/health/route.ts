import { NextResponse } from "next/server";
import { appUrl } from "@/lib/links";
import { paypalConfigured } from "@/lib/paypal";
import { storeConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

// Reports which integrations are configured. Never returns values.
export async function GET() {
  return NextResponse.json({
    dashboardUrl: appUrl(),
    storage: storeConfigured(),
    paypalSandbox: paypalConfigured(),
    escrowLinkSecret: Boolean(process.env.ESCROW_LINK_SECRET),
    serviceKey: Boolean(process.env.CLEARSEND_API_KEY),
    freeModel: Boolean(process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY),
    skyScrapper: Boolean(process.env.RAPIDAPI_KEY),
    openskyAuth: Boolean(process.env.OPENSKY_CLIENT_ID),
    openData: ["OpenFlights airports/airlines/routes.dat", "OpenSky REST", "open.er-api.com", "frankfurter.app"],
  });
}
