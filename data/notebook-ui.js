'use strict';
const Notebook=window.SaikachiNotebook;
let notebookOpen=false,notebookSection='memo',notebookSpecial=null,notebookSelection=1,notebookReturnFocus=null;
let mailQueue=[],mailToastTimer=null,mailToastActive=false,mailSelected=0,mailCurrent=null;
const notebookSections=[['items','もちもの'],['memo','ちょうさメモ'],['relations','人物相関図'],['mail','メール（PHS）'],['save','セーブ'],['load','途中から'],['help','設定・操作方法']];
const memoEntries=[['sketchFound','ナカコのスケッチブック','先週のクロ研で描いた1ページが破かれている。','作品棚を調べよう。'],['layoutChecked','モチーフの配置図','ナカコとオカボーは同じ果物を描いた。「創造の後には破壊がセット」とオカボーは話していた。','机の配置図を確認しよう。'],['dutyChecked','クロ研の当番表','その日の当番はオカボー。スケッチブックとモチーフを管理する係だ。','旧校舎廊下の掲示板を確認しよう。'],['okaboChecked','オカボーのスケッチブック','完成作には落書きがある。今週の描き途中の絵には落書きがない。','準備室の作品棚と手に入れた持ち物を調べよう。'],['deductionDone','解決','オカボーが自分の絵と間違ってナカコの絵に落書きし、そのページを破いて隠した。','']];
function nbElement(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function nbButton(text,fn,cls){const b=nbElement('button',text,cls);b.type='button';b.onclick=fn;return b}
function initNotebook(){
 const overlay=nbElement('section',undefined,'hidden');overlay.id='notebook';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','捜査手帳');
 overlay.innerHTML='<div class="nb-book"><img class="nb-cover" src="assets/ui/notebook-cover.png" alt=""><div class="nb-spread"><section class="nb-left"><img class="nb-title" src="assets/ui/menu-title-notebook.png" alt="捜査手帳"><div id="nbDate" class="nb-date"></div><p id="nbPlace" class="nb-place"></p><nav id="nbNav" aria-label="手帳の項目"></nav><small class="nb-keys">↑↓ 選ぶ　Enter 開く　Esc もどる</small></section><section id="nbContent" class="nb-right" aria-label="選んだ項目の中身"></section><section id="nbSpecial" class="nb-special hidden"></section></div><nav id="nbTabs" class="nb-tabs" aria-label="インデックス"></nav><button id="nbClose" type="button" class="nb-close">× とじる</button></div>';
 $('game').appendChild(overlay);const cue=nbElement('span','▼ 続きがあります','nb-scroll-cue');$('nbContent').appendChild(cue);$('panel').addEventListener('scroll',updateNotebookScrollCue);window.addEventListener('resize',updateNotebookScrollCue);
 $('nbClose').onclick=closeNotebook;
 for(const [key,label] of [['items','もちもの'],['memo','メモ'],['relations','相関図'],['mail','メール'],['save','記録']])$('nbTabs').appendChild(nbButton(label,()=>{selectNotebook(key);if(key==='relations'||key==='mail')enterNotebookSection()},'nb-tab'));
 const toast=nbElement('div',undefined,'hidden');toast.id='mailToast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.innerHTML='<img src="assets/ui/phs-mini.png" alt=""><div><strong id="mailToastText"></strong><small>メニュー → メール（PHS）で読む</small></div>';$('game').appendChild(toast);
}
function syncNotebook(){
 const added=Notebook.sync(SCENARIO,state,Events);for(const id of added)if(!mailQueue.includes(id))mailQueue.push(id);
 if(state.mode!=='exploration'||notebookOpen){if(mailToastActive){clearTimeout(mailToastTimer);mailToastActive=false;$('mailToast').classList.add('hidden')}return}
 flushMailNotification();
}
function flushMailNotification(){
 if(state.mode!=='exploration'||notebookOpen||deductionActive||mailToastActive||!mailQueue.length)return;
 const count=mailQueue.length;mailQueue=[];$('mailToastText').textContent='ピピッ　メール '+count+'件';$('mailToast').classList.remove('hidden');mailToastActive=true;
 mailToastTimer=setTimeout(()=>{$('mailToast').classList.add('hidden');mailToastActive=false;flushMailNotification()},2500);
}
function resetNotebookUI(){
 if(notebookOpen)detachNotebook();
 mailQueue=[];clearTimeout(mailToastTimer);mailToastActive=false;$('mailToast')?.classList.add('hidden');mailCurrent=null;mailSelected=0;
}
function openNotebook(){
 if(deductionActive||!['exploration','menu'].includes(state.mode))return;
 if(notebookOpen){selectNotebook(notebookSection);return}
 notebookReturnFocus=document.activeElement;syncNotebook();notebookOpen=true;$('game').classList.add('notebook-visible');notebookSpecial=null;state.mode='menu';closeDialogueLayer();showWindow('panel',false);
 $('nbContent').appendChild($('panel'));showWindow('notebook',true);render();updateNotebookHeader();selectNotebook(notebookSection);$('nbNav').querySelector('[aria-current="page"]')?.focus();
}
function detachNotebook(){notebookOpen=false;$('game').classList.remove('notebook-visible');notebookSpecial=null;$('game').appendChild($('panel'));$('panel').classList.add('hidden');showWindow('notebook',false);$('notebook').classList.remove('nb-wide','nb-mail-dialogue');}
function closeNotebook(){if(!notebookOpen)return;detachNotebook();state.mode='exploration';render();notebookReturnFocus?.focus();}
function calendar(){return {...{day:1,date:'1996-07-19',weekday:'金',label:'放課後',time:'夕'},...SCENARIO.meta.calendar}}
function dayLabel(){const d=calendar().day;return '第'+(['','一','二','三','四','五','六','七','八','九','十'][d]||d)+'日'}
function updateNotebookHeader(){
 const c=calendar(),parts=c.date.split('-').map(Number);$('nbDate').replaceChildren();$('nbDate').appendChild(nbElement('strong',dayLabel(),'nb-day'));const date=nbElement('span',`${parts[0]}年${parts[1]}月${parts[2]}日（${c.weekday}）`);date.appendChild(nbElement('small',c.label));$('nbDate').appendChild(date);$('nbDate').appendChild(nbElement('b',c.time,'nb-stamp'));$('nbPlace').textContent='現在地：'+room().name;
}
function notebookStatus(key){
 const b=state.notebook;
 if(key==='items')return state.inventory.length+'点';
 if(key==='memo')return memoEntries.some(([f])=>state.flags[f]&&!b.seenMemo.includes(f))?'● 新しい記録':'調査の記録';
 if(key==='relations')return Notebook.tokens(b).some(t=>!b.seenRelations.includes(t))?'● 更新　'+b.nodes.length+'人':b.nodes.length+'人';
 if(key==='mail')return Notebook.unread(state).length?'● 未読 '+Notebook.unread(state).length:b.received.length+'件';return '';
}
function updateNotebookNav(){
 $('nbNav').replaceChildren();notebookSections.forEach(([key,label],i)=>{const b=nbButton('',()=>selectNotebook(key),'nb-entry');b.dataset.section=key;b.setAttribute('aria-current',notebookSection===key?'page':'false');b.appendChild(nbElement('span',['壱','弐','参','四','伍','六','七'][i],'nb-number'));b.appendChild(nbElement('strong',label));const status=notebookStatus(key);b.appendChild(nbElement('small',status,status.startsWith('●')?'nb-new':''));$('nbNav').appendChild(b)});
 Array.from($('nbTabs').children).forEach((b,i)=>b.setAttribute('aria-current',(['items','memo','relations','mail','save'][i]===notebookSection||i===4&&notebookSection==='load')?'page':'false'));
}
function selectNotebook(key){
 notebookSection=key;notebookSelection=notebookSections.findIndex(s=>s[0]===key);notebookSpecial=null;$('notebook').classList.remove('nb-wide');$('nbSpecial').classList.add('hidden');$('nbContent').classList.remove('hidden');
 if(key==='save'||key==='load')saveSlots(key);
 else if(key==='items')notebookInventory();
 else if(key==='memo')notebookMemo();
 else if(key==='help'){panel('設定・操作方法',[]);if(typeof renderTextSettings==='function')renderTextSettings();note('「移動」「聞く」「調べる」「探す」「見せる」「会話」から行動を選びます。調査が進むと対象が追加されます。会話は事件の話を優先し、その後は場所ごとの日常会話に切り替わります。');note('会話をタップすると全文表示、もう一度で次へ。会話・推理を終えた探索中にセーブできます。記録は3枠。推理では答えを選んで進めます。');note('手帳：↑↓で項目を選択、Enterで右ページへ、Escでもどります。メールは届いたものを読むと既読になります。人物と本名、関係は調査に応じて書き加えられます。')}
 else if(key==='relations'){panel('人物相関図',[['相関図をひらく',showNotebookRelations]]);note('判明 '+state.notebook.nodes.length+'人。調査が進むと、人物・本名・関係が書き加えられます。')}
 else {panel('メール（PHS）',[['PHSを取り出す',()=>showNotebookMail()]]);note('受信 '+state.notebook.received.length+'件 ／ 未読 '+Notebook.unread(state).length+'件。届いたメールを端末で確認できます。')}
 updateNotebookNav();requestAnimationFrame(updateNotebookScrollCue);
}
function enterNotebookSection(){if(notebookSection==='relations')showNotebookRelations();else if(notebookSection==='mail')showNotebookMail();else {const target=$('panelBody').querySelector('button')||$('panel');target.tabIndex=0;target.focus()}}
function notebookInventory(){
 panel('もちもの',state.inventory.map(item=>[item+'をしらべる',()=>{closeNotebook();inspectItem(item)}]));if(!state.inventory.length)note('まだ何も持っていない。調査で見つけたものがここに並びます。');
}
function notebookMemo(){
 panel('ちょうさメモ',[]);let next=false;
 for(const [flag,title,text,hint] of memoEntries){if(state.flags[flag]){const p=nbElement('p',undefined,'nb-memo '+(!state.notebook.seenMemo.includes(flag)?'fresh':''));p.appendChild(nbElement('b','■ '+title));p.appendChild(nbElement('span',text));$('panelBody').appendChild(p)}else if(!next&&flag!=='deductionDone'){note('□ '+hint,'nb-question');next=true}}
 if(!state.flags.deductionDone)note('？　誰が、なぜページを破いたのか。','nb-question');
 if(state.flags.okaboChecked&&!state.flags.deductionDone)$('panelBody').appendChild(nbButton('推理を再開する',()=>{closeNotebook();startDeduction()}));
 if(state.flags.deductionDone)$('panelBody').appendChild(nbButton('エンディングを読み返す',()=>{closeNotebook();say(SCENARIO.ending,showEnding)}));
 state.notebook.seenMemo=memoEntries.filter(([f])=>state.flags[f]).map(([f])=>f);
}
function specialNotebook(kind,title){
 notebookSpecial=kind;$('notebook').classList.add('nb-wide');$('nbContent').classList.add('hidden');const area=$('nbSpecial');area.classList.remove('hidden');area.replaceChildren();const head=nbElement('header',undefined,'nb-special-head');head.appendChild(nbElement('h2',title));head.appendChild(nbButton('← 手帳にもどる',()=>{selectNotebook(notebookSection);$('nbNav').querySelector('[aria-current="page"]')?.focus()}));area.appendChild(head);return area;
}
function showNotebookRelations(){
 const area=specialNotebook('relations','人物相関図');const info=Notebook.relations(SCENARIO,state);area.querySelector('h2').appendChild(nbElement('small',dayLabel()+'　判明 '+state.notebook.nodes.length+'人'));
 const chart=nbElement('div',undefined,'nb-chart');chart.setAttribute('aria-label','判明した人物と関係。左右キーで図を移動');chart.tabIndex=0;const canvas=nbElement('div',undefined,'nb-chart-canvas');chart.appendChild(canvas);area.appendChild(chart);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1000 540');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');canvas.appendChild(svg);
 for(const e of info.edges){const from=info.nodes.find(n=>n.id===e.from),to=info.nodes.find(n=>n.id===e.to);if(!from?.known||!to?.known)continue;const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v] of Object.entries({x1:from.x*10,y1:from.y*5.4,x2:to.x*10,y2:to.y*5.4,'stroke-dasharray':e.style==='dashed'?'9 6':e.style==='dotted'?'3 7':''}))line.setAttribute(k,v);svg.appendChild(line);const label=nbElement('span',e.label,'nb-edge-label');label.style.left=(e.labelX??(from.x+to.x)/2)+'%';label.style.top=(e.labelY??(from.y+to.y)/2)+'%';canvas.appendChild(label)}
 for(const n of info.nodes){const node=nbElement('div',undefined,'nb-node'+(!n.known?' locked':'')+(n.deceased?' deceased':''));node.style.left=n.x+'%';node.style.top=n.y+'%';const face=nbElement('div',undefined,'nb-face');face.style.backgroundColor=n.color||'#555';if(n.color==='#e8e0cc')face.style.color='#555';if(n.known&&n.face){const im=nbElement('img');im.src=n.face;im.alt='';face.appendChild(im)}else face.textContent=n.known?n.name[0]:'？';if(n.deceased&&n.known)face.appendChild(nbElement('b','故','nb-dead'));node.appendChild(face);node.appendChild(nbElement('strong',n.displayName));node.appendChild(nbElement('small',n.known?'本名：'+n.displayRealName:n.hint,n.displayRealName==='？？？'?'unknown':''));canvas.appendChild(node)}
 area.appendChild(nbElement('p','━ 判明した関係　┅ 不確かな関係　┈ 印象的な接点　故＝故人','nb-legend'));area.appendChild(nbElement('small','調査が進むと、人物・本名・関係が書き加えられる。小さい画面では図を横に動かせます。','nb-chart-help'));
 positionRelationLabels(canvas,info);state.notebook.seenRelations=Notebook.tokens(state.notebook);updateNotebookNav();area.querySelector('button')?.focus();
}
function receivedMails(){return (SCENARIO.mails||[]).filter(m=>state.notebook.received.includes(m.id))}
function openNotebookMail(id){
 if(!Notebook.read(state,id))return;const mail=SCENARIO.mails.find(m=>m.id===id);mailCurrent=id;showNotebookMail(id);
 if(mail.lines?.length){const resume=()=>{state.mode='menu';render();showNotebookMail(id)};say(mail.lines,resume);$('notebook').classList.add('nb-mail-dialogue');$('dialogue').tabIndex=-1;$('dialogue').focus()}
}
function mailLCD(parent,mail,large){
 const lcd=nbElement('section',undefined,'nb-lcd'+(large?' enlarged':''));lcd.setAttribute('aria-label',large?'メール本文の拡大表示':'PHSの液晶');const bar=nbElement('div',undefined,'nb-lcd-bar');const signal=nbElement('span',undefined,'lcd-signal');signal.setAttribute('aria-label','電波3本');for(let i=0;i<3;i++)signal.appendChild(nbElement('i'));bar.appendChild(signal);bar.appendChild(nbElement('span',mail?mail.date+' '+mail.time:'ｼﾞｭｼﾝBOX'));const battery=nbElement('span',undefined,'lcd-battery');battery.setAttribute('aria-label','電池残量2');for(let i=0;i<3;i++)battery.appendChild(nbElement('i'));bar.appendChild(battery);lcd.appendChild(bar);
 if(mail){lcd.appendChild(nbElement('p','ﾌﾛﾑ: '+mail.from,'nb-mail-from'));lcd.appendChild(nbElement('p',mail.body,'nb-mail-body'));lcd.appendChild(nbElement('small',Array.from(mail.body).length+'/20ﾓｼﾞ','nb-mail-count'));}
 else {const list=nbElement('div',undefined,'nb-mail-list');const mails=receivedMails();if(!mails.length)list.appendChild(nbElement('p','ﾒｰﾙ ﾊ ｱﾘﾏｾﾝ'));mails.forEach((m,i)=>{const b=nbButton('',()=>openNotebookMail(m.id),'nb-mail-row'+(i===mailSelected?' selected':''));b.dataset.mailId=m.id;b.onfocus=()=>{mailSelected=i;for(const row of $('nbSpecial').querySelectorAll('.nb-mail-row'))row.classList.toggle('selected',row.dataset.mailId===m.id)};b.appendChild(nbElement('span',(!state.notebook.read.includes(m.id)?'✉ ':'')+m.from));b.appendChild(nbElement('span',m.date+' '+m.time));list.appendChild(b)});lcd.appendChild(list)}
 const soft=nbElement('div',undefined,'nb-soft');soft.appendChild(nbButton('ﾓﾄﾞﾙ',()=>{if(mail){mailCurrent=null;showNotebookMail()}else selectNotebook('mail')}));soft.appendChild(mail?nbElement('span','ﾍﾝｼﾝ ﾃﾞｷﾏｾﾝ'):nbButton('ﾖﾑ',()=>{const m=receivedMails()[mailSelected];if(m)openNotebookMail(m.id)}));lcd.appendChild(soft);parent.appendChild(lcd);return lcd;
}
function showNotebookMail(id=null){
 $('notebook').classList.remove('nb-mail-dialogue');mailCurrent=id;const area=specialNotebook('mail','メール（PHS）');const mail=receivedMails().find(m=>m.id===id);const view=nbElement('div',undefined,'nb-phs-view');area.appendChild(view);const enlarged=nbElement('div',undefined,'nb-mail-enlarged');enlarged.appendChild(nbElement('p',mail?'本文の拡大表示':'受信メール　未読 '+Notebook.unread(state).length+'件','nb-mail-caption'));mailLCD(enlarged,mail,true);view.appendChild(enlarged);
 const phone=nbElement('div',undefined,'nb-phone');phone.setAttribute('aria-hidden','true');phone.inert=true;const img=nbElement('img');img.src='assets/ui/phs-body.png';img.alt='1996年型PHS';phone.appendChild(img);mailLCD(phone,mail,false);view.appendChild(phone);updateNotebookNav();area.querySelector('.enlarged button')?.focus();
}
initNotebook();
document.addEventListener('keydown',e=>{
 if(!notebookOpen||e.isComposing)return;
 // メールへの反応は通常の会話操作を優先。
 if(state.mode==='dialogue')return;
 const focusables=()=>Array.from($('notebook').querySelectorAll('button, [tabindex="0"]')).filter(b=>!b.disabled&&!b.closest('[inert]')&&b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden');
 if(e.key==='Tab'){const list=focusables(),i=list.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();list.at(-1)?.focus()}else if(!e.shiftKey&&i===list.length-1){e.preventDefault();list[0]?.focus()}return}
 if(document.activeElement?.classList.contains('nb-chart')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();document.activeElement.scrollBy({left:e.key==='ArrowRight'?90:e.key==='ArrowLeft'?-90:0,top:e.key==='ArrowDown'?60:e.key==='ArrowUp'?-60:0});return}
 if(!['ArrowUp','ArrowDown','Enter','Escape'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();
 if(e.key==='Escape'){if(notebookSpecial){mailCurrent=null;selectNotebook(notebookSection);$('nbNav').querySelector('[aria-current="page"]')?.focus()}else if(document.activeElement?.closest('#nbContent'))$('nbNav').querySelector('[aria-current="page"]')?.focus();else closeNotebook();return}
 const inNav=document.activeElement?.closest('#nbNav, #nbTabs');
 if(inNav){if(e.key==='Enter'){enterNotebookSection();return}notebookSelection=(notebookSelection+(e.key==='ArrowDown'?1:-1)+notebookSections.length)%notebookSections.length;selectNotebook(notebookSections[notebookSelection][0]);$('nbNav').querySelector('[aria-current="page"]')?.focus();return}
 if(e.key==='Enter'){document.activeElement?.click();return}
 if(document.activeElement===$('panel')){$('panel').scrollBy({top:e.key==='ArrowDown'?65:-65});return}
 const list=focusables().filter(b=>b.closest(notebookSpecial?'#nbSpecial':'#nbContent')),index=list.indexOf(document.activeElement);list[(index+(e.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();
},true);

function updateNotebookScrollCue(){
 const panel=$('panel'),cue=$('nbContent').querySelector('.nb-scroll-cue');if(!cue)return;
 cue.classList.toggle('hidden',!notebookOpen||!!notebookSpecial||panel.scrollHeight<=panel.clientHeight+2||panel.scrollTop+panel.clientHeight>=panel.scrollHeight-2);
}

// 関係札は人物の顔・呼び名・本名を避け、線に直交する方向へずらす。
function positionRelationLabels(canvas,info){
 const bounds=canvas.getBoundingClientRect(),nodes=Array.from(canvas.querySelectorAll('.nb-node')).map(n=>n.getBoundingClientRect()),placed=[];
 const hits=(r,b)=>r.left<b.right+4&&r.right>b.left-4&&r.top<b.bottom+4&&r.bottom>b.top-4;
 Array.from(canvas.querySelectorAll('.nb-edge-label')).forEach((label,i)=>{
  const edge=info.edges[i],a=info.nodes.find(n=>n.id===edge.from),b=info.nodes.find(n=>n.id===edge.to);if(!a||!b)return;
  const occupied=r=>nodes.concat(placed).some(n=>hits(r,n));
  if(occupied(label.getBoundingClientRect())){
   const dx=(b.x-a.x)*bounds.width/100,dy=(b.y-a.y)*bounds.height/100,length=Math.hypot(dx,dy)||1;
   const x=(a.x+b.x)/200*bounds.width,y=(a.y+b.y)/200*bounds.height;
   for(const offset of [24,-24,48,-48,72,-72,96,-96,120,-120]){
    const cx=x-dy/length*offset,cy=y+dx/length*offset;
    label.style.left=cx+'px';label.style.top=cy+'px';const r=label.getBoundingClientRect();
    if(r.left>=bounds.left+4&&r.right<=bounds.right-4&&r.top>=bounds.top+4&&r.bottom<=bounds.bottom-4&&!occupied(r))break;
   }
  }
  placed.push(label.getBoundingClientRect());
 });
}
