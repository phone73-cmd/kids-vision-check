// Persist first, then publish the new state. A failed write leaves the displayed record intact.
export function deleteStoredRecord(current,id,storage,key){
 try{
  const raw=storage.getItem(key);let latest=current;
  if(raw!==null){const parsed=JSON.parse(raw);if(!parsed||!Array.isArray(parsed.records))throw new Error('Invalid stored records');latest=parsed;}
  const next={...latest,records:latest.records.filter(record=>record.id!==id)};
  storage.setItem(key,JSON.stringify(next));return {ok:true,state:next};
 }catch{return {ok:false,state:current};}
}
