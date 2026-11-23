# Reprise du projet : site du mariage de Marie & Olivier

Mariage le samedi 5 décembre 2026, Espace Oratorien, Ouvrouer-les-Champs.
Site en ligne : https://mariage-marieolivier.antoine-bertrand.fr (GitHub Pages, branche `main`, fichier `CNAME`).
Site statique HTML/CSS/JS, sans étape de compilation. Les textes du site et les échanges se font en français.

## À faire en priorité à la reprise

- **Migration Supabase non confirmée.** Le fichier `supabase/migrations/20261024_mo_garde_fous.sql` doit être exécuté
  une fois dans le SQL Editor de Supabase (projet *mariage-souvenirs*). Il ajoute la corbeille des souvenirs
  (colonnes `supprime`), l'historique des plans de table, les limites des espaces de stockage et quelques protections.
  Les outils Supabase de la session n'ont pas pu l'appliquer : ils demandent une confirmation que l'utilisateur ne voit pas.
  Demander à l'utilisateur s'il l'a fait. On peut aussi vérifier si la colonne `supprime` existe dans `mo_envois`.
  Tant que ce n'est pas fait, le bouton « Supprimer » de `souvenirs/admin.html` affiche un message d'attente.
- **Retours à recueillir :** fluidité de l'animation d'ouverture sur un vrai iPhone et sur PC, et nom du navigateur
  si le ruban paraît encore trop court ; photos HEIC et vidéos d'iPhone ; test de la projection sur le PC de la salle ;
  nom exact de la police du faire-part (Cormorant Garamond et EB Garamond sont des équivalents proches).

## Organisation

- `index.html` : page principale, pour la famille. Deux sections, « Pour les invités » et « Pour les organisateurs ».
- Pages invités, sans aucun lien vers le reste du site : `souvenirs/`, `plan-de-table/ma-place.html`, `programme/`.
- Pages organisateurs : `souvenirs/admin.html`, `projection/`, `plan-de-table/`, `planning/`.
- `assets/charte.css` (charte et animation d'ouverture), `assets/commun.js` (configuration Supabase et outils communs),
  `assets/ouverture.js` (ouverture du faire-part), `assets/motifs/` (illustrations détourées du faire-part),
  `assets/vendor/` (bibliothèques servies localement).

## Règles à respecter

- **Pas d'authentification**, choix explicite de l'utilisateur : l'accès repose sur des liens distincts.
- **Supabase partagé** avec le site d'Aude & Jérémie (projet `wrcjthhrouditgbpjegy`). Tout ce qui concerne ce mariage
  est préfixé `mo_` (tables) ou `mo-` (espaces de stockage). Ne jamais toucher aux autres données.
- **Charte :** satin blanc, illustrations toile de Jouy bleues, or avec parcimonie, texte en noir.
  Pas de branches décoratives autour du titre de l'accueil, ni de motifs de fond sur mobile : l'utilisateur les a refusés.
- **Animation d'ouverture** à chaque lancement, sur l'accueil (ouverture au clic) et sur les pages invités.
  N'animer que `transform` et `opacity`, et jamais `opacity` sur un élément 3D (cela dégrade fortement la fluidité).
- **Cache :** à chaque modification, mettre à jour le suffixe `?v=AAAAMMJJHHMM` des liens CSS et JS de toutes les pages :
  `V=$(date +%Y%m%d%H%M); find . -name "*.html" | xargs sed -i -E "s/(\.(css|js))\?v=[0-9]+/\1?v=$V/g"`
- **Commits** au nom de l'utilisateur : `git -c user.name="Famickael" -c user.email="296390398+Famickael@users.noreply.github.com" commit`
  (adresse anonyme GitHub : l'adresse e-mail privée est refusée au push), puis `git push origin main` ; la publication est immédiate.
- Textes destinés aux invités : chaleureux, centrés sur eux, sans remarque technique.
