export function recordHandover(db,id,{recipient,method,note}){
 const record=db.records.find(r=>r.id===id);if(!record?.signed)throw Error('Select a signed inspection.');
 if(!recipient?.trim()||!method?.trim()||!note?.trim())throw Error('Record who was contacted, how, and the agreed action.');
 db.followups??=[];
 const entry={id:crypto.randomUUID(),inspectionId:id,at:new Date().toISOString(),actor:record.inspector.id,recipient:recipient.trim(),method:method.trim(),note:note.trim(),source:'Operator-entered contact record; no message sent by this app'};
 db.followups.push(entry);return entry;
}
