const $=id=>document.getElementById(id);
const today=()=>new Date().toLocaleDateString('en-CA');
const initialAnimals=[
 {id:'gc-f',species:'Gecko ciliatus',sex:'Femmina',name:''},
 {id:'gc-m',species:'Gecko ciliatus',sex:'Maschio',name:''}
];
let data=JSON.parse(localStorage.getItem('exoticTracker')||'null')||{animals:initialAnimals,entries:[],weights:[]};
let draft=[];
function persist(){localStorage.setItem('exoticTracker',JSON.stringify(data));render();}
function animalLabel(a){return `${a.name?a.name+' · ':''}${a.species} (${a.sex})`;}
function render(){
 $('animals').innerHTML=data.animals.map(a=>`<div class="animal"><strong>${esc(a.name||a.species)}</strong><span>${esc(a.species)} · ${esc(a.sex)}</span></div>`).join('')||'<p>Nessun animale inserito.</p>';
 const old=$('filterAnimal').value;
 $('filterAnimal').innerHTML='<option value="">Tutti gli animali</option>'+data.animals.map(a=>`<option value="${a.id}">${esc(animalLabel(a))}</option>`).join('');
 $('filterAnimal').value=old;
 const filter=$('filterAnimal').value;
 const rows=data.entries.filter(e=>!filter||e.animalId===filter).sort((a,b)=>b.date.localeCompare(a.date));
 $('entries').innerHTML=rows.map(e=>{const a=data.animals.find(x=>x.id===e.animalId)||{};return `<tr><td>${fmt(e.date)}</td><td>${esc(a.name||a.species||'Animale')}</td><td>${esc(a.sex||'')}</td><td>${esc(e.food)}</td><td>${esc([e.quantity,e.notes].filter(Boolean).join(' · ')||'—')}</td><td><button class="delete" data-del="${e.id}" aria-label="Elimina">×</button></td></tr>`}).join('');
 $('empty').hidden=rows.length>0;
 $('weights').innerHTML=data.weights.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(w=>{let a=data.animals.find(x=>x.id===w.animalId)||{};return `<div class="weight-row"><strong>${esc(a.name||a.species||'Animale')}</strong> — ${w.value} g <span> · ${fmt(w.date)}</span></div>`}).join('')||'<p class="empty">Nessuna pesata registrata.</p>';
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(s){if(!s)return '';let [y,m,d]=s.split('-');return `${d}/${m}/${y}`;}
function parseMessage(raw){
 let text=raw.toLowerCase(), found=[];
 // Split around conjunctions when a second animal is named.
 let chunks=text.split(/\s+(?:e anche|e poi|mentre|e il|e la|e l['’])\s+/);
 if(chunks.length===1) chunks=[text];
 for(const a of data.animals){
  const species=a.species.toLowerCase(), sex=a.sex.toLowerCase(), name=(a.name||'').toLowerCase();
  let matched=chunks.filter(c=>(c.includes(species)|| (name&&c.includes(name))) && (sex==='non specificato'||c.includes(sex)||chunks.length===1));
  if(!matched.length && chunks.length===1 && text.includes(species)) matched=[text];
  for(const c of matched){
   let food='Alimento da precisare';
   const m=c.match(/(?:ha(?:nno)? mangiat[oaie]?|mangia(?:to|ta|ti|te)?)\s+(?:la\s+|il\s+|i\s+|gli\s+|un[ao]?\s+)?(.+?)(?:\s+(?:alle|verso)\s+\d.*)?$/i);
   if(m) food=m[1].replace(/[.,;]+$/,'').trim();
   else if(c.includes('pappin')) food='Pappina';
   else if(c.includes('grill')) food=(c.match(/\d+\s+grill\w*/)||['Grilli'])[0];
   found.push({animalId:a.id,food,quantity:'',notes:'',date:today()});
  }
 }
 // Fallback: one named animal and generic food.
 if(!found.length){
  const a=data.animals.find(a=>text.includes(a.species.toLowerCase())||(a.name&&text.includes(a.name.toLowerCase())));
  if(a){let food=text.split(/ha mangiato|hanno mangiato|mangiato/).pop().trim()||'Da precisare';found.push({animalId:a.id,food,quantity:'',notes:'',date:today()});}
 }
 return found;
}
function showDraft(items){
 draft=items;$('preview').innerHTML='';
 if(!items.length){$('preview').innerHTML='<p class="hint">Non ho riconosciuto con certezza l’animale. Controlla che sia presente nella sezione Animali oppure aggiungilo.</p>';return;}
 $('preview').innerHTML='<h3>Controlla le registrazioni</h3>'+items.map((e,i)=>{let a=data.animals.find(x=>x.id===e.animalId)||{};return `<div class="preview-row"><div><label>Animale</label><strong>${esc(animalLabel(a))}</strong></div><div><label>Alimento</label><input data-food="${i}" value="${esc(e.food)}"></div><div><label>Quantità (facoltativa)</label><input data-qty="${i}" value="${esc(e.quantity)}" placeholder="Es. 3 grilli"></div><div><label>Note (facoltative)</label><input data-note="${i}" value="${esc(e.notes)}"></div></div>`}).join('')+'<div class="preview-actions"><button id="saveEntries" class="primary">Salva nel diario</button><button id="clearDraft" class="quiet">Annulla</button></div>';
 $('saveEntries').onclick=()=>{draft.forEach((e,i)=>{e.food=$(`[data-food="${i}"]`).value.trim()||'Da precisare';e.quantity=$(`[data-qty="${i}"]`).value.trim();e.notes=$(`[data-note="${i}"]`).value.trim();data.entries.push({...e,id:crypto.randomUUID()});});$('message').value='';$('preview').innerHTML='<p class="hint">Registrazioni salvate nel diario.</p>';draft=[];persist();};
 $('clearDraft').onclick=()=>$('preview').innerHTML='';
}
$('parseBtn').onclick=()=>showDraft(parseMessage($('message').value.trim()));
$('filterAnimal').onchange=render;
$('addAnimalBtn').onclick=()=>$('animalDialog').showModal();
$('animalForm').onsubmit=e=>{if(e.submitter?.id!=='saveAnimal')return;e.preventDefault();data.animals.push({id:crypto.randomUUID(),species:$('aSpecies').value.trim(),sex:$('aSex').value,name:$('aName').value.trim()});$('animalDialog').close();e.target.reset();persist();};
$('weightBtn').onclick=()=>{$('wAnimal').innerHTML=data.animals.map(a=>`<option value="${a.id}">${esc(animalLabel(a))}</option>`).join('');$('wDate').value=today();$('weightDialog').showModal();};
$('weightForm').onsubmit=e=>{if(!e.submitter?.value)return;e.preventDefault();data.weights.push({animalId:$('wAnimal').value,value:Number($('wValue').value),date:$('wDate').value});$('weightDialog').close();e.target.reset();persist();};
$('entries').onclick=e=>{let id=e.target.dataset.del;if(id&&confirm('Eliminare questa registrazione?')){data.entries=data.entries.filter(x=>x.id!==id);persist();}};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='exotic-tracker-backup.json';a.click();URL.revokeObjectURL(url);};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();