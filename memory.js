import {store} from './storage.js';
// Mémoire à long terme : uniquement ce que l'utilisateur demande explicitement de retenir.
const SENS=/(mot de passe|password|iban|carte (bancaire|bleue)|\b\d{13,19}\b|sécu|secret|api[-_ ]?key|token)/i;
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,4);
export const memory={
 list:()=>store.get('mem',[]),
 add(text){text=text.trim();if(!text)return{error:'Rien à mémoriser.'};
  if(SENS.test(text))return{error:'Information sensible : je ne la mémorise pas.'};
  const e={id:id(),text,at:Date.now()};store.set('mem',[...memory.list(),e]);return e},
 update(i,text){store.set('mem',memory.list().map(e=>e.id===i?{...e,text}:e))},
 remove(i){store.set('mem',memory.list().filter(e=>e.id!==i))},
 search(q){const w=q.toLowerCase().split(/\W+/).filter(x=>x.length>2);
  return memory.list().map(e=>({e,s:w.filter(x=>e.text.toLowerCase().includes(x)).length})).filter(x=>x.s).sort((a,b)=>b.s-a.s).map(x=>x.e)},
 clear:()=>store.del('mem')
};
