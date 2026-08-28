import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminProvider } from "@/lib/admin-context";
import { readSessionUser } from "@/lib/session";
import { canAccessAdmin, canAccessAdminPath, getUserRoleString } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin | Apfel Park",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await readSessionUser();
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  if (!canAccessAdmin(user)) redirect("/login?error=forbidden");
  const pathname = (await headers()).get("x-apfel-pathname") ?? "/admin";
  if (!canAccessAdminPath(user, pathname)) redirect("/admin?error=forbidden");
  const role = getUserRoleString(user);
  if (!role) redirect("/login?error=forbidden");

  return (
    <AdminProvider user={{ email: user.email, role }}>
      {children}
    </AdminProvider>
  );
}
