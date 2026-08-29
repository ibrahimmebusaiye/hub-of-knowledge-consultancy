import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "REQUEST_ERROR") {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Please check the submitted information.", fields: error.flatten().fieldErrors }
    }, { status: 422 });
  }

  const databaseCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (databaseCode === "P2002") return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "A record with those details already exists." } }, { status: 409 });
  if (databaseCode === "P2025") return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "The requested record was not found." } }, { status: 404 });

  console.error("Unhandled API error", error);
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }, { status: 500 });
}

export function noStoreJson<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
