import { NextRequest, NextResponse } from "next/server";
import { AnalyticsEventType } from "@prisma/client";
import { db } from "@/lib/db";
import { analyticsEventSchema } from "@/lib/validation";
import { classifySource, countryDetails, parseDevice, referrerDomain } from "@/lib/analytics";
import { sha256 } from "@/lib/security";
import { apiError } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { isTrustedMutation } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const input = analyticsEventSchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent");
    if (/bot|crawler|spider|preview|headless/i.test(userAgent ?? "")) return new NextResponse(null, { status: 204 });

    const sessionIdHash = sha256(input.sessionId);
    const visitorIdHash = sha256(input.visitorId);
    const device = parseDevice(userAgent);
    const country = countryDetails(request.headers.get("x-vercel-ip-country"));
    const source = classifySource(input.referrer, input.utmSource);
    const existing = await db.analyticsSession.findUnique({ where: { sessionIdHash }, select: { id: true } });

    const session = existing
      ? await db.analyticsSession.update({ where: { sessionIdHash }, data: { lastSeenAt: new Date() }, select: { id: true } })
      : await db.analyticsSession.create({ data: {
          sessionIdHash, visitorIdHash, landingPage: input.page, source, referrerDomain: referrerDomain(input.referrer), ...country, ...device,
          utmSource: input.utmSource || null, utmMedium: input.utmMedium || null, utmCampaign: input.utmCampaign || null,
          utmContent: input.utmContent || null, utmTerm: input.utmTerm || null
        }, select: { id: true } });

    await db.analyticsEvent.createMany({ data: [
      ...(!existing ? [{ sessionId: session.id, eventType: AnalyticsEventType.SESSION_START, page: input.page, pageTitle: input.pageTitle || null }] : []),
      { sessionId: session.id, eventType: AnalyticsEventType.PAGE_VIEW, page: input.page, pageTitle: input.pageTitle || null }
    ] });
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
