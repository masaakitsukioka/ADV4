// UIから独立した受信・判明記録。条件は既存Eventsと共通。
(function(global){
 'use strict';
 const keys=['received','read','nodes','names','edges','seenRelations','seenMemo'];
 const empty=()=>Object.fromEntries(keys.map(k=>[k,[]]));
 const edgeId=(edge,i)=>edge.id||`${edge.from}:${edge.to}:${i}`;
 function validate(value,scenario){
  if(value===undefined)return empty();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('手帳の保存形式が正しくありません。');
  const nodes=scenario.relations?.nodes||[],edges=scenario.relations?.edges||[];
  const allowed={received:(scenario.mails||[]).map(m=>m.id),read:(scenario.mails||[]).map(m=>m.id),nodes:nodes.map(n=>n.id),names:nodes.map(n=>n.id),edges:edges.map(edgeId),seenRelations:[...nodes.map(n=>'node:'+n.id),...nodes.map(n=>'name:'+n.id),...edges.map((e,i)=>'edge:'+edgeId(e,i))],seenMemo:['sketchFound','layoutChecked','dutyChecked','okaboChecked','deductionDone']};
  const result=empty();
  for(const k of keys){const list=value[k]===undefined?[]:value[k];if(!Array.isArray(list)||list.some(v=>typeof v!=='string'||!allowed[k].includes(v))||new Set(list).size!==list.length)throw new Error('手帳の保存形式が正しくありません。');result[k]=[...list]}
  if(result.read.some(id=>!result.received.includes(id))||result.names.some(id=>!result.nodes.includes(id)))throw new Error('手帳の記録に矛盾があります。');
  return result;
 }
 function sync(scenario,state,events){
  const book=state.notebook||(state.notebook=empty()),added=[];
  const add=(key,id)=>{if(!book[key].includes(id))book[key].push(id)};
  for(const m of scenario.mails||[])if(events.matches(m.when,state)&&!book.received.includes(m.id)){add('received',m.id);added.push(m.id)}
  for(const n of scenario.relations?.nodes||[])if(events.matches(n.when,state)){add('nodes',n.id);if(n.realName&&events.matches(n.realNameWhen,state))add('names',n.id)}
  (scenario.relations?.edges||[]).forEach((e,i)=>{if(book.nodes.includes(e.from)&&book.nodes.includes(e.to)&&events.matches(e.when,state))add('edges',edgeId(e,i))});
  return added;
 }
 const tokens=book=>[...book.nodes.map(id=>'node:'+id),...book.names.map(id=>'name:'+id),...book.edges.map(id=>'edge:'+id)];
 function relations(scenario,state){
  const b=state.notebook||empty();
  return {nodes:(scenario.relations?.nodes||[]).filter(n=>b.nodes.includes(n.id)||n.hint).map(n=>({...n,known:b.nodes.includes(n.id),displayName:b.nodes.includes(n.id)?n.name:'？？？',displayRealName:b.names.includes(n.id)?n.realName:'？？？'})),edges:(scenario.relations?.edges||[]).filter((e,i)=>b.edges.includes(edgeId(e,i)))};
 }
 global.SaikachiNotebook={empty,validate,sync,relations,tokens,edgeId,unread:state=>(state.notebook?.received||[]).filter(id=>!state.notebook.read.includes(id)),read(state,id){const b=state.notebook;if(!b?.received.includes(id))return false;if(!b.read.includes(id))b.read.push(id);return true}};
})(window);
