import {convs} from './conversation.js';
import {settings,PERSONA_NAMES,PROVIDERS} from './settings.js';
import {memory} from './memory.js';
import {knowledge} from './knowledge.js';
import {respond} from './ai-engine.js';
import {store} from './storage.js';
const $=s=>document.querySelector(s);
let cur=convs.all()[0]||convs.create(),ctrl=null,busyNow=false;
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hl=c=>esc(c).replace(/(\/\/.*|#\s.*)|(&quot;.*?&quot;|'.*?')|\b(function|const|let|var|return|if|else|for|while|class|import|export|def|async|await|new|true|false|null)\b/g,(m,a,b)=>`<i class="${a?'c':b?'s':'k'}">${m}</i>`);
const inline=t=>esc(t).replace(/^### (.*)$/gm,'<h4>$1</h4>').replace(/^#{1,2} (.*)$/gm,'<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/^[-*] (.*)$/gm,'• $1').replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>');
function md(t){const p=t.split(/```(\w*)\n?([\s\S]*?)(?:```|$)/);let o='';
 for(let i=0;i<p.length;i+=3){o+=inline(p[i]);if(i+2<p.length)o+=`<pre><code>${hl(p[i+2])}</code></pre>`}return o}
function render(){
 $('#title').textContent=cur.title;$('#badge').textContent=settings.get().mode;
 $('#msgs').innerHTML=cur.messages.map((m,i)=>`<div class="m ${m.role}"><div class="b">${m.role==='user'?esc(m.content).replace(/\n/g,'<br>'):m.content?md(m.content):m.error?'':'<span class="dots"></span>'}${m.error?`<p class="err">${esc(m.error)}</p>`:''}</div><div class="a"><button data-a="copy" data-i="${i}">Copier</button>${m.role==='user'?`<button data-a="edit" data-i="${i}">Modifier</button>`:i===cur.messages.length-1&&!busyNow?`<button data-a="regen" data-i="${i}">Régénérer</button>`:''}</div></div>`).join('');
 $('#list').innerHTML=convs.all().map(c=>`<li class="${c.id===cur.id?'on':''}" data-id="${c.id}"><span>${esc(c.title)}</span><button data-a="ren">✎</button><button data-a="del">🗑</button></li>`).join('');
 $('#msgs').scrollTop=1e9}
const busy=b=>{busyNow=b;$('#send').hidden=b;$('#stop').hidden=!b};
async function generate(){
 cur.messages.push({role:'assistant',content:''});const m=cur.messages.at(-1);
 ctrl=new AbortController();busy(true);render();
 try{for await(const t of respond(cur.messages.slice(0,-1),{signal:ctrl.signal,onStatus:s=>$('#badge').textContent=s})){m.content+=t;render()}}
 catch(e){if(!ctrl.signal.aborted)m.error=e.message}
 finally{busy(false);if(!m.content&&!m.error)cur.messages.pop();try{convs.update(cur)}catch(e){alert(e.message)}$('#badge').textContent=settings.get().mode;render()}}
$('#form').onsubmit=e=>{e.preventDefault();if(busyNow)return;const v=$('#inp').value.trim();if(!v)return;$('#inp').value='';
 cur.messages.push({role:'user',content:v});if(cur.messages.length===1)cur.title=v.slice(0,40);generate()};
$('#inp').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#form').requestSubmit()}};
$('#stop').onclick=()=>ctrl?.abort();
$('#msgs').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i,m=cur.messages[i];
 if(b.dataset.a==='copy')navigator.clipboard.writeText(m.content);
 if(b.dataset.a==='regen'){cur.messages.pop();generate()}
 if(b.dataset.a==='edit'){const t=prompt('Modifier le message',m.content);if(t?.trim()){cur.messages.length=i;cur.messages.push({role:'user',content:t.trim()});generate()}}};
$('#list').onclick=e=>{const li=e.target.closest('li');if(!li)return;const id=li.dataset.id,a=e.target.dataset.a;
 if(a==='del'){if(!confirm('Supprimer cette conversation ?'))return;convs.remove(id);if(id===cur.id)cur=convs.all()[0]||convs.create()}
 else if(a==='ren'){const t=prompt('Nouveau titre',convs.get(id).title);if(t?.trim())convs.rename(id,t.trim());cur=convs.get(cur.id)}
 else cur=convs.get(id);render();$('#side').classList.remove('open')};
$('#new').onclick=()=>{cur=convs.create();render();$('#side').classList.remove('open')};
$('#menu').onclick=()=>$('#side').classList.toggle('open');
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([convs.export()],{type:'application/json'}));a.download='smart-ai-conversations.json';a.click()};
$('#imp').onchange=async e=>{try{convs.import(await e.target.files[0].text());render()}catch(x){alert('Import impossible : '+x.message)}e.target.value=''};
const dlg=$('#dlg'),open=()=>dlg.open||dlg.showModal();
const sel=(id,l,o,v)=>`<label>${l}<select id="${id}">${o.map(([k,n])=>`<option value="${k}" ${k===v?'selected':''}>${n}</option>`).join('')}</select></label>`;
const fld=(id,l,v,t='text')=>`<label>${l}<input id="${id}" type="${t}" value="${esc(v)}"></label>`;
$('#setBtn').onclick=()=>{const s=settings.get();
 dlg.innerHTML=`<h3>Réglages</h3>${sel('s_mode','Mode',[['local','Local (WebGPU)'],['remote','Connecté (API)'],['hybrid','Hybride']],s.mode)}
 ${sel('s_prov','Fournisseur',Object.keys(PROVIDERS).map(k=>[k,k]),s.provider)}${fld('s_url','URL de l\'API (compatible OpenAI)',s.baseUrl)}
 ${fld('s_key','Clé API',s.apiKey,'password')}<p class="warn">La clé est stockée dans ce navigateur et reste visible du code client. Pour une clé secrète, passez par un proxy.</p>
 ${fld('s_model','Modèle distant',s.model)}${fld('s_local','Modèle local (WebLLM)',s.localModel)}
 ${sel('s_pers','Personnalité',Object.entries(PERSONA_NAMES),s.persona)}
 <label>Instructions personnalisées<textarea id="s_cust" rows="3">${esc(s.custom)}</textarea></label>${fld('s_search','Service de recherche (URL avec {q}, renvoie du JSON)',s.searchUrl)}
 <button id="s_ok">Enregistrer</button> <button id="s_cl">Annuler</button>`;open();
 $('#s_prov').onchange=e=>{const p=PROVIDERS[e.target.value];$('#s_url').value=p.url;$('#s_model').value=p.model};
 $('#s_cl').onclick=()=>dlg.close();
 $('#s_ok').onclick=()=>{settings.set({mode:$('#s_mode').value,provider:$('#s_prov').value,baseUrl:$('#s_url').value.trim(),apiKey:$('#s_key').value.trim(),model:$('#s_model').value.trim(),localModel:$('#s_local').value.trim(),persona:$('#s_pers').value,custom:$('#s_cust').value,searchUrl:$('#s_search').value.trim()});dlg.close();render()}};
function memDlg(){
 dlg.innerHTML=`<h3>Mémoire</h3><ul class="ml">${memory.list().map(e=>`<li>${esc(e.text)}<button data-m="${e.id}">✕</button></li>`).join('')||'<li>Aucun souvenir. Écrivez « retiens que… » dans le chat.</li>'}</ul>
 <input id="mnew" placeholder="Ajouter un souvenir"><button id="madd">Ajouter</button>
 <h3>Documents de connaissance</h3><ul class="ml">${knowledge.list().map(k=>`<li>${esc(k.name)}<button data-k="${k.id}">✕</button></li>`).join('')||'<li>Aucun document.</li>'}</ul>
 <input id="kf" type="file" accept=".txt,.md,.csv,.json,.js,.html"><p><button id="mclr">Tout effacer</button> <button id="mcl">Fermer</button></p>`;open();
 dlg.onclick=e=>{const b=e.target;
  if(b.dataset.m){memory.remove(b.dataset.m);memDlg()}if(b.dataset.k){knowledge.remove(b.dataset.k);memDlg()}
  if(b.id==='madd'){const r=memory.add($('#mnew').value);if(r.error)alert(r.error);memDlg()}
  if(b.id==='mcl')dlg.close();
  if(b.id==='mclr'&&confirm('Effacer mémoire, documents, notes, conversations et réglages ?')){store.clear();location.reload()}};
 $('#kf').onchange=async e=>{const f=e.target.files[0];if(f){try{knowledge.add(f.name,await f.text())}catch(x){alert(x.message)}memDlg()}}}
$('#memBtn').onclick=memDlg;
render();
