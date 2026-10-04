import { readFile,writeFile,rename,stat,realpath,copyFile,chmod,chown,mkdir } from 'node:fs/promises';
import { randomBytes,randomUUID } from 'node:crypto';

const target='/srv/apfel-park/app/shared/app.env';
if(process.getuid?.()!==0) throw new Error('Run the operations environment setup as root');
if(await realpath(target)!==target) throw new Error('Unexpected environment-file target');
const original=await readFile(target,'utf8');
if(/^\s*(?:export\s+)?OPS_ASSET_ENCRYPTION_KEY=/m.test(original)) {
  process.stdout.write('Private identifier storage is already configured; existing key preserved\n');
} else {
  const metadata=await stat(target);const directory='/srv/backups/apfel-park-operations';await mkdir(directory,{recursive:true,mode:0o700});
  const backup=`${directory}/pre-operations-env-${Date.now()}.env`;
  await copyFile(target,backup);await chmod(backup,0o600);
  const temp=`${target}.ops-${randomUUID()}`;
  await writeFile(temp,`${original.trimEnd()}\nOPS_ASSET_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`,{mode:metadata.mode & 0o777,flag:'wx'});
  await chown(temp,metadata.uid,metadata.gid);
  if(await readFile(target,'utf8')!==original) throw new Error('Environment changed during setup; existing file preserved');
  await rename(temp,target);
  process.stdout.write('Private identifier encryption key configured; recoverable environment backup saved\n');
}
