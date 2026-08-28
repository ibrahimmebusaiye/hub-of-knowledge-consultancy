"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Overview = { visitors: number; sessions: number; pageViews: number; contacts: number; unreadMessages: number; conversionRate: number; trend: Array<{ date: string; visitors: number; sessions: number; pageViews: number }> };
type Source = { source: string; visitors: number; percentage: number };

export default function DashboardOverview() {
  const [range, setRange] = useState("30d"); const [overview, setOverview] = useState<Overview | null>(null); const [sources, setSources] = useState<Source[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; setError(""); Promise.all([
    fetch(`/api/analytics/overview?range=${range}`).then((r) => r.json()),
    fetch(`/api/analytics/sources?range=${range}`).then((r) => r.json())
  ]).then(([overviewBody, sourceBody]) => { if (!active) return; if (!overviewBody.success) throw new Error(overviewBody.error?.message); setOverview(overviewBody.data); setSources(sourceBody.data ?? []); }).catch((reason) => setError(reason.message ?? "Analytics could not be loaded.")); return () => { active = false; }; }, [range]);

  return <>
    <header className="topbar"><div><p className="eyebrow">Performance overview</p><h1>Website overview</h1><p className="subtitle">Website activity and enquiries at a glance.</p></div><RangeSelect value={range} onChange={setRange} /></header>
    {error && <div className="notice error" role="alert">{error}</div>}
    <section className="stat-grid" aria-label="Key website statistics">
      <Stat label="Unique visitors" value={overview?.visitors} note={`${overview?.sessions ?? 0} sessions`} />
      <Stat label="Page views" value={overview?.pageViews} note="Tracked page loads" />
      <Stat label="Contact messages" value={overview?.contacts} note={`${overview?.unreadMessages ?? 0} awaiting review`} />
      <Stat label="Conversion rate" value={overview ? `${overview.conversionRate}%` : undefined} note="Sessions that enquired" />
    </section>
    <section className="dashboard-grid">
      <article className="panel"><div className="panel-head"><div><h2>Visitor trend</h2><p className="panel-note">Unique visitors and page views</p></div></div><div className="chart-area">{overview ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={overview.trend}><defs><linearGradient id="visitorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={.35}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="pageViews" stroke="#f4b41a" fillOpacity={0}/><Area type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2} fill="url(#visitorFill)"/></AreaChart></ResponsiveContainer> : <Loading />}</div></article>
      <article className="panel"><div className="panel-head"><div><h2>Traffic sources</h2><p className="panel-note">How visitors found the website</p></div></div><div className="source-list">{sources.length ? sources.slice(0, 6).map((item) => <div className="source-row" key={item.source}><span>{item.source}</span><div className="track"><div className="fill" style={{ width: `${item.percentage}%` }}/></div><span>{item.percentage}%</span></div>) : <Empty text="No source data for this period." />}</div></article>
    </section>
  </>;
}

export function RangeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const today = new Date().toISOString().slice(0, 10); const monthAgo = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  const params = new URLSearchParams(value.includes("&") ? value : `range=${value}`); const preset = value.split("&")[0]; const from = params.get("from") ?? monthAgo; const to = params.get("to") ?? today;
  function custom(nextFrom: string, nextTo: string) { onChange(`custom&from=${nextFrom}&to=${nextTo}`); }
  return <div className="date-filter-group"><select className="date-filter" value={preset} onChange={(event) => event.target.value === "custom" ? custom(from, to) : onChange(event.target.value)}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="previous-month">Previous month</option><option value="year">This year</option><option value="custom">Custom range</option></select>{preset === "custom" && <><input className="date-filter" type="date" value={from} max={to} onChange={(event) => custom(event.target.value, to)} aria-label="Report start date"/><input className="date-filter" type="date" value={to} min={from} max={today} onChange={(event) => custom(from, event.target.value)} aria-label="Report end date"/></>}</div>;
}
function Stat({ label, value, note }: { label: string; value?: string | number; note: string }) { return <article className="stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value ?? "—"}</p><span className="stat-change neutral">{note}</span></article>; }
export function Loading() { return <div className="loading-state">Loading…</div>; }
export function Empty({ text }: { text: string }) { return <div className="empty-state">{text}</div>; }
