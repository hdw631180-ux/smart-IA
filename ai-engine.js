import {settings,PERSONAS} from './settings.js';
import {memory} from './memory.js';
import {knowledge} from './knowledge.js';
import {analyze} from './reasoning.js';
import {calc,notes,webSearch} from './tools.js';
import {stream,pickMode} from './model-manager.js';
// Orchestrateur : choisit outil local ou modèle, injecte mémoire + connaissances dans le contexte.
export async function* respond(history,{signal,onStatus,onSources}={}){
 const s=settings.get(),text=history.at(-1).content,a=analyze(text);let extra='';
 try{
  if(a.intent==='memory.save'){const r=memory.add(text.replace(/^(retiens|mémorise|souviens[- ]toi)( que| de)?\s*/i,''));
   yield r.error?'⚠️ '+r.error:`Mémorisé : « ${r.text} ». Consultable et supprimable dans Mémoire.`;return}
  if(a.intent==='memory.forget'){const m=memory.search(text.replace(/^\S+\s*(que|de)?\s*/i,''));m.forEach(e=>memory.remove(e.id));
   yield m.length?`${m.length} souvenir(s) supprimé(s).`:'Aucun souvenir correspondant.';return}
  if(a.intent==='note'){yield`Note enregistrée : ${notes.add(text.replace(/^[^:]+:\s*/,'')).text}`;return}
  if(a.intent==='calc'){const v=calc(a.expr);yield`${a.expr} = **${+v.toPrecision(12)}**`;return}
  if(a.intent==='search')extra='Résultats de recherche web :\n'+await webSearch(text);
 }catch(err){if(a.intent==='search')throw err;} // autre outil en échec : repli sur le modèle
 const mem=memory.search(text).slice(0,5).map(e=>'- '+e.text).join('\n');
 const hits=await knowledge.search(text);onSources?.([...new Set(hits.map(h=>h.name))]);const kb=hits.map(k=>`[${k.name}] ${k.text}`).join('\n---\n');
 const sys=[PERSONAS[s.persona],s.custom,
  'Réponds en français sauf demande contraire. Va droit au but : la réponse d\'abord, puis les détails utiles, en Markdown structuré (listes, tableaux, blocs de code). Si la demande est ambiguë, pose une seule question de précision. Si tu n\'es pas sûr, dis-le ; n\'invente ni faits, ni chiffres, ni sources. Quand des extraits de documents sont fournis, appuie-toi dessus en priorité et nomme la source entre crochets.',
  mem&&'Souvenirs autorisés de l\'utilisateur :\n'+mem,kb&&'Extraits de ses documents :\n'+kb,extra].filter(Boolean).join('\n\n');
 const msgs=[{role:'system',content:sys},...history.filter(m=>m.content).slice(-12).map(({role,content})=>({role,content:content.slice(0,6000)}))];
 yield*stream(msgs,{mode:pickMode(text,s),signal,onStatus});
}
