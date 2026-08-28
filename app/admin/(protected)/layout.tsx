import { requirePageAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePageAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
