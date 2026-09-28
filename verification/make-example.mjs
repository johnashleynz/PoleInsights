import {writeFileSync} from 'node:fs';
import {defaultCase,newRegion} from '../src/domain/model.ts';
const a=defaultCase('A'),b=defaultCase('B');
b.regions=[newRegion(b)];
writeFileSync(new URL('../data/cases/sound-and-decayed.json',import.meta.url),JSON.stringify({format:'innerview-pole-lab',version:1,cases:[a,b],view:'Innerview',section:.4,sections:[.4,.4],active:1,compare:true,qualification:'Synthetic example. Illustrative properties. No device measurements.'},null,2));
