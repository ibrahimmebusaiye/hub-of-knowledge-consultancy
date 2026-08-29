import { describe, expect, it } from "vitest";
import { contactSchema, createAdminSchema } from "../lib/validation";

describe("contact validation", () => {
  it("accepts the complete public form", () => expect(contactSchema.safeParse({ name: "Jane Doe", email: "JANE@example.com", subject: "Training enquiry", message: "Please share the available training dates.", organisation: "Example", phone: "+232 00 000 000", service: "training", website: "" }).success).toBe(true));
  it("rejects short messages", () => expect(contactSchema.safeParse({ name: "Jane Doe", email: "jane@example.com", subject: "Hello", message: "Short" }).success).toBe(false));
});

describe("administrator validation", () => {
  it("requires a strong temporary password", () => expect(createAdminSchema.safeParse({ name: "Admin User", email: "admin@example.com", password: "weakpassword", role: "ADMIN" }).success).toBe(false));
  it("accepts a strong temporary password", () => expect(createAdminSchema.safeParse({ name: "Admin User", email: "admin@example.com", password: "Strong!Password2026", role: "ADMIN" }).success).toBe(true));
});
