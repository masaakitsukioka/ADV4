'use strict';
// 画面比率によるサイズ指定は theme.css で行う。
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
 row('文字の音',['OFF','ON'],textSettings.sound?1:0,i=>{textSettings.sound=i===1});
 row('効果音',['OFF','ON'],textSettings.se?1:0,i=>{textSettings.se=i===1});
 row('自動送り',['OFF','ON'],textSettings.auto?1:0,i=>{textSettings.auto=i===1;updateTextControls()});
 $('panelBody').prepend(box);
}
