import { NextRequest } from "next/server";
import { apiError, noStoreJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try { return noStoreJson({ success: true, data: await requireAdmin(request) }); }
  catch (error) { return apiError(error); }
}
