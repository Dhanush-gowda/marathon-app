export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { parseTicketPayload, getNextBibNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, qrCode } = body;

    let resolvedUserId = userId;

    if (!resolvedUserId && qrCode) {
      const parsedTicket = parseTicketPayload(qrCode);

      if (!parsedTicket) {
        return NextResponse.json({ error: "Invalid QR ticket" }, { status: 400 });
      }

      resolvedUserId = parsedTicket.id;
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: "userId or qrCode is required" }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, bib_number, categories, checkin_status")
      .eq("id", resolvedUserId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // If user has no BIB yet, assign one now (payment confirmed by admin)
    let assignedBib = user.bib_number;
    if (!assignedBib) {
      const { data: allUsers } = await supabaseAdmin
        .from("users")
        .select("id, bib_number");
      assignedBib = getNextBibNumber(allUsers || []);
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ checkin_status: true, bib_number: assignedBib })
      .eq("id", resolvedUserId);

    if (error) {
      console.error("Check-in error:", error);
      return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        bib_number: assignedBib,
        checkin_status: true,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
