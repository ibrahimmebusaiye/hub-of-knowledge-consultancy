import { AnalyticsEventType, MessageStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange } from "@/lib/reporting";

type TrendRow = { day: Date; visitors: bigint; sessions: bigint };
type ViewRow = { day: Date; page_views: bigint };

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request); const range = parseDateRange(request.nextUrl.searchParams);
    const [visitors, sessions, pageViews, contacts, unread, trendRows, viewRows] = await Promise.all([
      db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(DISTINCT visitor_id_hash) AS count FROM analytics_sessions WHERE first_seen_at >= ${range.start} AND first_seen_at < ${range.end}`),
      db.analyticsSession.count({ where: { firstSeenAt: { gte: range.start, lt: range.end } } }),
      db.analyticsEvent.count({ where: { eventType: AnalyticsEventType.PAGE_VIEW, createdAt: { gte: range.start, lt: range.end } } }),
      db.contactMessage.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
      db.contactMessage.count({ where: { status: MessageStatus.NEW } }),
      db.$queryRaw<TrendRow[]>(Prisma.sql`SELECT date_trunc('day', first_seen_at AT TIME ZONE 'Africa/Freetown') AS day, COUNT(DISTINCT visitor_id_hash) AS visitors, COUNT(*) AS sessions FROM analytics_sessions WHERE first_seen_at >= ${range.start} AND first_seen_at < ${range.end} GROUP BY 1 ORDER BY 1`),
      db.$queryRaw<ViewRow[]>(Prisma.sql`SELECT date_trunc('day', created_at AT TIME ZONE 'Africa/Freetown') AS day, COUNT(*) AS page_views FROM analytics_events WHERE event_type = 'PAGE_VIEW' AND created_at >= ${range.start} AND created_at < ${range.end} GROUP BY 1 ORDER BY 1`)
    ]);
    const viewsByDay = new Map(viewRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.page_views)]));
    const trend = trendRows.map((row) => ({ date: row.day.toISOString().slice(0, 10), visitors: Number(row.visitors), sessions: Number(row.sessions), pageViews: viewsByDay.get(row.day.toISOString().slice(0, 10)) ?? 0 }));
    return noStoreJson({ success: true, data: { range, visitors: Number(visitors[0]?.count ?? 0), sessions, pageViews, contacts, unreadMessages: unread, conversionRate: sessions ? Math.round((contacts / sessions) * 1000) / 10 : 0, trend } });
  } catch (error) { return apiError(error); }
}
