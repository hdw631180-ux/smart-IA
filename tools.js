import {store} from './storage.js';
import {settings} from './settings.js';
// Calculatrice sûre (analyseur récursif, sans eval).
export function calc(src){
 const T=src.toLowerCase().replace(/,/g,'.').match(/\d*\.?\d+|[a-z]+|[-+*/^()%]/g)||[];let i=0;
 const F={sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos,tan:Math.tan,log:Math.log10,ln:Math.log,abs:Math.abs},C={pi:Math.PI,e:Math.E};
 const peek=()=>T[i],next=()=>T[i++],has=(o,k)=>Object.hasOwn(o,k);
 function expr(){let v=term();while(peek()=='+'||peek()=='-')v=next()=='+'?v+term():v-term();return v}
 function term(){let v=unary();while(['*','/','%'].includes(peek())){const o=next(),r=unary();v=o=='*'?v*r:o=='/'?v/r:v%r}return v}
 function unary(){if(peek()=='-'){next();return -unary()}if(peek()=='+'){next();return unary()}return pow()}
 function pow(){const b=atom();if(peek()=='^'){next();return Math.pow(b,unary())}return b}
 function atom(){const t=next();if(t===undefined)throw Error('Expression incomplète');
  if(t=='('){const v=expr();if(next()!=')')throw Error('Parenthèse manquante');return v}
  if(/^[\d.]/.test(t))return parseFloat(t);if(has(C,t))return C[t];if(has(F,t))return F[t](atom());
  throw Error('Symbole inconnu : '+t)}
 const v=expr();if(i<T.length)throw Error('Expression invalide');
 if(!Number.isFinite(v))throw Error('Résultat non défini');return v}
export const notes={
 list:()=>store.get('notes',[]),
 add(text){const n={id:Date.now().toString(36),text,at:Date.now()};store.set('notes',[...notes.list(),n]);return n}};
export const analyzeText=t=>({mots:t.trim().split(/\s+/).filter(Boolean).length,caracteres:t.length,phrases:(t.match(/[.!?]+(\s|$)/g)||[]).length});
// Recherche Internet : uniquement via un service JSON configuré (URL avec {q}). Jamais simulée.
export async function webSearch(q){
 const u=settings.get().searchUrl;if(!u)throw new Error('Aucun service de recherche configuré (Réglages → URL de recherche).');
 const r=await fetch(u.replace('{q}',encodeURIComponent(q)));if(!r.ok)throw new Error('Recherche : HTTP '+r.status);
 const j=await r.json(),items=(j.results||j.items||[]).slice(0,5);
 if(!items.length)throw new Error('La recherche n\'a renvoyé aucun résultat.');
 return items.map(i=>`- ${i.title||''} ${i.url||i.link||''} ${i.snippet||i.content||''}`).join('\n')}
