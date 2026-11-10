import {settings,PROVIDERS} from './settings.js';
// Modes : local (WebLLM/WebGPU), remote (Gemini ou API compatible OpenAI), hybrid.
let engine=null,loadedId=null,last=0;
export const hasWebGPU=()=>!!navigator.gpu;
export const remoteReady=(s=settings.get())=>!!(s.baseUrl&&(s.apiKey||s.provider==='custom'||PROVIDERS[s.provider]?.keyless));
export function pickMode(text,s=settings.get()){
 if(s.mode!=='hybrid')return s.mode;
 const complex=text.length>240||/```|code|analyse|explique|compare|rédige|traduis|résume/i.test(text);
 if(complex&&remoteReady(s))return'remote';
 return hasWebGPU()?'local':'remote'}
async function loadLocal(s,onStatus){
 if(!hasWebGPU())throw new Error('WebGPU indisponible sur cet appareil : utilisez le mode connecté.');
 if(engine&&loadedId===s.localModel)return engine;
 const{CreateMLCEngine}=await import('https://esm.run/@mlc-ai/web-llm@0.2.79');
 engine=await CreateMLCEngine(s.localModel,{initProgressCallback:p=>onStatus?.(p.text)});loadedId=s.localModel;return engine}
async function fail(r){const t=await r.text().catch(()=>'');
 throw new Error(r.status===401||r.status===403?`Clé API refusée (${r.status}). Vérifiez la clé et le fournisseur dans Réglages.`:r.status===429?'Limite de requêtes atteinte (429) : réessayez dans un moment.':r.status===404?'Modèle introuvable (404) : changez le modèle dans Réglages.':`Erreur API ${r.status} ${t.slice(0,200)}`)}
async function* sse(r,pick){const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
 for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
  for(const l of lines){if(!l.startsWith('data:'))continue;const d=l.slice(5).trim();if(d==='[DONE]')return;try{yield pick(JSON.parse(d))||''}catch{}}}}
async function* raw(messages,{mode,onStatus,signal}={}){
 const s=settings.get();
 if(mode==='local'){const e=await loadLocal(s,onStatus);
  signal?.addEventListener('abort',()=>e.interruptGenerate());
  for await(const c of await e.chat.completions.create({messages,stream:true}))yield c.choices[0]?.delta?.content||'';return}
 if(!remoteReady(s))throw new Error('Aucune clé API : renseignez-la dans Réglages.');
 const wait=1000-(Date.now()-last);if(wait>0)await new Promise(r=>setTimeout(r,wait));last=Date.now(); // 1 requête/s max côté client
 const base=s.baseUrl.replace(/\/$/,'');let r;
 if(PROVIDERS[s.provider]?.type==='gemini'){
  const sys=messages.find(m=>m.role==='system'),lv={fast:'low',deep:'high'}[s.speed];
  r=await fetch(`${base}/models/${encodeURIComponent(s.model)}:streamGenerateContent?alt=sse`,{method:'POST',signal,
   headers:{'Content-Type':'application/json','x-goog-api-key':s.apiKey},
   body:JSON.stringify({systemInstruction:sys&&{parts:[{text:sys.content}]},generationConfig:lv&&/gemini-3/.test(s.model)?{thinkingConfig:{thinkingLevel:lv}}:undefined,contents:messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))})});
  if(!r.ok)await fail(r);
  yield*sse(r,j=>j.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join(''));return}
 r=await fetch(base+'/chat/completions',{method:'POST',signal,
  headers:{'Content-Type':'application/json',...(s.apiKey&&!PROVIDERS[s.provider]?.keyless?{Authorization:'Bearer '+s.apiKey}:{})},
  body:JSON.stringify({model:s.model,messages,stream:true,...(PROVIDERS[s.provider]?.keyless?{private:true}:{})})});
 if(!r.ok)await fail(r);
 yield*sse(r,j=>j.choices[0]?.delta?.content)}
// Service gratuit sans clé : si indisponible, repli automatique sur le modèle local (WebGPU) quand c'est possible.
export async function* stream(messages,o={}){const s=settings.get();let started=false;
 try{for await(const t of raw(messages,o)){started=true;yield t}}
 catch(e){if(o.signal?.aborted)throw e;
  if(!started&&o.mode!=='local'&&PROVIDERS[s.provider]?.keyless&&hasWebGPU()){o.onStatus?.('Service gratuit indisponible : passage en local…');yield*raw(messages,{...o,mode:'local'});return}
  throw e.name==='TypeError'?new Error('Connexion impossible : réseau coupé ou service indisponible.'):e}}
