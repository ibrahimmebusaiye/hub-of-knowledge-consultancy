"use client";

import { BarChart3, Globe2, Inbox, LayoutDashboard, LogOut, MonitorSmartphone, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/locations", label: "Locations", icon: Globe2 },
  { href: "/admin/devices", label: "Devices", icon: MonitorSmartphone }
];

export default function AdminShell({ children, admin }: { children: ReactNode; admin: { name: string; email: string; role: string; mustChangePassword: boolean } }) {
  const pathname = usePathname(); const router = useRouter();
  useEffect(() => { if (admin.mustChangePassword && pathname !== "/admin/settings") router.replace("/admin/settings?password=required"); }, [admin.mustChangePassword, pathname, router]);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" href="/admin" aria-label="Hub of Knowledge administration home"><div className="brand-mark"><ShieldCheck size={25} strokeWidth={2.2} aria-hidden="true" /></div><div className="brand-copy"><strong>Hub of Knowledge</strong><span>Consultancy Administration</span></div></Link>
        <nav>
          <p className="nav-label">Workspace</p>
          {navigation.map(({ href, label, icon: Icon }) => <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={label}><Icon size={18} /> {label}</Link>)}
          <p className="nav-label">Account</p>
          {admin.role === "OWNER" && <Link className={`nav-item ${pathname === "/admin/users" ? "active" : ""}`} href="/admin/users"><Users size={18} /> Administrators</Link>}
          <Link className={`nav-item ${pathname === "/admin/settings" ? "active" : ""}`} href="/admin/settings"><Settings size={18} /> Settings</Link>
        </nav>
        <div className="sidebar-footer"><strong>{admin.name}</strong><span>{admin.email}</span><button onClick={logout}><LogOut size={15} /> Sign out</button></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
