import { createRoot } from 'react-dom/client';
import { AdminProvider } from '../src/lib/admin-context';
import OperationsWorkspace from '../src/components/admin/operations/OperationsWorkspace';

const owner=new URL(window.location.href).searchParams.get('role')!=='cashier';
const branches=[{id:'00000000-0000-4000-8000-000000000001',code:'main',name:'Hamburg-Wilhelmsburg',address:'Synthetic test address',active:true},
  {id:'00000000-0000-4000-8000-000000000002',code:'second',name:'Zweite Filiale (Test)',address:'Synthetic test address',active:true}];
const root=document.getElementById('root');
if(root) createRoot(root).render(<AdminProvider user={{email:'fixture@example.invalid',role:owner?'admin':'cashier'}}>
  <OperationsWorkspace owner={owner} branches={owner ? branches:[branches[0]]} initialBranchId={owner ? null : branches[0].id}
    initialView={new URL(window.location.href).searchParams.get('view') ?? undefined} initialFilter={new URL(window.location.href).searchParams.get('filter') ?? undefined}/>
</AdminProvider>);
