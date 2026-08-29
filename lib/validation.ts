import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  organisation: optionalText(160),
  email: z.email().trim().toLowerCase().max(320),
  phone: optionalText(40),
  service: optionalText(160),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
  sessionId: z.uuid().optional(),
  website: optionalText(100)
}).strict();

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(320),
  password: z.string().min(10).max(200)
}).strict();

export const setupSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(120),
  password: strongPassword(),
  setupToken: z.string().min(32).max(300)
}).strict();

export const analyticsEventSchema = z.object({
  visitorId: z.uuid(),
  sessionId: z.uuid(),
  page: z.string().trim().min(1).max(500),
  pageTitle: optionalText(300),
  referrer: optionalText(1000),
  utmSource: optionalText(160),
  utmMedium: optionalText(160),
  utmCampaign: optionalText(200),
  utmContent: optionalText(200),
  utmTerm: optionalText(200)
}).strict();

export const messageStatusSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"])
}).strict();

export const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(320),
  password: strongPassword(),
  role: z.enum(["OWNER", "ADMIN"]).default("ADMIN")
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(10).max(200),
  newPassword: strongPassword()
}).strict().refine((value) => value.currentPassword !== value.newPassword, { message: "The new password must be different.", path: ["newPassword"] });

function strongPassword() {
  return z.string().min(12).max(200)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number.")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character.");
}
