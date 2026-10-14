'use strict';
let commandSelection=null;
let deductionActive=false,lastConversationId=null;
const dailyConversationHistory=new Map();
function learnCommandNames(text){
 for(const person of SCENARIO.commands.people)if(text.includes(person.name))state.flags[person.flag]=true;
}
function commandInvestigations(){
 const entries=room().targets.map(t=>({label:t.name,run:()=>examine(t.id)}));
 for(const extra of SCENARIO.commands.investigations){
  if(extra.room===state.room&&Events.matches(extra.when,state))entries.push({label:extra.label,run:()=>examine(extra.target)});
 }
 for(const item of state.inventory.filter(item=>SCENARIO.items[item]?.room===state.room))entries.push({label:item,run:()=>inspectItem(item)});
 return entries;
}
function commandPeople(){return SCENARIO.commands.people.filter(p=>state.flags[p.flag])}
function commandConversations(){return SCENARIO.commands.conversations.filter(t=>(!t.room||t.room===state.room)&&(!t.when||Events.matches(t.when,state)))}
function randomConversation(){
 const available=commandConversations(),related=available.filter(t=>t.eventRelated&&!state.flags[t.seenFlag]);
 let pool=related;
 if(!pool.length){
  const daily=available.filter(t=>!t.eventRelated);let seen=dailyConversationHistory.get(state.room)||new Set();
  pool=daily.filter(t=>!seen.has(t.id));if(!pool.length){seen=new Set();pool=daily.filter(t=>t.id!==lastConversationId);if(!pool.length)pool=daily}
  dailyConversationHistory.set(state.room,seen);
 }
 if(!pool.length)return;
 const chosen=pool[Math.floor(Math.random()*pool.length)];lastConversationId=chosen.id;
 if(chosen.eventRelated)state.flags[chosen.seenFlag]=true;else dailyConversationHistory.get(state.room).add(chosen.id);
 commandSpeak(chosen.lines);
}
function showItemToPerson(item,person){
 if(!state.inventory.includes(item)||!person||person.name==='サイジ'||person.id==='saiji')return;
 const key=itemGraphicFor(item);const candidates=person.showItems?.[item]||[];const event=Events.select(candidates,state);
 if(event){const lines=(event.lines||[]).map((line,i)=>i===0?[line[0],line[1],line[2]||'通常',{item:key,label:item}]:line);runEvent({...event,lines});return}
 commandSpeak([[person.name,'そのスケッチブックは、ここで確かめておこう。','通常',{item:key,label:item}]]);
}
function chooseItemToShow(item){
 if(!state.inventory.includes(item))return;
 const people=(room().occupants||[]).filter(p=>p.name!=='サイジ'&&p.id!=='saiji');
 if(!people.length){commandSpeak([['','ここには見せる相手がいない。','通常',{item:itemGraphicFor(item),label:item}]]);return}
 commandSelection='showRecipient';state.showingItem=item;renderCommands();
}
function commandSpeak(lines){choicesPending=false;say(lines)}
function searchPerson(person){
 const lines=person.name==='犯人'?
  (state.flags.deductionDone?[['ハルキ','オカボーに話を聞きたいけど、ここにはいないな。','通常'],['サイジ','ナカコに伝える前に、本人に声をかけよう。','通常']]:[['ハルキ','スケッチを破った人を探したいけど、誰なのかまだ確かめられていない。','困惑'],['サイジ','まずは残された手がかりを調べよう。','通常']]):
  [['ハルキ',person.name+'を探してみたけど、ここにはいないみたいだ。','通常'],['サイジ','今はこの場所の手がかりを確かめよう。','通常']];
 commandSpeak(lines);
}
function chooseCommand(kind){
 if(state.mode!=='exploration')return;
 if(kind==='chat'){randomConversation();return}
 if(kind==='show'&&!state.inventory.length){commandSpeak([['','見せられるアイテムをまだ持っていない。']]);return}
 if(kind==='listen'&&!(room().occupants||[]).length){commandSpeak([['','ここには誰もいない。']]);return}
 commandSelection=kind;renderCommands();
 $('commandChildren').querySelector('button')?.focus();
}
function renderCommands(){
 const visible=state.mode==='exploration'&&state.flags.introSeen;
 showWindow('commandWindows',visible);
 if(!visible){commandSelection=null;return}
 const headings={listen:'聞く',investigate:'調べる',search:'探す',move:'移動',show:'見せる',showRecipient:'誰に見せる？'};
 for(const b of $('commandRoots').children){
  const active=b.dataset.command===commandSelection;b.classList.toggle('active',active);b.setAttribute('aria-expanded',String(active));
 }
 showWindow('commandDetail',!!commandSelection);
 if(!commandSelection)return;
 $('commandHeading').textContent=headings[commandSelection];
 const box=$('commandChildren');box.replaceChildren();
 let entries=[];
 if(commandSelection==='listen'){
  const occupants=room().occupants||[];
  entries=occupants.map(p=>({label:p.name,run:()=>commandSpeak(p.lines)}));
  if(!entries.length)entries=[{label:'ここには誰もいない',run:()=>commandSpeak([['','ここには誰もいない。']])}];
 }else if(commandSelection==='investigate')entries=commandInvestigations();
 else if(commandSelection==='search')entries=commandPeople().map(p=>({label:p.name,run:()=>searchPerson(p)}));
 else if(commandSelection==='show')entries=state.inventory.map(item=>({label:item,run:()=>chooseItemToShow(item)}));
 else if(commandSelection==='showRecipient')entries=(room().occupants||[]).filter(p=>p.name!=='サイジ'&&p.id!=='saiji').map(p=>({label:p.name,run:()=>showItemToPerson(state.showingItem,p)}));
 else if(commandSelection==='move')entries=Object.entries(DATA.rooms).filter(([id])=>id!==state.room).map(([id,r])=>({label:r.name,run:()=>{commandSelection=null;moveTo(id)}}));
 if(!entries.length){const p=document.createElement('p');p.textContent='まだ手がかりがない。';box.appendChild(p)}
 for(const entry of entries){const b=document.createElement('button');b.type='button';b.textContent=entry.label;b.onclick=()=>{if(state.mode==='exploration')entry.run()};box.appendChild(b)}
 const back=document.createElement('button');back.type='button';back.className='command-back';back.textContent='もどる';back.onclick=()=>{commandSelection=null;renderCommands();$('commandRoots').querySelector('button')?.focus()};box.appendChild(back);$('commandDetail').style.setProperty?.('--command-count',entries.length+1);if(window.innerHeight){const available=window.innerHeight-$('commandDetail').getBoundingClientRect().top-90;const row=Math.max(20,Math.min(42,available/(entries.length+1)));$('commandDetail').style.setProperty('--command-row',row+'px');$('commandDetail').style.setProperty('--command-font',Math.min(17,row*.53,$('commandDetail').getBoundingClientRect().width/15)+'px')}
}
for(const [kind,label] of [['move','移動'],['listen','聞く'],['investigate','調べる'],['search','探す'],['show','見せる'],['chat','会話']]){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.command=kind;b.setAttribute('aria-controls','commandDetail');b.onclick=()=>chooseCommand(kind);$('commandRoots').appendChild(b);
}
