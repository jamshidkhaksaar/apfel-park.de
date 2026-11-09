import AdminShell from '@/components/admin/AdminShell';
import OperationsWorkspace from '@/components/admin/operations/OperationsWorkspace';
import UnderConstruction from '@/components/admin/UnderConstruction';
import { readSessionUser } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';
import { operationsBranches } from '@/lib/operations/read';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { operationsDictionary } from '@/lib/admin-i18n';
import { TILL_INVENTORY_UNDER_CONSTRUCTION } from '@/lib/admin-maintenance';

export const dynamic='force-dynamic';
export default async function OperationsPage({searchParams}: {searchParams:Promise<{view?:string;filter?:string;branchId?:string}>}) {
  const locale=await getAdminLocale();
  if (TILL_INVENTORY_UNDER_CONSTRUCTION) return <AdminShell title={locale==='de' ? 'Kasse & Lager' : 'Till & Inventory'}><UnderConstruction locale={locale}/></AdminShell>;
  const access=await getOperationsAccess(await readSessionUser());
  if (!access) return <AdminShell title="Kasse & Lager"><p role="alert" className="p-5 text-sm">Für dieses Konto wurde noch kein Filialzugriff eingerichtet. Bitte wenden Sie sich an den Inhaber.</p></AdminShell>;
  const [branches,params]=await Promise.all([operationsBranches(access),searchParams]);
  return <AdminShell title={operationsDictionary[locale].title}>
    <OperationsWorkspace owner={access.owner} branches={branches} initialBranchId={access.owner && branches.some(branch=>branch.id===params.branchId) ? params.branchId!:access.branchId} initialView={params.view} initialFilter={params.filter}/>
  </AdminShell>;
}
