import {store} from './storage.js';
// Base de connaissances = documents importés par l'utilisateur (aucun fait préprogrammé).
const tok=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>2);
export const knowledge={
 list:()=>store.get('kb',[]),
 add(name,text){store.set('kb',[...knowledge.list(),{id:Date.now().toString(36),name,text}])},
 remove(i){store.set('kb',knowledge.list().filter(d=>d.id!==i))},
 search(q,n=3){const qt=new Set(tok(q));if(!qt.size)return[];const out=[];
  for(const d of knowledge.list())for(let i=0;i<d.text.length;i+=600){const c=d.text.slice(i,i+800);
   const s=tok(c).filter(w=>qt.has(w)).length;if(s>1)out.push({name:d.name,text:c,s})}
  return out.sort((a,b)=>b.s-a.s).slice(0,n)}
};
