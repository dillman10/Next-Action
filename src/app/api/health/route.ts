import { NextResponse } from "next/server";

/**
 * Health check for deployment and load balancers.
 * GET /api/health returns 200 when the app is running.
 */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
