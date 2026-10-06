'use client';
import type { FormEvent } from 'react';
import type { OperationsCopy } from '@/lib/admin-i18n';
import type { Branch } from '@/lib/operations/types';
import { useOperationsRead } from './use-operations';
import type { Mutate } from './StockActions';
import { Field,FormActions,opsInput,Section } from './shared';

type Bootstrap = {branches:Branch[];settings:{users:Array<{id:string;email:string;role:string}>;members:Array<{user_id:string;email:string;role:string;branch_id:string|null;active:boolean}>;identifierStorageReady:boolean}};
export default function SettingsPanel({branchId,revision,copy,busy,mutate}: {branchId:string;revision:number;copy:OperationsCopy;busy:boolean;mutate:Mutate}) {
  const {data,error}=useOperationsRead<Bootstrap>('/api/admin/operations?view=bootstrap',revision);
  const submit=(action:string)=>async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=event.currentTarget;const body:Record<string,unknown>={action,branchId};
    for(const [key,value] of new FormData(form)) body[key]=String(value);
    if(await mutate(body)) form.reset();
  };
  return <div className="space-y-5">
    <Section title={copy.setup}><p className="text-sm leading-relaxed text-muted">{copy.setupNote}</p></Section>
    {error ? <p role="alert">{copy.failed}</p> : null}
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <Section title={copy.addShop}><form onSubmit={submit('branch')} className="grid gap-4">
        <Field label={copy.shopName}><input name="name" required maxLength={100} className={opsInput}/></Field>
        <Field label={copy.shopCode}><input name="code" required pattern="[a-z][a-z0-9-]{1,29}" maxLength={30} placeholder="hamburg-2" className={opsInput}/></Field>
        <Field label={copy.address}><input name="address" required maxLength={300} className={opsInput}/></Field>
        <FormActions copy={copy} busy={busy || !branchId} label={copy.addShop}/>
      </form></Section>
      <Section title={copy.staff}><p className="mb-4 text-sm leading-relaxed text-muted">{copy.permissions}</p>
        <form onSubmit={submit('member')} className="grid gap-4">
          <Field label={copy.user}><select name="userId" required defaultValue="" className={opsInput}><option value="">—</option>
            {data?.settings.users.map(user=><option key={user.id} value={user.id}>{user.email}</option>)}</select></Field>
          <Field label={copy.role}><select name="role" defaultValue="cashier" className={opsInput}><option value="cashier">{copy.cashier}</option><option value="owner">{copy.owner}</option></select></Field>
          <FormActions copy={copy} busy={busy || !branchId} label={copy.assign}/>
        </form>
        <ul className="mt-5 divide-y divide-border">{data?.settings.members.map(member=><li key={member.user_id} className="py-3 text-xs">
          <p className="break-all font-semibold">{member.email}</p><p className="mt-1 text-muted">{member.role==='owner' ? copy.owner : copy.cashier} · {data.branches.find(b=>b.id===member.branch_id)?.name ?? copy.allShops} · {member.active ? copy.available:copy.inactive}</p>
          {member.active && data.settings.users.find(user=>user.id===member.user_id)?.role!=='admin' ? <button type="button" className="mt-2 min-h-11 rounded-lg border border-border px-3 text-sm" disabled={busy} onClick={()=>void mutate({action:'member_revoke',branchId,userId:member.user_id})}>{copy.revoke}</button>:null}
        </li>)}</ul>
      </Section>
    </div>
  </div>;
}
