const KEY='pole-lab-safe2climb-p23';
export function load(){try{return JSON.parse(sessionStorage.getItem(KEY))||{draft:null,records:[],outbox:[]};}catch{return {draft:null,records:[],outbox:[]};}}
export function persist(data){sessionStorage.setItem(KEY,JSON.stringify(data));}
export function queue(data,record){if(data.records.some(r=>r.id===record.id))throw Error('This inspection is already recorded.');data.records.push(structuredClone(record));data.outbox.push({id:record.id,at:new Date().toISOString(),state:'Pending backend connection',notification:record.signed.decision==='climb'?'Not requested':'Pending supervisor / asset owner routing'});data.draft=null;persist(data);}
