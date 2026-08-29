import UsersManager from "@/components/users-manager";
import { requirePageAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
export const metadata = { title: "Administrators" };
export default async function UsersPage() { const admin = await requirePageAdmin(); if (admin.role !== "OWNER") redirect("/admin"); return <UsersManager/>; }
