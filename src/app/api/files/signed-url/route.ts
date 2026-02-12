import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, file_path, action } = body;

    if (!bucket || !file_path) {
      return NextResponse.json(
        { error: "bucket and file_path are required" },
        { status: 400 }
      );
    }

    if (!["reports", "assets"].includes(bucket)) {
      return NextResponse.json(
        { error: "Invalid bucket" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, client_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Authorization check
    if (profile.role === "client") {
      // Verify file belongs to their client
      const table = bucket === "reports" ? "reports" : "assets";
      const { data: fileRecord } = await supabase
        .from(table)
        .select("id, client_id")
        .eq("file_path", file_path)
        .eq("client_id", profile.client_id!)
        .single();

      if (!fileRecord) {
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 403 }
        );
      }
    } else if (profile.role === "admin") {
      // Admin: verify file exists
      const table = bucket === "reports" ? "reports" : "assets";
      const serviceClient = await createServiceClient();
      const { data: fileRecord } = await serviceClient
        .from(table)
        .select("id")
        .eq("file_path", file_path)
        .single();

      if (!fileRecord) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
    }

    // Generate signed URL using service client
    const serviceClient = await createServiceClient();
    const { data: signedUrlData, error: signedUrlError } =
      await serviceClient.storage
        .from(bucket)
        .createSignedUrl(file_path, SIGNED_URL_EXPIRY, {
          download: action === "download",
        });

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json(
        { error: "Failed to create signed URL" },
        { status: 500 }
      );
    }

    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      expiresAt,
    });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
