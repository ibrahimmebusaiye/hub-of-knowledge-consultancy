"use client";

import { BarChart3, Globe2, Inbox, LayoutDashboard, LogOut, Menu, MonitorSmartphone, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/locations", label: "Locations", icon: Globe2 },
  { href: "/admin/devices", label: "Devices", icon: MonitorSmartphone }
];

export default function AdminShell({ children, admin }: { children: ReactNode; admin: { name: string; email: string; role: string; mustChangePassword: boolean } }) {
  const pathname = usePathname(); const router = useRouter(); const [menuOpen, setMenuOpen] = useState(false);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="sidebar-top"><Link className="brand" href="/admin" onClick={() => setMenuOpen(false)} aria-label="Hub of Knowledge administration home"><div className="brand-mark" aria-hidden="true"><span className="knowledge-node node-one"/><span className="knowledge-node node-two"/><span className="knowledge-node node-three"/><span className="knowledge-core"/></div><div className="brand-copy"><strong>Hub of Knowledge</strong><span>Consultancy Administration</span></div></Link><button className="mobile-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="admin-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button></div>
        <nav id="admin-navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ href, label, icon: Icon }) => <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} onClick={() => setMenuOpen(false)} key={label}><Icon size={18} /> {label}</Link>)}
          <p className="nav-label">Account</p>
          {admin.role === "OWNER" && <Link className={`nav-item ${pathname === "/admin/users" ? "active" : ""}`} href="/admin/users" onClick={() => setMenuOpen(false)}><Users size={18} /> Administrators</Link>}
          <Link className={`nav-item ${pathname === "/admin/settings" ? "active" : ""}`} href="/admin/settings" onClick={() => setMenuOpen(false)}><Settings size={18} /> Settings</Link>
        </nav>
        <div className="sidebar-footer"><strong>{admin.name}</strong><span>{admin.email}</span><button onClick={logout}><LogOut size={15} /> Sign out</button></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
