import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ProductIntakeRedirectPage() {
  redirect("/admin/products?view=intake");
}
