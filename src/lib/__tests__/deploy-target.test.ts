import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
describe.skipIf(process.platform==='win32')('deployment forward-only guard',()=>{
  it('requires an explicit ref before fetching or building',()=>{
    const result=spawnSync('bash',[resolve('deployment/vps/scripts/deploy-app.sh')],{encoding:'utf8'});
    expect(result.status).toBe(1);expect(result.stdout+result.stderr).toContain('explicit git ref');expect(result.stdout+result.stderr).not.toContain('fetching origin');
  });
  it('allows same/forward releases; rejects rollback and divergence unless explicit',()=>{
    const dir=mkdtempSync(join(tmpdir(),'apfel-deploy-test-'));
    const git=(...args:string[])=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    try{
      git('init');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','base');const base=git('rev-parse','HEAD');
      git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','live');const live=git('rev-parse','HEAD');
      git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','next');const next=git('rev-parse','HEAD');
      const guard=(from:string,to:string,override='0')=>spawnSync('bash',[resolve('deployment/vps/scripts/check-deploy-target.sh'),dir,from,to],{encoding:'utf8',env:{...process.env,ALLOW_NON_FORWARD_DEPLOY:override}}).status;
      expect(guard(live,next)).toBe(0);expect(guard(live,live)).toBe(0);expect(guard(live,base)).toBe(1);expect(guard(live,base,'1')).toBe(0);expect(guard('',next)).toBe(0);
      git('checkout','-b','other',base);git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','divergent');expect(guard(live,git('rev-parse','HEAD'))).toBe(1);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });
});
