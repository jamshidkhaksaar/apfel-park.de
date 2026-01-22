import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminProvider } from "@/lib/admin-context";

export const metadata: Metadata = {
  title: "Admin | Apfel Park",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}
