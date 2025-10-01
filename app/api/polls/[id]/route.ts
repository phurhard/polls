import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/config";
import { ApiResponse, UpdatePollData } from "@/types";

/**
 * Update a poll (only creator can update via RLS).
 * NOTE: This endpoint does not modify options. Options editing would require
 * dedicated logic to add/remove/update poll_options rows safely.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" } as ApiResponse<null>,
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
        { success: false, error: "Invalid or expired token" } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body: UpdatePollData = await request.json();

    // Build updates map (convert camelCase to snake_case for DB)
    const updates: Record<string, any> = {};

    if (typeof body.title !== "undefined") {
      if (!body.title || !body.title.trim()) {
        return NextResponse.json(
          { success: false, error: "Poll title cannot be empty" } as ApiResponse<null>,
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (typeof body.description !== "undefined") {
      updates.description = body.description?.trim() || null;
    }

    if (typeof body.isActive !== "undefined") {
      updates.is_active = !!body.isActive;
    }

    if (typeof body.expiresAt !== "undefined") {
      if (body.expiresAt) {
        const dt = new Date(body.expiresAt);
        if (Number.isNaN(dt.getTime())) {
          return NextResponse.json(
            { success: false, error: "Invalid expiresAt date" } as ApiResponse<null>,
            { status: 400 }
          );
        }
        // Allow setting past to immediately expire; if you prefer future-only, enforce here
        updates.expires_at = dt;
      } else {
        // Clear expiration
        updates.expires_at = null;
      }
    }

    if (typeof body.categoryId !== "undefined") {
      updates.category_id = body.categoryId || null;
    }

    // If nothing to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Token-bound client so RLS sees auth.uid()
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, detectSessionInUrl: false },
    });

    const { data: updated, error: updateError } = await client
      .from("polls")
      .update(updates)
      .eq("id", pollId)
      .eq("creator_id", user.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to update poll" } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Poll updated successfully",
      } as ApiResponse<typeof updated>
    );
  } catch (error) {
    console.error("Update poll API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * Delete a poll (only creator can delete via RLS).
 * Cascades to options and votes via FK constraints.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" } as ApiResponse<null>,
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
        { success: false, error: "Invalid or expired token" } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, detectSessionInUrl: false },
    });

    const { error: delError } = await client
      .from("polls")
      .delete()
      .eq("id", pollId)
      .eq("creator_id", user.id);

    if (delError) {
      return NextResponse.json(
        { success: false, error: delError.message || "Failed to delete poll" } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Poll deleted successfully" } as ApiResponse<null>
    );
  } catch (error) {
    console.error("Delete poll API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
