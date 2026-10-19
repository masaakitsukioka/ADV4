'use strict';
// v0.15 共通テーマ：ドット倍率の共有と、手帳内の文字設定。
// --px … 背景（320x180）を画面に敷いたときの1ドットの大きさ。立ち絵・推理背景も同じ値で描く。
function updatePixelScale(){
 if(typeof coverGeometry!=='function')return;
 const scale=coverGeometry().scale;if(!(scale>0))return;
 $('game').style.setProperty('--px',scale.toFixed(3)+'px');
}
(()=>{const base=render;render=function(){const result=base.apply(this,arguments);updatePixelScale();return result}})();
window.addEventListener('resize',updatePixelScale);
updatePixelScale();

// 「文字：ふつう」「自動：OFF」は手帳の「設定・操作方法」で切り替える。
// 既存の #speedButton / #autoButton の処理をそのまま使うので、保存・自動送りの挙動は変わらない。
function renderTextSettings(){
 const box=document.createElement('div');box.className='nb-settings';box.setAttribute('aria-label','文字の設定');
 const row=(label,options,current,choose)=>{
  const r=document.createElement('div');r.className='nb-settings-row';r.setAttribute('role','group');r.setAttribute('aria-label',label);
  const name=document.createElement('span');name.textContent=label;r.appendChild(name);
  options.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-pressed',String(i===current));b.onclick=()=>{choose(i);selectNotebook('help')};r.appendChild(b)});
  box.appendChild(r);
 };
 row('文字の速さ',textSettings.labels,textSettings.index,i=>{textSettings.index=i;updateTextControls()});
 row('自動送り',['OFF','ON'],textSettings.auto?1:0,i=>{textSettings.auto=i===1;updateTextControls()});
 $('panelBody').prepend(box);
}
