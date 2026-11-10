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
 const detached=deducing||(typeof notebookOpen!=='undefined'&&notebookOpen&&state.mode==='dialogue');
 for(const id of ['dialogue','characterStage']){const parent=detached?$('game'):mangaStage;if($(id).parentElement!==parent)parent.appendChild($(id))}
 mangaStage.classList.toggle('deducing',deducing);
 const c=typeof calendar==='function'?calendar():{label:'放課後'},label=c.label;
 const key=({'朝':'asa','昼':'hiru','放課後':'houkago','夕':'houkago','夜':'yoru'})[label]||'hiru';
 $('timeCircle').src='assets/ui/manga/time-circle-'+key+'.png';$('timeCircle').alt=label;
 $('timeCircle').style.left=({asa:1348,hiru:1420,houkago:1492,yoru:1564})[key]+'px';
 $('placeStamp').src='assets/ui/manga/stamp-place-'+state.room+'.png';$('placeStamp').alt=room().name;
 mangaStage.classList.toggle('commands-disabled',state.mode!=='exploration');
 if(state.mode==='exploration'){$('characterStage').classList.remove('hidden');if(!document.querySelector('#characterStage .active'))$('harukiCard').classList.add('active');for(const id of ['haruki','saiji'])if(!blinkTimers.has(id))scheduleBlink(id)}
 mangaStage.classList.toggle('has-dialogue',!$('dialogue').classList.contains('hidden')&&!detached);
 const unread=(state.notebook?.received||[]).filter(id=>!state.notebook.read.includes(id)).length;
 $('menu').classList.toggle('has-mail',unread>0);
}
const commandStyles=[['s1','s2'],['s4','s3'],['s4','s3','s1'],['s1','s2'],['s1','s2','s3'],['s3','s1']];
const transforms=['rotate(-5deg) scale(.78,1)','rotate(4deg) translateY(-6px)','rotate(3deg) scale(1.12,.74)','rotate(-6deg) translateY(4px)'];
function selectCommandVisual(button){for(const b of $('commandRoots').children)b.classList.toggle('on',b===button)}
function selectPaper(button){
 for(const b of $('commandChildren').children){b.classList.toggle('paper-selected',b===button);b.setAttribute('aria-current',b===button?'true':'false')}
 const rect=button.getBoundingClientRect(),stage=mangaStage.getBoundingClientRect(),scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1,y=Math.max(180,Math.min(700,(rect.top-stage.top)/scale+rect.height/scale/2-24));
 arrow.children[0].setAttribute('d',`M1706 338 C1716 300 1708 ${y+45} 1726 ${y+24}`);
 arrow.children[1].setAttribute('d',`M1717 ${y+34} l10 -12 l4 15`);arrow.classList.remove('hidden');
}
function decorateMangaCommands(){
 $('commandTitle').textContent='捜査';$('commandHeading').textContent=commandSelection==='investigate'?'調べる先':({move:'移動先',listen:'聞く相手',search:'探す人',show:'見せるもの',showRecipient:'見せる相手'})[commandSelection]||'';
 for(const [i,b] of [...$('commandRoots').children].entries()){
  if(!b.dataset.collage){const text=b.textContent;b.setAttribute('aria-label',text);b.replaceChildren();[...text].forEach((char,j)=>{const cut=document.createElement('b');cut.className=commandStyles[i][j]||'s3';cut.textContent=char;cut.style.transform=transforms[(i+j)%transforms.length];b.appendChild(cut)});b.dataset.collage='true'}
  b.classList.toggle('on',b.classList.contains('active'));b.onmouseenter=()=>selectCommandVisual(b);b.onfocus=()=>selectCommandVisual(b);
 }
 arrow.classList.add('hidden');
 for(const [i,b] of [...$('commandChildren').children].entries()){
  b.style.setProperty('--paper-turn',[-3,2,4,-4,2,-2,3,0][i%8]+'deg');
  b.style.setProperty('--paper-shift',[15,25,0,22,7,18,0,12][i%8]+'px');
  if(b.tagName!=='BUTTON')continue;
  if(b.dataset.target&&state.examined?.[state.room+':'+b.dataset.target]){const mark=document.createElement('img');mark.src='assets/ui/manga/check-'+(i%2?'a':'b')+'.png';mark.alt='調べた';mark.className='examined-check';b.appendChild(mark);b.dataset.examined='true'}
  b.onmouseenter=()=>selectPaper(b);b.onfocus=()=>selectPaper(b);
 }
 const first=$('commandChildren').querySelector('button');if(first)selectPaper(first);
}
function commandKeyNavigation(e){
 if(state.mode!=='exploration'||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key))return;
 const details=e.target.closest?.('#commandChildren'),box=details?$('commandChildren'):$('commandRoots'),buttons=[...box.querySelectorAll('button')];
 if(!buttons.length)return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=(i+(e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;buttons[i].focus();
}
document.addEventListener('keydown',commandKeyNavigation);window.addEventListener('resize',fitManga);
fitManga();render();
