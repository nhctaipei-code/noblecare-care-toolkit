'use strict';
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const languages=['zh-Hant','en','vi','id'];
let language='zh-Hant',view='home',category='',query='',favorites=new Set();
try{const saved=localStorage.getItem('noblecare-toolkit-language');if(languages.includes(saved))language=saved;const f=JSON.parse(localStorage.getItem('noblecare-toolkit-favorites')||'[]');if(Array.isArray(f))favorites=new Set(f.filter(id=>DATA['zh-Hant'].entries.some(e=>e.id===id)));}catch{}
const original=DATA['zh-Hant'];
const getData=()=>DATA[language];
const u=()=>UI[language];
const list=items=>items.map(t=>`<li>${escapeHTML(t)}</li>`).join('');
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2500);}
function remember(){try{localStorage.setItem('noblecare-toolkit-favorites',JSON.stringify([...favorites]));}catch{}}
function body(entry,labels){return `<h4>${labels.why}</h4><p>${escapeHTML(entry.why)}</p><h4>${labels.steps}</h4><ol>${list(entry.steps)}</ol><div class="avoid"><h4>${labels.avoid}</h4><ul>${list(entry.no)}</ul></div><h4>${labels.report}</h4><p>${escapeHTML(entry.rep)}</p><h4>${labels.reference}</h4><p class="reference">${escapeHTML(entry.ref)}</p><div class="ask"><strong>${labels.ask}</strong><p>${escapeHTML(entry.ask)}</p></div>`;}
function entryHTML(entry){const db=getData().databases.find(d=>d.id===entry.db);const cn=original.entries.find(e=>e.id===entry.id);const labels=u();return `<details class="entry" id="${entry.id}" style="--topic:var(--${entry.db})"><summary><div><span class="meta">${escapeHTML(db.name)} · ${escapeHTML(entry.cat)}</span><h3>${escapeHTML(entry.t)}</h3><p>${escapeHTML(entry.s)}</p></div></summary><div class="entry-body">${body(entry,labels)}<div class="actions"><button data-action="favorite" data-id="${entry.id}" aria-pressed="${favorites.has(entry.id)}">${favorites.has(entry.id)?labels.saved:labels.save}</button><button data-action="copy" data-id="${entry.id}">${labels.copy}</button><button data-action="print" data-id="${entry.id}">${labels.print}</button></div>${language!=='zh-Hant'?`<details class="original"><summary>${labels.compare}</summary><div class="original-content" lang="zh-Hant"><h3>${escapeHTML(cn.t)}</h3><p>${escapeHTML(cn.s)}</p>${body(cn,UI['zh-Hant'])}</div></details>`:''}</div></details>`;}
function navigate(next){view=next;category='';query='';$('#search').value='';$('#clear').hidden=true;render();}
function setLanguage(next){const previousIndex=view==='home'||view==='favorites'?-1:getData().databases.find(d=>d.id===view)?.cats.indexOf(category);language=next;if(previousIndex>=0)category=getData().databases.find(d=>d.id===view).cats[previousIndex];try{localStorage.setItem('noblecare-toolkit-language',language);}catch{}render();}
function render(){
  const labels=u(),data=getData();document.documentElement.lang=language;document.title=labels.title+' | NobleCare';
  $('#institution').textContent=labels.institution;$('#home').textContent=labels.title;$('#welcome-title').textContent=labels.headline;$('#welcome-desc').textContent=labels.intro;
  $('#search').placeholder=labels.search;$('#search-label').textContent=labels.search;$('#clear').setAttribute('aria-label',labels.clear);$('#source-top').textContent=labels.source;
  $('.languages').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===language)));
  $('#notice').textContent=labels.notice+(language==='zh-Hant'?'':' '+labels.translation);
  $('#notice-title').textContent={'zh-Hant':'使用說明與翻譯範圍',en:'Reference only · Translation review pending',vi:'Chỉ tham khảo · Bản dịch chưa duyệt chuyên môn',id:'Referensi · Terjemahan belum ditinjau ahli'}[language];
  const nav=[{id:'home',name:labels.home},...data.databases,{id:'favorites',name:'☆ '+labels.favorites}];$('#nav').innerHTML=nav.map(n=>`<button data-view="${n.id}" aria-current="${!query&&view===n.id}">${escapeHTML(n.name)}</button>`).join('');
  let entries=[],heading='',description='';
  if(query){heading=labels.results;const words=query.toLocaleLowerCase().normalize('NFC').split(/\s+/).filter(Boolean);entries=data.entries.filter((e,i)=>{const hay=JSON.stringify([e,original.entries[i]]).toLocaleLowerCase().normalize('NFC');return words.every(w=>hay.includes(w));});}
  else if(view==='favorites'){heading=labels.favorites;description=labels.local;entries=data.entries.filter(e=>favorites.has(e.id));}
  else if(view!=='home'){const db=data.databases.find(d=>d.id===view);heading=db.full;description=db.desc;entries=data.entries.filter(e=>e.db===view&&(!category||e.cat===category));}
  if(!query&&view==='home'){$('#results').innerHTML=`<div class="tiles">${data.databases.map(db=>`<button class="tile" data-view="${db.id}" style="--topic:var(--${db.id})"><div class="tile-top"><span aria-hidden="true">${db.icon}</span><span class="count">${data.entries.filter(e=>e.db===db.id).length} ${labels.items} ↗</span></div><h2>${escapeHTML(db.name)}</h2><p>${escapeHTML(db.desc)}</p></button>`).join('')}</div><div class="section-heading"><h2>${labels.guide}</h2></div><p>${labels.guideText}</p>`;}
  else{
    const db=data.databases.find(d=>d.id===view);
    const chips=!query&&db?`<div class="chips">${['',...db.cats].map(c=>`<button data-category="${escapeHTML(c)}" aria-pressed="${category===c}">${escapeHTML(c||labels.all)}</button>`).join('')}</div>`:'';
    $('#results').innerHTML=`<div class="section-heading"><h2>${escapeHTML(heading)}</h2><span class="count">${entries.length} ${labels.items} · ${labels.open}</span></div>${description?`<p>${escapeHTML(description)}</p>`:''}${chips}${entries.length?`<div class="list">${entries.map(entryHTML).join('')}</div>`:`<div class="empty">${view==='favorites'&&!query?labels.noFavorites:labels.none}</div>`}`;
  }
  $('#status').textContent=(view==='home'&&!query?data.entries.length:entries.length)+' '+labels.items;
  $('#emergency').innerHTML=`<h2>${labels.emergency}</h2><div class="phone-grid">${['119','110','113','1966','1955'].map((n,i)=>`<a href="tel:${n}">${n}<small>${labels.phones[i]}</small></a>`).join('')}</div>`;
  $('#attribution').textContent=labels.attribution;$('#original-link').textContent=labels.original;$('#version').textContent=labels.version;
}
$('#home').addEventListener('click',()=>navigate('home'));
$('.languages').addEventListener('click',e=>{const b=e.target.closest('button[data-lang]');if(b)setLanguage(b.dataset.lang);});
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)navigate(b.dataset.view);});
$('#results').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.view){navigate(b.dataset.view);return;}
  if(b.hasAttribute('data-category')){category=b.dataset.category;render();return;}
  const entry=getData().entries.find(n=>n.id===b.dataset.id);if(!entry)return;
  if(b.dataset.action==='favorite'){if(favorites.has(entry.id))favorites.delete(entry.id);else favorites.add(entry.id);remember();b.setAttribute('aria-pressed',String(favorites.has(entry.id)));b.textContent=favorites.has(entry.id)?u().saved:u().save;if(view==='favorites')render();}
  if(b.dataset.action==='copy'){try{await navigator.clipboard.writeText(entry.ask);toast(u().copied);}catch{toast(u().copyFailed);}}
  if(b.dataset.action==='print'){document.querySelectorAll('.entry').forEach(el=>el.removeAttribute('data-print'));document.getElementById(entry.id).dataset.print='true';window.print();}
});
let searchTimer;$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=$('#search').value.trim();$('#clear').hidden=!query;render();},160);});
$('#clear').addEventListener('click',()=>{clearTimeout(searchTimer);query='';$('#search').value='';$('#clear').hidden=true;render();$('#search').focus();});
render();
