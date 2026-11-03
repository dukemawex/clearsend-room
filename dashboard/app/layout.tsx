import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "ClearSend Room", description: "Payer, recipient, verifier and an AI agent settle cross-border payments, flights and escrow together in a Switch room." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <b>ClearSend Room</b>
          <Link href="/">Overview</Link>
          <Link href="/escrow">Escrows</Link>
          <Link href="/trips">Trips</Link>
          <Link href="/activity">Decisions &amp; PayPal</Link>
          <Link href="/judges">Judges</Link>
          <span className="mut" style={{ marginLeft: "auto" }}>Mirror of the Switch room. PayPal sandbox only.</span>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
