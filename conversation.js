import {store} from './storage.js';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
export const convs={
 all:()=>store.get('convs',[]),
 save:a=>store.set('convs',a),
 create(){const c={id:uid(),title:'Nouvelle conversation',messages:[],at:Date.now()};convs.save([c,...convs.all()]);return c},
 get:i=>convs.all().find(c=>c.id===i),
 update(c){convs.save(convs.all().map(x=>x.id===c.id?c:x))},
 remove(i){convs.save(convs.all().filter(c=>c.id!==i))},
 rename(i,t){const c=convs.get(i);if(c){c.title=t;convs.update(c)}},
 export:()=>JSON.stringify({v:1,convs:convs.all()}),
 import(j){const d=JSON.parse(j);if(!Array.isArray(d.convs))throw new Error('Format invalide');
  const ex=new Set(convs.all().map(c=>c.id));
  convs.save([...convs.all(),...d.convs.filter(c=>c.id&&Array.isArray(c.messages)&&!ex.has(c.id))])}
};
