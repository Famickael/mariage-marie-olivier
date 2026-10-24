# Mariage de Marie & Olivier · 5 décembre 2026

Site statique (HTML/CSS/JS, sans compilation) + Supabase pour les données. Charte du faire-part : blanc satiné, bleu de toile de Jouy, une touche d'or.

- Site : https://mariage-marieolivier.antoine-bertrand.fr/ (sous-domaine OVH pointant sur GitHub Pages, branche `main` ; adresse technique https://famickael.github.io/mariage-marie-olivier/). Les motifs du faire-part sont dans `assets/motifs/`, la charte dans `assets/charte.css`.
- Base : projet Supabase `wrcjthhrouditgbpjegy`, **partagé avec le site d'Aude & Jérémie**. Les tables, fonctions et espaces de stockage de ce mariage sont préfixés `mo_` / `mo-` ; ceux d'Aude et Jérémie (`envois`, `fichiers`, `programme`, bucket `mariage`) sont intacts.

## Les pages

| Adresse | Pour qui | Rôle |
|---|---|---|
| `/` | famille, Marie & Olivier | Page principale : tous les outils, avec « Ouvrir », « Copier le lien » et « QR code » (`/coulisses/` y renvoie) |
| `/souvenirs/` | invités | Dépôt de photos, vidéos et mots (envoi par morceaux, reprise en cas de coupure) |
| `/plan-de-table/ma-place.html` | invités | « Trouver ma table » : nom → table, voisins, mini-plan (seulement si un plan est publié) |
| `/programme/` | invités | Le déroulé, uniquement les moments cochés « visibles des invités » |
| `/planning/` | organisateurs | Le programme détaillé, minute par minute ; lecture avec le lien, modification une fois connecté |
| `/plan-de-table/` | Marie & Olivier (connexion) | L'éditeur de plan de table |
| `/souvenirs/admin.html` | Marie & Olivier (connexion) | Trier, masquer, télécharger les souvenirs (zip) |
| `/projection/` | Marie & Olivier (connexion) | Diaporama de la soirée, avec QR code vers `/souvenirs/` |

Aucune page invité ne contient de lien vers une autre page : chacun ne voit que ce qu'on lui donne.

## Mise en route

1. **Supabase** : `supabase/schema.sql` est déjà appliqué (migration `mariage_marie_olivier`). Pour repartir de zéro sur un autre projet, l'exécuter dans l'éditeur SQL.
2. **Comptes** : Authentication > Users > *Add user* pour Marie et Olivier. Attention : le projet étant partagé, **tout compte connecté peut modifier les deux sites** (celui d'Aude & Jérémie compris).
3. **Configuration** : `assets/commun.js` contient déjà l'URL et la clé `anon` du projet. Cette clé est publique par conception ; ce que chacun peut faire est décidé par les règles en base (RLS).
4. **Hébergement** : GitHub Pages (Settings > Pages > *Deploy from a branch* > `main` / `(root)`), domaine personnalisé `mariage-marieolivier.antoine-bertrand.fr` (fichier `CNAME`). Côté OVH, zone DNS du domaine : un enregistrement `CNAME`, sous-domaine `mariage-marieolivier`, cible `famickael.github.io.`. Puis Settings > Pages > *Custom domain* = `mariage-marieolivier.antoine-bertrand.fr`, attendre la vérification DNS, cocher *Enforce HTTPS*. La racine `antoine-bertrand.fr` reste libre pour d'autres usages.
5. **Test avant diffusion** : depuis un téléphone, déposer une photo et une vidéo sur `/souvenirs/`, vérifier dans `/souvenirs/admin.html`, puis publier un plan de table et chercher un nom dans `/plan-de-table/ma-place.html`.
6. Ouvrir la page principale et distribuer les liens.

## La salle

Grande salle de l'Espace Oratorien (Ouvrouer-les-Champs) : 140 m², environ 17,3 × 8 m. Le plan de départ reprend le plan d'architecte (`assets/plan-salle.webp`, en fond et à l'échelle) : bar à gauche, baies vitrées côté terrasse, entrée par le sas, écran cinéma, sono.
Mobilier fourni : **20 tables 80×120, 4 tables 75×180, 100 chaises**. L'éditeur propose ces tables en premier, les assemble bout à bout et tient le compte (rouge si on dépasse).

Disposition proposée : table d'honneur (2 tables 75×180) dos aux baies vitrées, 4 rangées de 4 tables 80×120 (18 places chacune), piste de danse côté écran près de la sono : 78 couverts. En réserve : 4 tables 80×120, 2 tables 75×180, 22 chaises.

## Plan de table : mode d'emploi rapide

- **Mobilier** : touchez une table (ronde, ovale, carrée, rectangle, impériale, d'honneur, cœur, mange-debout) ou un décor (piste, buffet, bar, sapin, arche, entrée, murs…) : il apparaît au centre de la vue.
- **Déplacer** : glisser. **Tourner** : la poignée dorée au-dessus de l'élément. **Habiller** : panneau de droite (nom, numéro, places, dimensions, nappe, centre de table, chemin de table). Le bouton ✦ propose un nom dans l'esprit du faire-part (Colibri, Mimosa, Glycine…).
- **Invités** : onglet *Invités*, un par un ou « Coller une liste » (une ligne par invité, `Nom ; Groupe ; régime`, copier-coller depuis Excel possible). Groupes colorés (famille de Marie, d'Olivier, amis…).
- **Placer** : glisser un nom sur une chaise (ou sur une table : première place libre). Au téléphone : toucher le nom, puis la place. Toucher une chaise vide ouvre une recherche. Glisser un invité déjà assis sur une autre chaise occupée **échange** les deux.
- **Fond de plan** : panneau *La salle* > « Importer le plan de la salle », régler sa largeur réelle, puis verrouiller.
- **Variantes** : menu ⋯ > « Dupliquer ce plan » pour essayer une autre disposition sans perdre la première.
- **Publier** : l'interrupteur « Publié » rend la page *Trouver ma table* active pour ce plan.
- **Imprimer** : plan de salle, convives par table, liste alphabétique pour l'entrée, marque-places à découper, récapitulatif traiteur (adultes, enfants, régimes), export CSV.
- Enregistrement automatique ; Ctrl+Z / Ctrl+Y ; si deux personnes modifient en même temps, le site le signale au lieu d'écraser en silence.
