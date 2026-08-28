import AdminShell from "@/components/admin/AdminShell";
import AdminTradeInManager, { type TradeInAdminRow } from "@/components/admin/AdminTradeInManager";
import { notFound } from "next/navigation";
import { canManageOrders } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import { readSessionUser } from "@/lib/session";

export const dynamic="force-dynamic";
export default async function AdminTradeInsPage(){const [locale,user]=await Promise.all([getAdminLocale(),readSessionUser()]);if(!canManageOrders(user))notFound();const result=await query(`SELECT id,status,customer_name,email,phone,locale,device,condition_notes,image_urls,quote_amount,admin_note,created_at FROM trade_in_requests ORDER BY created_at DESC LIMIT 250`);return <AdminShell title={locale==="de"?"Trade-in Anfragen":"Trade-in requests"}><div className="mx-auto w-full max-w-[1500px]"><p className="mb-5 text-sm text-muted">{locale==="de"?"Fotos prüfen, unverbindliches Angebot hinterlegen und Status verwalten.":"Review photos, add a non-binding quote and manage status."}</p><AdminTradeInManager initial={result.rows as TradeInAdminRow[]} locale={locale}/></div></AdminShell>}
