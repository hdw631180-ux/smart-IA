// Compréhension + sélection des modules : classe la demande par intention et complexité.
export function analyze(text){
 const x=text.trim(),e=x.replace(/^(calcule|combien (font|fait)|=)\s*/i,'').replace(/\?$/,'').trim();let intent='chat';
 if(/^(retiens|mémorise|souviens[- ]toi)\b/i.test(x))intent='memory.save';
 else if(/^(oublie|supprime de ta mémoire)\b/i.test(x))intent='memory.forget';
 else if(/^(note|ajoute une note)\s*:/i.test(x))intent='note';
 else if(/(cherche|recherche).*(internet|web|en ligne)/i.test(x))intent='search';
 else if(/\d/.test(e)&&/[-+*/^%]|sqrt|sin|cos|tan|ln|log/i.test(e)&&/^[\d\s+\-*/^().,%a-z]+$/i.test(e)&&!/[a-z]{4,}\s+[a-z]{3,}/i.test(e))intent='calc';
 const complexity=x.length>240||/```|analyse|compare|explique|rédige|traduis|résume|code/i.test(x)?'high':'low';
 return{intent,expr:e,complexity,ambiguous:x.length<30&&/\b(ça|cela|ce truc|il|elle)\b/i.test(x)};
}
