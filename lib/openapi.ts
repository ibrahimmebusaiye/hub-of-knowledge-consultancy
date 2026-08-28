export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Hub of Knowledge Website API",
    version: "1.0.0",
    description: "Contact management, first-party website analytics and administration API. All timestamps are ISO 8601 and stored in UTC; reports use Africa/Freetown."
  },
  servers: [{ url: "/", description: "Current deployment" }],
  tags: [
    { name: "Public" }, { name: "Authentication" }, { name: "Messages" }, { name: "Analytics" }, { name: "Administration" }
  ],
  components: {
    securitySchemes: { adminSession: { type: "apiKey", in: "cookie", name: "hok_admin_session" } },
    schemas: {
      Error: { type: "object", properties: { success: { const: false }, error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } }, required: ["code", "message"] } }, required: ["success", "error"] },
      ContactInput: { type: "object", required: ["name", "email", "subject", "message"], properties: { name: { type: "string", minLength: 2, maxLength: 120 }, organisation: { type: "string", maxLength: 160 }, email: { type: "string", format: "email" }, phone: { type: "string", maxLength: 40 }, service: { type: "string", maxLength: 160 }, subject: { type: "string", minLength: 3, maxLength: 200 }, message: { type: "string", minLength: 10, maxLength: 5000 }, sessionId: { type: "string", format: "uuid" } } },
      MessageStatus: { type: "string", enum: ["NEW", "READ", "REPLIED", "ARCHIVED"] },
      DateRange: { type: "string", enum: ["today", "yesterday", "7d", "30d", "month", "previous-month", "year", "custom"] }
    }
  },
  paths: {
    "/api/contact": { post: { tags: ["Public"], summary: "Submit a contact enquiry", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ContactInput" } } } }, responses: { "201": { description: "Message saved" }, "422": { description: "Validation failure", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }, "429": { description: "Rate limited" } } } },
    "/api/analytics/track": { post: { tags: ["Public"], summary: "Record an anonymous page view", responses: { "204": { description: "Event accepted" } } } },
    "/api/auth/setup": { post: { tags: ["Authentication"], summary: "Create the one-time initial owner account", responses: { "201": { description: "Owner created" }, "409": { description: "Setup already completed" } } } },
    "/api/auth/login": { post: { tags: ["Authentication"], summary: "Create an administrator session", responses: { "200": { description: "Authenticated and secure cookie set" }, "401": { description: "Invalid credentials" }, "429": { description: "Rate limited" } } } },
    "/api/auth/logout": { post: { tags: ["Authentication"], summary: "Revoke the current session", security: [{ adminSession: [] }], responses: { "200": { description: "Signed out" } } } },
    "/api/auth/me": { get: { tags: ["Authentication"], summary: "Return the authenticated administrator", security: [{ adminSession: [] }], responses: { "200": { description: "Administrator profile" }, "401": { description: "Not authenticated" } } } },
    "/api/auth/change-password": { post: { tags: ["Authentication"], summary: "Change the current administrator password", security: [{ adminSession: [] }], responses: { "200": { description: "Password changed" } } } },
    "/api/messages": { get: { tags: ["Messages"], summary: "List and filter contact messages", security: [{ adminSession: [] }], parameters: [{ name: "status", in: "query", schema: { $ref: "#/components/schemas/MessageStatus" } }, { name: "search", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer", minimum: 1 } }], responses: { "200": { description: "Paginated messages" } } } },
    "/api/messages/{id}": { get: { tags: ["Messages"], summary: "Get one message", security: [{ adminSession: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Message details" }, "404": { description: "Not found" } } }, patch: { tags: ["Messages"], summary: "Update a message status", security: [{ adminSession: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Message updated" } } } },
    "/api/analytics/overview": analyticsPath("Dashboard totals and visitor trend"),
    "/api/analytics/visitors": analyticsPath("Visitor statistics and trend"),
    "/api/analytics/sources": analyticsPath("Referral source distribution"),
    "/api/analytics/locations": analyticsPath("Country distribution"),
    "/api/analytics/devices": analyticsPath("Device category distribution"),
    "/api/analytics/campaigns": analyticsPath("UTM campaign visitors and conversions"),
    "/api/admin/users": { get: { tags: ["Administration"], summary: "List administrators (owner only)", security: [{ adminSession: [] }], responses: { "200": { description: "Administrator list" } } }, post: { tags: ["Administration"], summary: "Create an administrator (owner only)", security: [{ adminSession: [] }], responses: { "201": { description: "Administrator created" } } } }
  }
} as const;

function analyticsPath(summary: string) {
  return { get: { tags: ["Analytics"], summary, security: [{ adminSession: [] }], parameters: [{ name: "range", in: "query", schema: { $ref: "#/components/schemas/DateRange", default: "30d" } }, { name: "from", in: "query", schema: { type: "string", format: "date" } }, { name: "to", in: "query", schema: { type: "string", format: "date" } }], responses: { "200": { description: "Analytics report" }, "401": { description: "Not authenticated" } } } } as const;
}
