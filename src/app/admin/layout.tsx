import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminProvider } from "@/lib/admin-context";
import { readSessionUser } from "@/lib/session";

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

  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}
