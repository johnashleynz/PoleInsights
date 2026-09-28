export const OUTCOMES={accepted:'No concerns identified',repeat:'Retest 100mm higher',inconclusive:'Concern identified, do not climb'};
export const REASONS=[
 {group:'Pole & crossarm condition',items:[['base','Debris / vegetation around pole base'],['damage','Rot or damage (vehicle, fire, storm etc.)'],['fittings','Loose fittings at the pole top']]},
 {group:'Pole loading',items:[['conductors','Unusually tight or slack conductors (including service mains)'],['lean','Pole leaning / moved in ground'],['guys','Guy wires tight or slack']]},
 {group:'Pole setting',items:[['embedment','Embedment depth not satisfactory'],['soil','Poor soil compaction'],['level','Change in ground level (erosion or excavation)'],['reinforcing','Unstable pole reinforcing']]},
 {group:'Sounding',items:[['sounding','Abnormal sound or rebound when hammering']]},
 {group:'Movement',items:[['movement','Pole moves when pushed']]},
 {group:'Concrete condition',items:[['spalling','Spalling'],['cracking','Cracking'],['concrete-damage','Impact / other damage'],['rust','Rust staining']]},
 {group:'Steel condition',items:[['corrosion','Corrosion / loss of metal'],['steel-damage','Damage or deformation'],['fixings','Loose / damaged base bolts, nuts or welds']]},
 {group:'Composite condition',items:[['composite-cracks','Cracking / delamination'],['uv','Discolouration / UV damage'],['attachment-damage','Damage at attachment points']]},
 {group:'Other',items:[['other','Other concern / unable to assess']]}
];
export const reasonText=id=>REASONS.flatMap(g=>g.items).find(i=>i[0]===id)?.[1]||id;
export const latestScan=r=>r.scans.at(-1)||null;
export const leanNeeded=r=>Object.values(r.answers).some(a=>a.reasons?.includes('lean'));
export const hasIdPhoto=r=>r.photos.some(p=>p.category==='Pole ID'&&p.assetId===r.asset.id);
export function reasonsFor(check,material){const groups={visual:['Pole & crossarm condition','Pole loading'],setting:['Pole setting'],deflection:['Movement'],material:material==='Wood'?['Pole & crossarm condition','Sounding']:material==='Concrete'?['Concrete condition']:material==='Steel'?['Steel condition']:['Composite condition'],below:['Pole setting','Pole & crossarm condition'],drill:['Pole & crossarm condition','Sounding'],loading:['Pole loading']}[check]||[];return REASONS.filter(g=>groups.includes(g.group)||g.group==='Other').map(g=>({...g,items:g.items.filter(([id])=>!(check==='visual'&&id==='base')&&!(['material','below','drill'].includes(check)&&id==='fittings')).map(([id,text])=>[id,id==='damage'&&material!=='Wood'?'Damage (vehicle, fire, storm etc.)':text])}));}
export function scanInputs(r,values){const previous=latestScan(r),height=previous?.quality==='repeat'?previous.scanHeight+100:Number(values.scanHeight),circ=Number(values.size)*(values.sizeMode==='diameter'?Math.PI:1);if(!String(values.species||'').trim()||!Number.isFinite(circ)||circ<300||circ>1800||!Number.isFinite(height)||height< -1000||height>3000)throw Error('Enter species, pole size and a valid scan height.');return {species:String(values.species),circumference:circ,scanHeight:height,sizeMode:values.sizeMode||'circumference'};}
export function imageLean(base,top,width,height){if(!base||!top||![base.x,base.y,top.x,top.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Mark the base and top.');const dx=(top.x-base.x)*width,dy=(base.y-top.y)*height;if(dy<height*.15)throw Error('Mark the top clearly above the base.');return Math.atan2(Math.abs(dx),dy)*180/Math.PI;}
