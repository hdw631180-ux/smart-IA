import {settings} from './settings.js';
// Modes : local (WebLLM/WebGPU), remote (API compatible OpenAI), hybrid.
let engine=null,loadedId=null,last=0;
export const hasWebGPU=()=>!!navigator.gpu;
export const remoteReady=(s=settings.get())=>!!(s.baseUrl&&(s.apiKey||s.provider==='custom'));
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
export async function* stream(messages,{mode,onStatus,signal}={}){
 const s=settings.get();
 if(mode==='local'){const e=await loadLocal(s,onStatus);
  signal?.addEventListener('abort',()=>e.interruptGenerate());
  for await(const c of await e.chat.completions.create({messages,stream:true}))yield c.choices[0]?.delta?.content||'';return}
 if(!remoteReady(s))throw new Error('Aucune API configurée : renseignez l\'URL et la clé dans Réglages.');
 const wait=1000-(Date.now()-last);if(wait>0)await new Promise(r=>setTimeout(r,wait));last=Date.now(); // limite client : 1 requête/s
 const r=await fetch(s.baseUrl.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal,
  headers:{'Content-Type':'application/json',...(s.apiKey?{Authorization:'Bearer '+s.apiKey}:{})},
  body:JSON.stringify({model:s.model,messages,stream:true})});
 if(!r.ok){const t=await r.text().catch(()=>'');
  throw new Error(r.status===401?'Clé API refusée (401).':r.status===429?'Limite de requêtes atteinte (429) : réessayez plus tard.':`Erreur API ${r.status} ${t.slice(0,200)}`)}
 const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
 for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
  const lines=buf.split('\n');buf=lines.pop();
  for(const l of lines){if(!l.startsWith('data:'))continue;const d=l.slice(5).trim();if(d==='[DONE]')return;
   try{yield JSON.parse(d).choices[0]?.delta?.content||''}catch{}}}}
