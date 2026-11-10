import {store} from './storage.js';
// Base de connaissances : base.json (intégrée, modifiable) + documents importés. Recherche BM25 avec racinisation légère.
const tok=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>2).map(w=>w.replace(/(ations?|ements?|ment|eurs?|euses?|ions?|es|s|x)$/,''));
let base=null;
const load=()=>base||(base=fetch('base.json').then(r=>r.ok?r.json():[]).catch(()=>[]));
const chunks=d=>{const o=[];for(let i=0;i<d.text.length;i+=700)o.push({name:d.name,text:d.text.slice(i,i+900)});return o};
export const knowledge={
 list:()=>store.get('kb',[]),
 add(name,text){store.set('kb',[...knowledge.list(),{id:Date.now().toString(36),name,text}])},
 remove(i){store.set('kb',knowledge.list().filter(d=>d.id!==i))},
 async search(q,n=3){const qt=[...new Set(tok(q))];if(!qt.length)return[];
  const cs=[...(await load()),...knowledge.list()].flatMap(chunks).map(c=>({...c,t:tok(c.text)}));
  const N=cs.length;if(!N)return[];const avg=cs.reduce((a,c)=>a+c.t.length,0)/N||1;
  const df=Object.fromEntries(qt.map(w=>[w,cs.filter(c=>c.t.includes(w)).length]));
  return cs.map(c=>{let s=0;for(const w of qt){const f=c.t.filter(x=>x===w).length;
    if(f)s+=Math.log(1+(N-df[w]+.5)/(df[w]+.5))*f*2.2/(f+1.2*(.25+.75*c.t.length/avg))}return{...c,s}})
   .filter(c=>c.s>1).sort((a,b)=>b.s-a.s).slice(0,n)}
};
