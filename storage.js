// Stockage local (localStorage). Toutes les clés sont préfixées « sai: ».
export const store={
 get(k,d){try{return JSON.parse(localStorage.getItem('sai:'+k))??d}catch{return d}},
 set(k,v){try{localStorage.setItem('sai:'+k,JSON.stringify(v))}catch{throw new Error('Stockage plein : exportez ou supprimez des données.')}},
 del(k){localStorage.removeItem('sai:'+k)},
 clear(){Object.keys(localStorage).filter(k=>k.startsWith('sai:')).forEach(k=>localStorage.removeItem(k))}
};
