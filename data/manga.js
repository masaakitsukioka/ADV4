'use strict';
// Logical 1920×1080 stage; notebook and the existing deduction panels keep their viewport layout.
const mangaStage=$('mangaStage');
mangaStage.appendChild($('commandWindows'));
$('scene').appendChild($('targets')); // Hotspots inherit both cover mapping and the panel rotation.
$('messageBody').appendChild($('nextMark'));
$('menuGraphic').src='assets/ui/manga/menu-note.png';
for(const layer of ['back','front']){const paper=document.createElement('div');paper.className='manga-sheet '+layer;mangaStage.insertBefore(paper,$('dialogue'))}
const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.id='mangaArrow';arrow.setAttribute('viewBox','0 0 1920 1080');arrow.innerHTML='<path d="" fill="none" stroke="#5087c4" stroke-width="2.5"/><path d="" fill="none" stroke="#5087c4" stroke-width="2.5"/>';mangaStage.appendChild(arrow);
// Grey placeholders only. Never generate or alter artwork when an asset is missing.
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.classList.add('manga-missing')},true);
function fitManga(){mangaStage.style.setProperty('--manga-scale',(innerWidth<=700&&innerHeight>innerWidth?Math.min(innerWidth/900,innerHeight/1950):Math.min(innerWidth/1920,innerHeight/1080)));renderManga()}
function renderManga(){
 const deducing=typeof deductionActive!=='undefined'&&deductionActive;
 const mailDialogue=typeof notebookOpen!=='undefined'&&notebookOpen&&state.mode==='dialogue';
 mangaStage.classList.toggle('mail-dialogue',mailDialogue);
 for(const id of ['dialogue','characterStage'])if($(id).parentElement!==mangaStage)mangaStage.appendChild($(id))
 mangaStage.classList.toggle('deducing',deducing);
 if(deducing&&$('panel').parentElement!==mangaStage)mangaStage.appendChild($('panel'));
 else if(!deducing&&$('panel').parentElement===mangaStage)$('game').appendChild($('panel'));
 const c=typeof calendar==='function'?calendar():{label:'放課後'},label=c.label;
 const key=({'朝':'asa','昼':'hiru','放課後':'houkago','夕':'houkago','夜':'yoru'})[label]||'hiru';
 $('timeCircle').src='assets/ui/manga/time-circle-'+key+'.png';$('timeCircle').alt=label;
 $('timeCircle').style.left=({asa:1348,hiru:1420,houkago:1492,yoru:1564})[key]+'px';
 $('placeStamp').src='assets/ui/manga/stamp-place-'+state.room+'.png';$('placeStamp').alt=room().name;
 mangaStage.classList.toggle('commands-disabled',state.mode!=='exploration');
 if(state.mode==='exploration'){$('characterStage').classList.remove('hidden');if(!document.querySelector('#characterStage .active'))$('harukiCard').classList.add('active');for(const id of ['haruki','saiji'])if(!blinkTimers.has(id))scheduleBlink(id)}
 mangaStage.classList.toggle('has-dialogue',!$('dialogue').classList.contains('hidden'));
 const unread=(state.notebook?.received||[]).filter(id=>!state.notebook.read.includes(id)).length;
 $('menu').classList.toggle('has-mail',unread>0);
}
const commandStyles=[['s1','s2'],['s4','s3'],['s4','s3','s1'],['s1','s2'],['s1','s2','s3'],['s3','s1']];
const transforms=['rotate(-5deg) scale(.78,1)','rotate(4deg) translateY(-6px)','rotate(3deg) scale(1.12,.74)','rotate(-6deg) translateY(4px)'];
function selectCommandVisual(button){
 if(state.mode!=='exploration')return;
 for(const b of $('commandRoots').children)b.classList.toggle('on',b===button||b.dataset.command===commandSelection);
 updateCommandArrow();
}
function updateCommandArrow(){
 const selected=$('commandChildren').querySelector('.paper-selected'),command=$('commandRoots').querySelector('.on');
 if(!commandSelection||commandSelection==='chat'||!selected||!command||$('commandDetail').classList.contains('hidden')){arrow.classList.add('hidden');return}
 const stage=mangaStage.getBoundingClientRect(),scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1,from=command.getBoundingClientRect(),to=selected.getBoundingClientRect();
 const x1=(from.right-stage.left)/scale+8,y1=(from.top+from.height/2-stage.top)/scale,x2=(to.left-stage.left)/scale-12,y2=(to.top+to.height/2-stage.top)/scale;
 arrow.children[0].setAttribute('d',`M${x1} ${y1} C${x1+15} ${y1} ${x2-20} ${y2+20} ${x2} ${y2}`);
 arrow.children[1].setAttribute('d',`M${x2-9} ${y2+10} l10 -12 l4 15`);arrow.classList.remove('hidden');
}
function selectPaper(button){
 for(const b of $('commandChildren').children){b.classList.toggle('paper-selected',b===button);b.setAttribute('aria-current',b===button?'true':'false')}
 updateCommandArrow();
}
function decorateMangaChoices(){
 const buttons=[...$('dialogueChoices').querySelectorAll('button')];
 function select(button){for(const b of buttons){b.classList.toggle('choice-selected',b===button);b.setAttribute('aria-current',b===button?'true':'false')}}
 for(const [i,b] of buttons.entries()){b.style.setProperty('--choice-turn',[-1.8,1.3,-.7][i%3]+'deg');b.onmouseenter=()=>select(b);b.onfocus=()=>select(b)}
 if(buttons.length){select(buttons[0]);const lineHeight=parseFloat(getComputedStyle($('messageBody')).lineHeight),scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1,range=document.createRange();range.selectNodeContents($('line'));$('dialogueChoices').style.top=($('messageBody').offsetTop+Math.max(lineHeight,range.getBoundingClientRect().height/scale)+16)+'px'}
}
function decorateMangaCommands(enter=false){
 $('commandTitle').textContent='捜査';$('commandHeading').textContent=commandSelection==='investigate'?'調べる先':({move:'移動先',listen:'聞く相手',search:'探す人',show:'見せるもの',showRecipient:'見せる相手'})[commandSelection]||'';
 for(const [i,b] of [...$('commandRoots').children].entries()){
  if(!b.dataset.collage){const text=b.textContent;b.setAttribute('aria-label',text);b.replaceChildren();[...text].forEach((char,j)=>{const cut=document.createElement('b');cut.className=commandStyles[i][j]||'s3';cut.textContent=char;cut.style.transform=transforms[(i+j)%transforms.length];b.appendChild(cut)});b.dataset.collage='true'}
  b.classList.toggle('on',b.classList.contains('active'));b.onmouseenter=()=>selectCommandVisual(b);b.onmouseleave=()=>{for(const root of $('commandRoots').children)root.classList.toggle('on',root.dataset.command===commandSelection)};b.onfocus=()=>selectCommandVisual(b);b.onblur=()=>{for(const root of $('commandRoots').children)root.classList.toggle('on',root.dataset.command===commandSelection)};
 }
 arrow.classList.add('hidden');
 for(const [i,b] of [...$('commandChildren').children].entries()){
  b.style.setProperty('--entry-delay',((i+1)*80)+'ms');
  b.style.setProperty('--paper-turn',[-3,2,4,-4,2,-2,3,0][i%8]+'deg');
  b.style.setProperty('--paper-shift',[15,25,0,22,7,18,0,12][i%8]+'px');
  if(b.tagName!=='BUTTON')continue;
  const done=!!((b.dataset.target&&hasSeenInvestigation(b.dataset.target,b.dataset.itemLabel))||(b.dataset.listenKey&&state.listened?.[b.dataset.listenKey]?.includes(Number(b.dataset.listenIndex))));
  const existing=b.querySelector('.examined-check');
  if(!done&&existing){existing.remove();delete b.dataset.examined}
  if(done&&!existing){const mark=document.createElement('img');mark.src='assets/ui/manga/check-'+(i%2?'a':'b')+'.png';mark.alt='調べた';mark.className='examined-check';b.appendChild(mark);b.dataset.examined='true'}
  b.onmouseenter=()=>selectPaper(b);b.onfocus=()=>selectPaper(b);
 }
 const selected=$('commandChildren').querySelector('.paper-selected');if(selected&&commandSelection)selectPaper(selected);
 if(enter&&state.mode==='exploration'){const detail=$('commandDetail');detail.classList.remove('list-enter');detail.getBoundingClientRect();detail.classList.add('list-enter');detail.dataset.listGeneration=String(Number(detail.dataset.listGeneration||0)+1)}
 $('commandChildren').onscroll=updateCommandArrow;
}
function commandKeyNavigation(e){
 if(state.mode!=='exploration'||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key))return;
 const details=e.target.closest?.('#commandChildren'),box=details?$('commandChildren'):$('commandRoots'),buttons=[...box.querySelectorAll('button')];
 if(!buttons.length)return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=(i+(e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;buttons[i].focus();
}
let commandPointer=null;

document.addEventListener('keydown',commandKeyNavigation);window.addEventListener('resize',fitManga);
fitManga();render();
