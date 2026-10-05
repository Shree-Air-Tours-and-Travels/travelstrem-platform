import { NextRequest, NextResponse } from "next/server";
import { getShreeAir } from "@/lib/shree-air";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ status: "error", message: "Please submit your enquiry from the Shree Air website." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 16000) return NextResponse.json({ status: "error", message: "Your enquiry is too long." }, { status: 413 });
  let input;
  try { input = await request.json(); } catch { return NextResponse.json({ status: "error", message: "Please enter your enquiry details." }, { status: 400 }); }
  try {
    const client = await getShreeAir();
    const api = (process.env.SHREE_AIR_API_URL || client.domains.api).replace(/\/$/, "");
    // Verify the configured server owns this tenant before forwarding any customer data.
    const configuration = await fetch(`${api}/api/tenant-config`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!configuration.ok || (await configuration.json()).data?.tenantId !== String(client._id)) throw new Error("Tenant API unavailable");
    const response = await fetch(`${api}/api/submit.json?form=contact-agent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form: "contact-agent", product: "trevista", tourTitle: "Shree Air website enquiry", fields: input.fields, url: input.url }), signal: AbortSignal.timeout(15000), cache: "no-store" });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ status: "error", message: "Your enquiry could not be sent. Please call our travel team, or try again later." }, { status: 503 });
  }
}
