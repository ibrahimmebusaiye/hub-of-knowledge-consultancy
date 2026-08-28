import { ApiError } from "@/lib/api";

export type DateRange = { start: Date; end: Date; preset: string };

export function parseDateRange(params: URLSearchParams): DateRange {
  const preset = params.get("range") ?? "30d";
  const now = new Date();
  let start: Date;
  let end = addUtcDays(utcDay(now), 1);

  switch (preset) {
    case "today": start = utcDay(now); break;
    case "yesterday": start = addUtcDays(utcDay(now), -1); end = utcDay(now); break;
    case "7d": start = addUtcDays(utcDay(now), -6); break;
    case "30d": start = addUtcDays(utcDay(now), -29); break;
    case "month": start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); break;
    case "previous-month": start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)); end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); break;
    case "year": start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)); end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)); break;
    case "custom": {
      const from = params.get("from"); const to = params.get("to");
      if (!from || !to) throw new ApiError(422, "Custom ranges require both from and to dates.", "INVALID_DATE_RANGE");
      start = parseIsoDate(from); end = addUtcDays(parseIsoDate(to), 1);
      if (start >= end) throw new ApiError(422, "The selected date range is invalid.", "INVALID_DATE_RANGE");
      if ((end.getTime() - start.getTime()) / 86_400_000 > 732) throw new ApiError(422, "Custom ranges cannot exceed two years.", "DATE_RANGE_TOO_LARGE");
      break;
    }
    default: throw new ApiError(422, "Unknown date range.", "INVALID_DATE_RANGE");
  }

  return { start, end, preset };
}

function utcDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
function addUtcDays(date: Date, days: number) { return new Date(date.getTime() + days * 86_400_000); }
function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new ApiError(422, "Dates must use YYYY-MM-DD format.", "INVALID_DATE_RANGE");
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) throw new ApiError(422, "The selected date is invalid.", "INVALID_DATE_RANGE");
  return parsed;
}

export function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}
