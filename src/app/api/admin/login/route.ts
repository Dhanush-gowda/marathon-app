export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createToken, getAdminCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const adminCredentials = getAdminCredentials();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (normalizedEmail !== adminCredentials.email || password !== adminCredentials.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = createToken();

    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
