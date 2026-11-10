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
 gemini:{label:'Google Gemini (AI Studio)',type:'gemini',url:'https://generativelanguage.googleapis.com/v1beta',model:'gemini-3.8-flash'},
 vertex:{label:'Google Vertex AI (express)',type:'gemini',url:'https://aiplatform.googleapis.com/v1/publishers/google',model:'gemini-3.8-flash'},
 openai:{label:'OpenAI',url:'https://api.openai.com/v1',model:'gpt-4o-mini'},
 openrouter:{label:'OpenRouter',url:'https://openrouter.ai/api/v1',model:'openrouter/auto'},
 groq:{label:'Groq',url:'https://api.groq.com/openai/v1',model:'llama-3.3-70b-versatile'},
 custom:{label:'Personnalisé / proxy (compatible OpenAI)',url:'',model:''}};
const D={mode:'remote',provider:'gemini',baseUrl:PROVIDERS.gemini.url,model:PROVIDERS.gemini.model,apiKey:'',
 localModel:'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',persona:'pro',custom:'',searchUrl:''};
export const settings={get:()=>({...D,...store.get('settings',{})}),set:p=>store.set('settings',{...settings.get(),...p})};
