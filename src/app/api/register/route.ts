export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { buildTicketPayload, getNextBibNumber } from "@/lib/utils";
import { hashPassword, createUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, category, password } = body;

    if (!name || !email || !phone || !category || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check for duplicate registration
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    const { data: existingUsers } = await supabaseAdmin
      .from("users")
      .select("bib_number");

    const bibNumber = getNextBibNumber(existingUsers || []);

    // Insert participant
    const password_hash = hashPassword(password);

    const { data, error } = await supabaseAdmin.from("users").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      category,
      bib_number: bibNumber,
      password_hash,
    }).select().single();

    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    const token = createUserToken(data.id, data.email);

    return NextResponse.json(
      {
        success: true,
        token,
        user: { id: data.id, name: data.name, email: data.email, phone: data.phone, category: data.category, bib_number: data.bib_number },
        ticketPayload: buildTicketPayload(data),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
