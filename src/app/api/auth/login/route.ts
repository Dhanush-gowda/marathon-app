export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createUserToken, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email, password_hash")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.password_hash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createUserToken(user.id, user.email);
    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
