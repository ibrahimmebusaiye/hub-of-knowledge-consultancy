"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Search, X } from "lucide-react";

type Status = "NEW" | "READ" | "REPLIED" | "ARCHIVED";
type MessageSummary = { id: string; name: string; email: string; organisation?: string; subject: string; service?: string; status: Status; createdAt: string };
type Message = MessageSummary & { phone?: string; message: string; analyticsSession?: { source: string; countryName?: string; deviceCategory: string; utmCampaign?: string } };

export default function MessagesManager() {
  const [items, setItems] = useState<MessageSummary[]>([]); const [status, setStatus] = useState(""); const [search, setSearch] = useState(""); const [selected, setSelected] = useState<Message | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const query = new URLSearchParams({ pageSize: "100" }); if (status) query.set("status", status); if (search) query.set("search", search); const body = await fetch(`/api/messages?${query}`).then((r) => r.json()); setItems(body.data?.items ?? []); setLoading(false); }, [status, search]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  async function open(id: string) { const body = await fetch(`/api/messages/${id}`).then((r) => r.json()); if (!body.data) return; setSelected(body.data); if (body.data.status === "NEW") await updateStatus(id, "READ", false); }
  async function updateStatus(id: string, next: Status, refresh = true) { await fetch(`/api/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); setItems((current) => current.map((item) => item.id === id ? { ...item, status: next } : item)); setSelected((current) => current?.id === id ? { ...current, status: next } : current); if (refresh) await load(); }

  return <>
    <header className="topbar"><div><p className="eyebrow">Client enquiries</p><h1>Contact messages</h1><p className="subtitle">Review and manage messages submitted through the website.</p></div></header>
    <section className="panel table-panel">
      <div className="toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or subject" aria-label="Search messages"/></label><select className="date-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="NEW">New</option><option value="READ">Read</option><option value="REPLIED">Replied</option><option value="ARCHIVED">Archived</option></select></div>
      <div className="table-scroll"><table><thead><tr><th>Sender</th><th>Subject</th><th>Area of interest</th><th>Status</th><th>Received</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} onClick={() => open(item.id)} tabIndex={0}><td><strong>{item.name}</strong><small>{item.email}</small></td><td>{item.subject}</td><td>{item.service || "—"}</td><td><StatusBadge status={item.status}/></td><td>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Freetown" }).format(new Date(item.createdAt))}</td></tr>)}</tbody></table></div>
      {!items.length && <div className="empty-state large">{loading ? "Loading messages…" : "No messages match this view."}</div>}
    </section>
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="message-drawer" onClick={(event) => event.stopPropagation()}><button className="icon-button close" onClick={() => setSelected(null)} aria-label="Close message"><X/></button><p className="eyebrow">Message details</p><h2>{selected.subject}</h2><div className="sender-card"><div className="sender-avatar">{selected.name.slice(0, 1).toUpperCase()}</div><div><strong>{selected.name}</strong><a href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone && <a href={`tel:${selected.phone}`}>{selected.phone}</a>}</div></div><dl className="message-meta"><div><dt>Organisation</dt><dd>{selected.organisation || "—"}</dd></div><div><dt>Area of interest</dt><dd>{selected.service || "—"}</dd></div><div><dt>Source</dt><dd>{selected.analyticsSession?.source || "Unknown"}</dd></div><div><dt>Country</dt><dd>{selected.analyticsSession?.countryName || "Unknown"}</dd></div></dl><div className="message-body">{selected.message}</div><label className="status-control">Message status<select value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value as Status)}><option value="NEW">New</option><option value="READ">Read</option><option value="REPLIED">Replied</option><option value="ARCHIVED">Archived</option></select></label><a className="primary-action" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}><Mail size={17}/> Reply using email</a></aside></div>}
  </>;
}

function StatusBadge({ status }: { status: Status }) { return <span className={`status-badge ${status.toLowerCase()}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>; }
