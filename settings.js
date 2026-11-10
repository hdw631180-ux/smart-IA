import {store} from './storage.js';
export const PERSONAS={
 pro:'Tu es un assistant professionnel, clair et concis.',
 science:'Tu es un assistant scientifique rigoureux : précise tes hypothèses et tes incertitudes.',
 dev:'Tu es un assistant développeur : réponds avec du code correct et commenté.',
 creatif:'Tu es un assistant créatif, imaginatif et inspirant.',
 pedago:'Tu es un assistant pédagogue : explique étape par étape avec des exemples.',
 conv:'Tu es un assistant conversationnel, chaleureux et naturel.'};
export const PERSONA_NAMES={pro:'Professionnel',science:'Scientifique',dev:'Développeur',creatif:'Créatif',pedago:'Pédagogique',conv:'Conversationnel'};
export const PROVIDERS={
 openai:{url:'https://api.openai.com/v1',model:'gpt-4o-mini'},
 openrouter:{url:'https://openrouter.ai/api/v1',model:'openrouter/auto'},
 groq:{url:'https://api.groq.com/openai/v1',model:'llama-3.3-70b-versatile'},
 custom:{url:'',model:''}};
const D={mode:'local',provider:'openai',baseUrl:PROVIDERS.openai.url,model:PROVIDERS.openai.model,apiKey:'',
 localModel:'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',persona:'pro',custom:'',searchUrl:''};
export const settings={get:()=>({...D,...store.get('settings',{})}),set:p=>store.set('settings',{...settings.get(),...p})};
