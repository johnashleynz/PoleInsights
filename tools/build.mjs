import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const args of [['node_modules/typescript/bin/tsc','--project','tsconfig.json'],['--experimental-strip-types','verification/verify.mjs'],['--experimental-strip-types','verification/p03-voids.mjs'],['--experimental-strip-types','verification/p05/verify.mjs'],['--experimental-strip-types','verification/p05/field-checks.mjs'],['--experimental-strip-types','verification/p06/verify.mjs'],['--experimental-strip-types','verification/p07/verify.mjs'],['--experimental-strip-types','verification/p08.mjs'],['--experimental-strip-types','verification/p09.mjs'],['--experimental-strip-types','verification/p10.mjs'],['--experimental-strip-types','verification/p11.mjs'],['--experimental-strip-types','verification/p11-footing.mjs'],['--experimental-strip-types','verification/p12.mjs'],['--experimental-strip-types','verification/p13.mjs'],['--experimental-strip-types','verification/p14.mjs'],['--experimental-strip-types','verification/p15.mjs'],['--experimental-strip-types','verification/p16.mjs'],['--experimental-strip-types','verification/p18.mjs'],['--experimental-strip-types','verification/p19.mjs'],['--experimental-strip-types','verification/p21.mjs'],['--experimental-strip-types','verification/p22.mjs'],['--experimental-strip-types','verification/p23.mjs'],['--experimental-strip-types','verification/p24.mjs'],['--experimental-strip-types','verification/p25.mjs'],['--experimental-strip-types','tools/verify_p26.mjs'],['node_modules/vite/bin/vite.js','build','--configLoader','runner']]){
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.status!==0)process.exit(result.status??1);
}
console.log('Review build ready in dist/. Serve over HTTP; no deployment has been performed.');

