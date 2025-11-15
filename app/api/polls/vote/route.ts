import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, getPoll } from "@/lib/database";
import { supabaseConfig } from "@/lib/config";

type VoteBody = {
  pollId: string;
  optionIds: string[];
};

export async function POST(request: NextRequest) {
  try {
    // Auth: require Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as VoteBody;
    const { pollId, optionIds } = body;

    if (!pollId || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "pollId and optionIds are required" },
        { status: 400 }
      );
    }

    // Create a token-bound client so RLS uses auth.uid()
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, detectSessionInUrl: false },
    });

    // Use transactional RPC to cast votes under RLS and server-side validations
    const { error: voteErr } = await client.rpc('cast_vote_tx', {
      poll_uuid: pollId,
      option_ids: optionIds,
    });

    if (voteErr) {
      return NextResponse.json(
        { success: false, error: voteErr.message || "Failed to cast vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded",
    });
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
