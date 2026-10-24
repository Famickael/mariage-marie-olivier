# Mariage de Marie & Olivier · 5 décembre 2026

Site statique (HTML/CSS/JS, sans compilation) + Supabase pour les données. Charte du faire-part : blanc satiné, bleu de toile de Jouy, une touche d'or.

## Les pages

| Adresse | Pour qui | Rôle |
|---|---|---|
| `/` | personne en particulier | Couverture « M & O », sans aucun lien |
| `/coulisses/` | famille, Marie & Olivier | Point d'entrée : tous les outils, avec « Copier le lien » et QR code |
| `/souvenirs/` | invités | Dépôt de photos, vidéos et mots (envoi par morceaux, reprise en cas de coupure) |
| `/plan-de-table/ma-place.html` | invités | « Trouver ma table » : nom → table, voisins, mini-plan (seulement si un plan est publié) |
| `/programme/` | invités | Le déroulé, uniquement les moments cochés « visibles des invités » |
| `/planning/` | témoins, famille | Le minute par minute ; lecture avec le lien, modification une fois connecté |
| `/plan-de-table/` | Marie & Olivier (connexion) | L'éditeur de plan de table |
| `/souvenirs/admin.html` | Marie & Olivier (connexion) | Trier, masquer, télécharger les souvenirs (zip) |
| `/projection/` | Marie & Olivier (connexion) | Diaporama de la soirée, avec QR code vers `/souvenirs/` |

Aucune page invité ne contient de lien vers une autre page : chacun ne voit que ce qu'on lui donne.

## Mise en route

1. **Supabase** : exécuter `supabase/schema.sql` dans l'éditeur SQL du projet (tables, règles d'accès, fonctions, espaces de stockage).
2. **Comptes** : Authentication > Users > *Add user* pour Marie, Olivier (et qui doit pouvoir modifier). Tous les comptes ont les mêmes droits.
3. **Configuration** : dans `assets/commun.js`, renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Project Settings > API). Cette clé est publique par conception ; ce que chacun peut faire est décidé par les règles en base.
4. **Hébergement** : GitHub Pages (Settings > Pages > branche `main`, dossier racine) ou Netlify. Il faut une adresse en https.
5. Ouvrir `/coulisses/` et distribuer les liens.

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
