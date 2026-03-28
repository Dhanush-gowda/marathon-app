export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyOTP, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!verifyOTP(trimmedEmail, otp)) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const password_hash = hashPassword(newPassword);
    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash })
      .eq("email", trimmedEmail);

    if (error) {
      console.error("Reset password error:", error);
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
