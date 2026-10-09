import {spawnSync as nativeSpawnSync} from 'node:child_process';

// Long retained histories exceed Windows argument limits. Send psql text via stdin.
export function runLocalProcess(executable,args,options={}) {
 const flag=args.findIndex(value=>value==='-c'||value==='-Atc');
 if(/(?:^|[\\/])docker(?:\.exe)?$/i.test(executable)&&args[0]==='exec'&&args.includes('psql')&&flag>=0){
  const input=args[flag+1],next=[...args.slice(0,flag),...(args[flag]==='-Atc'?['-At']:[]),...args.slice(flag+2)];
  if(typeof input!=='string')throw Error('Missing local SQL input');
  if(!next.includes('-i'))next.splice(1,0,'-i');
  return nativeSpawnSync(executable,next,{...options,input});
 }
 return nativeSpawnSync(executable,args,options);
}
