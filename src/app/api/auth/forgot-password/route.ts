export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateOTP } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, email, phone")
      .eq("email", trimmedEmail)
      .single();

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const otp = generateOTP(trimmedEmail);

    // In production, send OTP via SMS/email service
    // For demo, we return masked info and include OTP in dev mode
    const maskedPhone = user.phone
      ? user.phone.replace(/\d(?=\d{3})/g, "*")
      : null;
    const maskedEmail = trimmedEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskedEmail}${maskedPhone ? ` and ${maskedPhone}` : ""}`,
      // Include OTP in response for demo/testing — remove in production
      _demo_otp: otp,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
