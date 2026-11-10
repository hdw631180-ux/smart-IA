# SMART AI

Assistant IA 100 % statique, prévu pour GitHub Pages. Il ne contient **aucune réponse préprogrammée** : les réponses viennent soit d'un modèle local (navigateur), soit d'une API que vous configurez. Sans modèle connecté, l'application affiche une erreur claire.

## Publier sur GitHub Pages
1. Créez un dépôt et placez-y tous les fichiers à la racine.
2. Settings → Pages → Source : `main` / `(root)`.
3. Ouvrez `https://<utilisateur>.github.io/<depot>/`.
En local : `python3 -m http.server` puis http://localhost:8000 (les modules ES exigent http, pas `file://`).

## Modes
- **Local** : WebLLM (WebGPU), chargé depuis `esm.run` (version fixée dans `model-manager.js`). Le modèle se télécharge au premier message puis reste en cache du navigateur. Réglages → « Modèle local » (liste : documentation WebLLM). Un petit modèle est nettement moins capable qu'un grand modèle distant. Nécessite un navigateur avec WebGPU.
- **Connecté** : toute API compatible OpenAI `/chat/completions` (OpenAI, OpenRouter, Groq, proxy perso). Réglages → fournisseur, URL, clé, modèle. Gère 401, 429 et erreurs réseau ; 1 requête/seconde maximum côté client.
- **Hybride** : outils locaux et demandes courtes en local, demandes complexes vers l'API si elle est configurée.

## Sécurité
- Ne mettez jamais de clé secrète dans le code. Une clé saisie dans Réglages reste dans le `localStorage` de votre navigateur : elle est visible du code client. Pour une clé secrète, déployez un proxy (Cloudflare Worker, etc.) et mettez son URL comme « URL de l'API ».
- Rien n'est mémorisé sans demande explicite (« retiens que… ») ; les informations sensibles (mots de passe, numéros de carte, clés…) sont refusées. Mémoire → « Tout effacer » supprime tout.

## Outils
Calculatrice (sans `eval`), notes (`note : …`), mémoire (`retiens que…`, `oublie…`), documents de connaissance (import dans Mémoire, recherche par mots-clés), analyse de texte (module disponible dans `tools.js`), recherche web via un service JSON que vous fournissez (Réglages, URL avec `{q}`, réponse `{results:[{title,url,snippet}]}`). Sans service configuré, la recherche échoue explicitement.

## Mémoire vs apprentissage
La mémoire stocke des textes réinjectés dans le contexte du modèle. Le modèle lui-même n'est **pas** entraîné.

## Tests
Ouvrez `tests.html` via un serveur local : chaque ligne affiche OK ou ECHEC.

## Fichiers
`app.js` (interface), `ai-engine.js` (orchestration), `reasoning.js` (intentions), `model-manager.js` (local/API), `memory.js`, `knowledge.js`, `tools.js`, `conversation.js`, `settings.js`, `storage.js`.

## Connexion à Google Gemini (par défaut)
Au premier lancement, collez votre clé API (AI Studio ou Vertex AI express) dans la carte « Connecter » : elle est conservée dans le `localStorage` de votre navigateur uniquement. Modèle par défaut : `gemini-3.8-flash` (modifiable dans Réglages ; les identifiants de modèles Google changent régulièrement). Si la clé est refusée (401/403) avec « Google Gemini », essayez « Google Vertex AI (express) ». Ne commitez jamais la clé dans le dépôt ; dans la console Google, limitez-la à votre domaine `*.github.io`.

## Base de connaissances et vitesse
`base.json` (liste de `{name,text}`) est la base intégrée : remplacez-la par vos propres contenus. Les documents importés dans Mémoire s'y ajoutent. La recherche BM25 injecte les extraits pertinents et affiche leurs sources. Le sélecteur « Rapide / Équilibré / Approfondi » règle `thinkingLevel` des modèles Gemini 3 (Rapide = `low`).

## Mode gratuit sans clé (par défaut)
Aucune configuration : le fournisseur « Gratuit, sans clé » appelle le service public Pollinations (modèle `openai-fast`). Limites : service tiers non garanti (débit, disponibilité, conditions), messages envoyés à ce service, qualité moyenne. En cas d'échec, bascule automatique sur le modèle local si WebGPU est disponible. Pour la qualité et la confidentialité, passez sur Gemini avec votre clé dans Réglages. Aucune clé n'est jamais envoyée au service gratuit.

## SMART 1.1 (agent)
`agent.js` : boucle outil → résultat → réponse (4 étapes max) par protocole texte `<outil>{"nom":…,"args":…}</outil>`, compatible avec tous les fournisseurs. Outils : calculer, connaissances, memoire, date_heure, analyser_texte, recherche_web (service configuré), ajouter_note (sur demande). Désactivable dans Réglages ; inactif en mode local.
