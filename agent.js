import {stream} from './model-manager.js';
import {calc,notes,analyzeText,webSearch} from './tools.js';
import {knowledge} from './knowledge.js';
import {memory} from './memory.js';
import {settings} from './settings.js';
// Agent SMART 1.1 : boucle outil → résultat → réponse (4 étapes max). Fonctionne avec tout modèle, sans « function calling » natif.
const MAX=4;
const TOOLS={
 calculer:a=>String(+calc(String(a.expression)).toPrecision(12)),
 connaissances:async(a,c)=>{const h=await knowledge.search(String(a.requete),3);h.forEach(x=>c.sources.add(x.name));return h.length?h.map(x=>`[${x.name}] ${x.text}`).join('\n---\n'):'Aucun résultat.'},
 memoire:a=>{const m=memory.search(String(a.requete)).slice(0,5);return m.length?m.map(e=>'- '+e.text).join('\n'):'Aucun souvenir.'},
 date_heure:()=>new Date().toLocaleString('fr-FR',{dateStyle:'full',timeStyle:'short'}),
 analyser_texte:a=>JSON.stringify(analyzeText(String(a.texte))),
 recherche_web:a=>webSearch(String(a.requete)),
 ajouter_note:a=>'Note enregistrée : '+notes.add(String(a.texte)).text};
const prompt=(u,s)=>`Tu es SMART 1.1, un agent qui utilise des outils pour répondre avec exactitude. Pour appeler un outil, réponds UNIQUEMENT par : <outil>{"nom":"...","args":{...}}</outil> (un seul outil à la fois, puis attends le résultat). Quand tu as assez d'informations, réponds directement, sans balise. N'utilise un outil que s'il est utile, et vérifie la cohérence du résultat avant de le présenter. Outils :
- calculer {"expression":"2+3*4"} : calcul exact (+ - * / ^ % sqrt sin cos tan log ln abs pi e)
- connaissances {"requete":"..."} : cherche dans la base de connaissances et les documents de l'utilisateur
- memoire {"requete":"..."} : cherche dans les souvenirs que l'utilisateur a demandé de retenir
- date_heure {} : date et heure actuelles
- analyser_texte {"texte":"..."} : mots, caractères, phrases${s.searchUrl?'\n- recherche_web {"requete":"..."} : recherche Internet':''}${/note/i.test(u)?'\n- ajouter_note {"texte":"..."} : enregistre une note (demandée par l\'utilisateur)':''}`;
export async function* runAgent(msgs,{userText,onStep,onSources,onStatus,...o}){
 const s=settings.get(),sources=new Set(),ctx={sources},fin=()=>{if(sources.size)onSources?.([...sources])};
 const m=[{...msgs[0],content:msgs[0].content+'\n\n'+prompt(userText,s)},...msgs.slice(1)];
 for(let n=0;n<MAX;n++){
  let buf='',mode=null;
  for await(const t of stream(m,{...o,onStatus})){buf+=t;
   if(!mode){const h=buf.trimStart();if(h.length>=6){mode=h.startsWith('<outil')?'tool':'text';if(mode==='text')yield buf}}
   else if(mode==='text')yield t}
  if(!mode){yield buf;return fin()}
  if(mode==='text')return fin();
  const k=buf.match(/<outil>([\s\S]*?)<\/outil>/);
  if(!k){yield buf.replace(/<\/?outil>/g,'');return fin()}
  let name='?',args={},res;
  try{const j=JSON.parse(k[1]);name=String(j.nom);args=j.args||{};
   if(!Object.hasOwn(TOOLS,name)||(name==='recherche_web'&&!s.searchUrl)||(name==='ajouter_note'&&!/note/i.test(userText)))throw new Error('Outil indisponible : '+name);
   onStatus?.('Outil : '+name);res=String(await TOOLS[name](args,ctx))}
  catch(e){res='Erreur : '+e.message}
  res=res.slice(0,3000);onStep?.({tool:name,args:JSON.stringify(args).slice(0,200),result:res.slice(0,400)});
  m.push({role:'assistant',content:buf},{role:'user',content:`Résultat de l'outil ${name} :\n${res}\n\n`+(n>=MAX-2?'Réponds maintenant à l\'utilisateur, sans outil.':'Si ce résultat suffit, réponds ; sinon utilise un autre outil.')})}
 yield 'Je n\'ai pas pu conclure avec les outils disponibles. Reformulez ou précisez votre demande.';fin()}
