import { NextRequest, NextResponse } from "next/server";
import { resolvePigeonName } from "@/lib/nim-resolver";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name") || "";
    const record = await resolvePigeonName(name);
    return NextResponse.json(record, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Name lookup failed." }, { status: 422, headers: { "Cache-Control": "no-store" } });
  }
}
