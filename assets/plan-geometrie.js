/* ============================================================
   Plan de table : formes, places et dessin SVG.
   Unité : le centimètre. Une table ronde de 180 cm mesure 180 unités.
   Partagé par l'éditeur (plan-de-table/) et la page invités (ma-place).
   ============================================================ */
const ECART_SIEGE = 32;     // distance bord de table → centre de la chaise
const R_SIEGE = 21;         // rayon d'une chaise

const FORMES = {
  ronde:   { nom: 'Ronde' },
  ovale:   { nom: 'Ovale' },
  carree:  { nom: 'Carrée' },
  rect:    { nom: 'Rectangulaire' },
  honneur: { nom: 'D\'honneur (un seul côté)' },
  coeur:   { nom: 'Cœur (table des mariés)' }
};

/* Mobilier fourni par la salle : tables qu'on assemble bout à bout.
   places = chaises par grand côté pour UNE table. */
const MODULES = {
  m120: { nom: '80 × 120', l: 120, w: 80, places: 2 },
  m180: { nom: '75 × 180', l: 180, w: 75, places: 3 }
};
const STOCK_DEFAUT = { m120: 20, m180: 4, chaises: 100 };
function placesModulaires(t){ const m = MODULES[t.module]; if (!m) return t.n; const k = t.nb || 1; return t.forme === 'honneur' ? m.places * k : 2 * m.places * k + 2 * (t.bouts | 0); }

const MODELES_SALLE = [
  { cle: 's120',   label: '1 table 80×120',    forme: 'rect',    module: 'm120', nb: 1, n: 4,  l: 120, w: 80, bouts: 0 },
  { cle: 's120x2', label: '2 tables 80×120',   forme: 'rect',    module: 'm120', nb: 2, n: 8,  l: 240, w: 80, bouts: 0 },
  { cle: 's120x4', label: 'Rangée de 4 · 80×120', forme: 'rect', module: 'm120', nb: 4, n: 18, l: 480, w: 80, bouts: 1 },
  { cle: 's180',   label: '1 table 75×180',    forme: 'rect',    module: 'm180', nb: 1, n: 6,  l: 180, w: 75, bouts: 0 },
  { cle: 's180h',  label: 'D\'honneur 2×180',  forme: 'honneur', module: 'm180', nb: 2, n: 6,  l: 360, w: 75 }
];

const MODELES_TABLES = [
  { cle: 'ronde8',   label: 'Ronde · 8',        forme: 'ronde',  n: 8,  l: 160, w: 160 },
  { cle: 'ronde10',  label: 'Ronde · 10',       forme: 'ronde',  n: 10, l: 180, w: 180 },
  { cle: 'ronde12',  label: 'Ronde · 12',       forme: 'ronde',  n: 12, l: 200, w: 200 },
  { cle: 'ovale10',  label: 'Ovale · 10',       forme: 'ovale',  n: 10, l: 260, w: 140 },
  { cle: 'carree8',  label: 'Carrée · 8',       forme: 'carree', n: 8,  l: 150, w: 150 },
  { cle: 'rect8',    label: 'Rectangle · 8',    forme: 'rect',   n: 8,  l: 240, w: 90, bouts: 0 },
  { cle: 'rect10',   label: 'Rectangle · 10',   forme: 'rect',   n: 10, l: 240, w: 90, bouts: 1 },
  { cle: 'imperiale',label: 'Impériale · 20',   forme: 'rect',   n: 20, l: 540, w: 100, bouts: 1 },
  { cle: 'honneur',  label: 'D\'honneur · 6',   forme: 'honneur',n: 6,  l: 360, w: 80 },
  { cle: 'coeur',    label: 'Cœur · 2',         forme: 'coeur',  n: 2,  l: 150, w: 130 },
  { cle: 'debout',   label: 'Mange-debout',     forme: 'ronde',  n: 0,  l: 70,  w: 70 }
];

const TYPES_DECOR = {
  piste:     { nom: 'Piste de danse', l: 450, w: 400 },
  buffet:    { nom: 'Buffet',         l: 320, w: 80 },
  bar:       { nom: 'Bar',            l: 260, w: 70 },
  gateau:    { nom: 'Pièce montée',   l: 90,  w: 90, rond: true },
  dj:        { nom: 'DJ',             l: 200, w: 90 },
  scene:     { nom: 'Scène',          l: 400, w: 200 },
  photobooth:{ nom: 'Photobooth',     l: 200, w: 200 },
  cadeaux:   { nom: 'Urne & cadeaux', l: 140, w: 60 },
  livre:     { nom: 'Livre d\'or',    l: 110, w: 55 },
  enfants:   { nom: 'Coin enfants',   l: 320, w: 260 },
  sapin:     { nom: 'Sapin',          l: 130, w: 130, rond: true },
  plante:    { nom: 'Plante',         l: 70,  w: 70, rond: true },
  arche:     { nom: 'Arche fleurie',  l: 220, w: 50 },
  entree:    { nom: 'Entrée',         l: 160, w: 20 },
  mur:       { nom: 'Mur',            l: 400, w: 16 },
  pilier:    { nom: 'Pilier',         l: 50,  w: 50 },
  meuble:    { nom: 'Meuble',         l: 120, w: 60 },
  fenetre:   { nom: 'Fenêtre',        l: 200, w: 14 },
  ecran:     { nom: 'Écran',          l: 220, w: 12 },
  porte:     { nom: 'Porte',          l: 90,  w: 14 },
  texte:     { nom: 'Texte libre',    l: 260, w: 50 }
};

const NAPPES = {
  satin:  { nom: 'Blanc satiné', fond: 'url(#g-satin)', trait: '#26356f', texte: '#1b2652' },
  ivoire: { nom: 'Ivoire',       fond: '#f6efdf',       trait: '#26356f', texte: '#1b2652' },
  bleu:   { nom: 'Bleu nuit',    fond: 'url(#g-bleu)',  trait: '#1b2652', texte: '#fcfbf8' },
  ciel:   { nom: 'Bleu voile',   fond: '#e4e7f1',       trait: '#26356f', texte: '#1b2652' },
  or:     { nom: 'Doré',         fond: 'url(#g-or)',    trait: '#8a6a24', texte: '#3b2c0a' },
  toile:  { nom: 'Toile de Jouy',fond: 'url(#p-toile)', trait: '#26356f', texte: '#1b2652' }
};
const CENTRES = { aucun: 'Aucun', bouquet: 'Bouquet', bougies: 'Bougies', mimosa: 'Mimosa', colibri: 'Colibri', sapin: 'Petit sapin' };

const NOMS_TABLES = ['Colibri', 'Mimosa', 'Hortensia', 'Pivoine', 'Glycine', 'Camélia', 'Magnolia', 'Rossignol', 'Mésange', 'Papillon',
  'Jasmin', 'Lilas', 'Iris', 'Pervenche', 'Myosotis', 'Bleuet', 'Azalée', 'Hirondelle', 'Martin-pêcheur', 'Pinson', 'Églantine',
  'Capucine', 'Volubilis', 'Passiflore', 'Rouge-gorge', 'Fauvette', 'Libellule', 'Chèvrefeuille', 'Anémone', 'Gardénia'];

/* ---------- Places autour d'une table (repère local, avant rotation) ----------
   Renvoie [{x, y, a}] où a est l'angle (degrés) de la direction « vers l'extérieur ». */
function sieges(t){
  const n = Math.max(0, t.n | 0), D = ECART_SIEGE, out = [];
  if (!n) return out;
  const L = t.l, W = t.forme === 'ronde' ? t.l : t.w;
  const surCote = (k, x1, y1, x2, y2, a) => { for (let i = 0; i < k; i++) { const f = (i + .5) / k; out.push({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, a }); } };
  switch (t.forme) {
    case 'ronde':
      for (let i = 0; i < n; i++) { const a = -90 + 360 * i / n, r = L / 2 + D; out.push({ x: r * cosd(a), y: r * sind(a), a }); }
      break;
    case 'ovale': {
      const A = L / 2 + D, B = W / 2 + D;
      for (let i = 0; i < n; i++) { const p = -90 + 360 * i / n; const x = A * cosd(p), y = B * sind(p); out.push({ x, y, a: Math.atan2(y / (B * B), x / (A * A)) * 180 / Math.PI }); }
      break;
    }
    case 'carree': {
      const c = [0, 0, 0, 0], ordre = [0, 2, 1, 3];
      for (let i = 0; i < n; i++) c[ordre[i % 4]]++;
      const h = L / 2, v = W / 2;
      surCote(c[0], -h, -v - D, h, -v - D, -90);
      surCote(c[1], h + D, -v, h + D, v, 0);
      surCote(c[2], h, v + D, -h, v + D, 90);
      surCote(c[3], -h - D, v, -h - D, -v, 180);
      break;
    }
    case 'rect': {
      let e = Math.min(t.bouts | 0, Math.floor(n / 2));
      const long = n - 2 * e, haut = Math.ceil(long / 2), bas = long - haut, h = L / 2, v = W / 2;
      surCote(haut, -h, -v - D, h, -v - D, -90);
      surCote(e, h + D, -v, h + D, v, 0);
      surCote(bas, h, v + D, -h, v + D, 90);
      surCote(e, -h - D, v, -h - D, -v, 180);
      break;
    }
    case 'honneur':
      surCote(n, -L / 2, -W / 2 - D, L / 2, -W / 2 - D, -90);
      break;
    case 'coeur':
      surCote(n, -L * .28, -W / 2 - D + 6, L * .28, -W / 2 - D + 6, -90);
      break;
  }
  return out;
}
function cosd(a){ return Math.cos(a * Math.PI / 180); }
function sind(a){ return Math.sin(a * Math.PI / 180); }

/* Demi-encombrement (pour la sélection et l'ajustement de la vue) */
function rayonTable(t){ const W = t.forme === 'ronde' ? t.l : t.w; return Math.hypot(t.l / 2, W / 2) + ECART_SIEGE + R_SIEGE; }

function cheminCoeur(l, w){
  const x = l / 2, y = w / 2;
  return `M0 ${y} C ${-x * .25} ${y * .7}, ${-x} ${y * .15}, ${-x} ${-y * .35} C ${-x} ${-y * .85}, ${-x * .45} ${-y * 1.05}, 0 ${-y * .55} C ${x * .45} ${-y * 1.05}, ${x} ${-y * .85}, ${x} ${-y * .35} C ${x} ${y * .15}, ${x * .25} ${y * .7}, 0 ${y}Z`;
}

function corpsTable(t, attrs){
  const W = t.forme === 'ronde' ? t.l : t.w;
  switch (t.forme) {
    case 'ronde': return `<circle r="${t.l / 2}" ${attrs}/>`;
    case 'ovale': return `<ellipse rx="${t.l / 2}" ry="${W / 2}" ${attrs}/>`;
    case 'coeur': return `<path d="${cheminCoeur(t.l, W)}" ${attrs}/>`;
    default: return `<rect x="${-t.l / 2}" y="${-W / 2}" width="${t.l}" height="${W}" rx="6" ${attrs}/>`;
  }
}

/* Petits décors de centre de table, dessinés au trait */
function dessinCentre(type, taille, couleur){
  const s = taille / 100;
  const g = c => `<g transform="scale(${s.toFixed(3)})" fill="none" stroke="${couleur}" stroke-width="${(2 / s).toFixed(2)}" stroke-linecap="round" opacity=".24">${c}</g>`;
  switch (type) {
    case 'bouquet': return g(`<g>${[0,72,144,216,288].map(a => `<path transform="rotate(${a})" d="M0 -6 c-12 -14 -9 -32 0 -36 c9 4 12 22 0 36z"/>`).join('')}<circle r="7" stroke="#b8913f"/></g>`);
    case 'bougies': return g(`<g stroke="#b8913f">${[-28, 0, 28].map((x, i) => `<rect x="${x - 7}" y="${-10 + (i === 1 ? -12 : 0)}" width="14" height="${34 + (i === 1 ? 12 : 0)}" rx="2"/><path d="M${x} ${-16 + (i === 1 ? -12 : 0)} q-6 -8 0 -16 q6 8 0 16z"/>`).join('')}</g>`);
    case 'mimosa': return g(`<path d="M-40 40 C -10 10, 10 -10, 44 -40"/><path d="M-6 6 c-6 -14 -18 -20 -30 -18"/><path d="M14 -14 c0 -14 -6 -24 -18 -30"/>
      ${[[-36,-12],[-28,-16],[-20,-10],[-4,-44],[4,-38],[-10,-36],[44,-40],[36,-34],[28,-30],[20,-22]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${couleur}" stroke="none"/>`).join('')}`);
    case 'colibri': return g(`<path d="M-50 0 L -20 -3"/><path d="M-20 -3 c4 -6 12 -8 18 -4 c10 2 22 6 32 14 c8 6 18 10 30 12 c-12 4 -24 2 -34 -2 c-10 6 -24 8 -34 2 c-8 -4 -14 -12 -12 -22z"/><path d="M2 -4 c4 -14 14 -26 30 -32 c-4 10 -8 18 -16 26"/>`);
    case 'sapin': return g(`<path d="M0 -46 L 26 -6 H 12 L 34 26 H -34 L -12 -6 H -26 Z"/><path d="M-6 26 v14 h12 v-14"/><path d="M0 -58 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" stroke="#b8913f"/>`);
    default: return '';
  }
}

/* ---------- Dessin d'une table ----------
   opts : { invites: Map id→invité, groupes: Map id→groupe, selection: bool, surbrillance: bool,
            lecture: bool (sans noms), affichage: 'prenom'|'complet'|'initiales', police: nombre } */
function renduTable(t, opts = {}){
  const nappe = NAPPES[t.nappe] || NAPPES.satin;
  const W = t.forme === 'ronde' ? t.l : t.w;
  const pos = sieges(t);
  const police = opts.police || 17;
  let html = `<g class="table${opts.selection ? ' sel' : ''}${opts.surbrillance ? ' surb' : ''}" data-table="${t.id}" transform="translate(${r1(t.x)} ${r1(t.y)}) rotate(${t.rot || 0})">`;
  if (opts.selection || opts.surbrillance) html += `<circle class="halo" r="${rayonTable(t) + 8}"/>`;

  // chaises et noms
  pos.forEach((p, i) => {
    const gid = t.sieges && t.sieges[i];
    const inv = gid && opts.invites ? opts.invites.get(gid) : null;
    const grp = inv && opts.groupes ? opts.groupes.get(inv.groupe) : null;
    const coul = grp ? grp.couleur : '#26356f';
    html += `<g class="siege${inv ? ' occupe' : ''}" data-siege="${t.id}:${i}" transform="translate(${r1(p.x)} ${r1(p.y)})">`;
    html += `<circle r="${R_SIEGE}" ${inv ? `fill="${coul}" fill-opacity=".18" stroke="${coul}"` : 'class="libre"'}/>`;
    if (inv && !opts.lecture) {
      html += `<text class="init" transform="rotate(${-(t.rot || 0)})" fill="${coul}">${echapSvg(initiales(inv.nom))}</text>`;
      const aMonde = (p.a + (t.rot || 0)) % 360, aN = ((aMonde % 360) + 360) % 360;
      const retourne = aN > 90 && aN < 270;
      const rotTexte = retourne ? p.a + 180 : p.a;
      const label = nomAffiche(inv.nom, opts.affichage) + (inv.regime ? ' ' + iconeRegime(inv.regime) : '') + (inv.enfant ? ' ✿' : '');
      html += `<text class="nom" transform="rotate(${r1(rotTexte)}) translate(${retourne ? -(R_SIEGE + 5) : R_SIEGE + 5} 0)" text-anchor="${retourne ? 'end' : 'start'}" font-size="${police}">${echapSvg(label)}</text>`;
      html += `<title>${echapSvg(inv.nom)}${grp ? ' · ' + echapSvg(grp.nom) : ''}${inv.regime ? ' · ' + echapSvg(inv.regime) : ''}</title>`;
    }
    html += `</g>`;
  });

  // plateau
  html += `<g class="plateau">`;
  html += corpsTable(t, `fill="${nappe.fond}" stroke="${nappe.trait}" stroke-width="2.2" class="corps"`);
  if (t.forme !== 'coeur') {
    const inset = Math.min(10, Math.min(t.l, W) * .07);
    html += corpsTable({ ...t, l: t.l - inset * 2, w: W - inset * 2 }, `fill="none" stroke="#b8913f" stroke-width="1" stroke-dasharray="3 5" opacity=".75"`);
  }
  if (MODULES[t.module] && (t.nb || 1) > 1) {
    const m = MODULES[t.module];
    for (let k = 1; k < t.nb; k++) { const x = -t.l / 2 + k * m.l; html += `<line x1="${x}" x2="${x}" y1="${-W / 2}" y2="${W / 2}" stroke="${nappe.trait}" stroke-width="1" opacity=".35"/>`; }
  }
  if (t.chemin && (t.forme === 'rect' || t.forme === 'honneur' || t.forme === 'ovale')) {
    const ep = Math.min(30, W * .32);
    html += `<rect x="${-t.l / 2 + 4}" y="${-ep / 2}" width="${t.l - 8}" height="${ep}" fill="${t.nappe === 'bleu' ? '#b8913f' : '#26356f'}" opacity=".16"/>`;
  }
  // centre de table + nom, toujours lisibles (contre-rotation)
  const fs = Math.max(13, Math.min(32, Math.min(t.l, W) * .17));
  html += `<g transform="rotate(${-(t.rot || 0)})">`;
  if (t.centre && t.centre !== 'aucun') html += dessinCentre(t.centre, Math.min(t.l, W) * .55, nappe.texte);
  if (t.numero) html += `<text class="numero" y="${t.nom ? -fs * .75 : fs * .3}" fill="${nappe.texte}" font-size="${Math.max(9, fs * .45)}">${/^\d+$/.test(String(t.numero)) ? 'TABLE ' + echapSvg(t.numero) : echapSvg(String(t.numero).toUpperCase())}</text>`;
  if (t.nom) html += `<text class="nomtable" y="${fs * .35}" fill="${nappe.texte}" font-size="${fs}">${echapSvg(t.nom)}</text>`;
  if (!opts.lecture && t.n) {
    const occ = (t.sieges || []).filter(Boolean).length;
    html += `<text class="compte" y="${fs * 1.25}" fill="${nappe.texte}" font-size="${Math.max(8, fs * .38)}">${occ}/${t.n}</text>`;
  }
  html += `</g></g>`;
  if (opts.selection) html += `<g class="poignee" data-poignee="rot" transform="translate(0 ${-(rayonTable(t) + 80)})"><line y1="0" y2="80"/><circle r="11"/><path d="M-5 -2 a5 5 0 1 1 2 5" /></g>`;
  html += `</g>`;
  return html;
}

function renduDecor(d, opts = {}){
  const T = TYPES_DECOR[d.type] || TYPES_DECOR.texte;
  const l = d.l, w = d.w, x = -l / 2, y = -w / 2;
  let c = '';
  const lib = d.texte != null && d.texte !== '' ? d.texte : T.nom;
  const etiquette = (fs = 18, dy = 0, coul = '#26356f') => `<text class="lib-decor" transform="rotate(${-(d.rot || 0)})" y="${dy}" font-size="${fs}" fill="${coul}">${echapSvg(lib)}</text>`;
  switch (d.type) {
    case 'piste':
      c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="url(#p-parquet)" stroke="#b8913f" stroke-width="2"/>
           <rect x="${x + 10}" y="${y + 10}" width="${l - 20}" height="${w - 20}" fill="none" stroke="#b8913f" stroke-width="1" stroke-dasharray="2 6"/>` + etiquette(24, 8, '#8a6a24');
      break;
    case 'mur': c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="#1b2652"/>`; break;
    case 'fenetre': c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="#e4e7f1" stroke="#1b2652" stroke-width="2"/><line x1="${x}" x2="${-x}" y1="0" y2="0" stroke="#1b2652"/>`; break;
    case 'pilier': c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="#5e6178"/>` + (d.texte ? etiquette(14, Math.max(l, w) / 2 + 16, '#5e6178') : ''); break;
    case 'ecran': c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="#1b2652" opacity=".85"/>` + etiquette(16, -w / 2 - 18); break;
    case 'entree': case 'porte':
      c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="#fcfbf8" stroke="#1b2652" stroke-width="2"/>
           <path d="M${x} ${w / 2} A ${l} ${l} 0 0 0 ${x + l} ${w / 2 + l}" fill="none" stroke="#26356f" stroke-dasharray="4 5" opacity=".6"/>
           <line x1="${x}" y1="${w / 2}" x2="${x}" y2="${w / 2 + l}" stroke="#26356f" opacity=".6"/>` + etiquette(18, -w / 2 - 10);
      break;
    case 'arche':
      c = `<path d="M${x} ${w / 2} C ${x} ${-w * 3}, ${-x} ${-w * 3}, ${-x} ${w / 2}" fill="none" stroke="#26356f" stroke-width="3"/>
           ${[0.15, .35, .5, .65, .85].map(f => { const px = x + l * f, py = -w * 1.5 * Math.sin(Math.PI * f) * 1.2 + w / 2 * (1 - Math.sin(Math.PI * f)); return `<circle cx="${r1(px)}" cy="${r1(py)}" r="9" fill="#fcfbf8" stroke="#b8913f"/>`; }).join('')}` + etiquette(16, w / 2 + 20);
      break;
    case 'sapin':
      c = `<circle r="${l / 2}" fill="#e9efe9" stroke="#3f6b55" stroke-width="1.5" stroke-dasharray="3 4"/>` + dessinCentre('sapin', l * .9, '#3f6b55').replace('opacity=".24"', 'opacity=".9"') + etiquette(15, l / 2 + 18, '#3f6b55');
      break;
    case 'plante':
      c = `<circle r="${l / 2}" fill="#eef2ec" stroke="#3f6b55" stroke-width="1.2"/>` + dessinCentre('bouquet', l * .9, '#3f6b55').replace('opacity=".24"', 'opacity=".8"');
      break;
    case 'gateau':
      c = `<circle r="${l / 2}" fill="#fcfbf8" stroke="#b8913f" stroke-width="2"/><circle r="${l / 3}" fill="none" stroke="#b8913f"/><circle r="${l / 6}" fill="#f3e7c6" stroke="#b8913f"/>` + etiquette(15, l / 2 + 18, '#8a6a24');
      break;
    case 'texte':
      c = `<rect x="${x}" y="${y}" width="${l}" height="${w}" fill="transparent"/><text class="lib-libre" transform="rotate(${-(d.rot || 0)})" y="${w * .15}" font-size="${Math.max(14, w * .6)}">${echapSvg(lib)}</text>`;
      break;
    default:
      c = (T.rond ? `<ellipse rx="${l / 2}" ry="${w / 2}"` : `<rect x="${x}" y="${y}" width="${l}" height="${w}" rx="4"`) + ` fill="${d.type === 'enfants' ? '#f4eef4' : '#fcfbf8'}" stroke="#26356f" stroke-width="1.6" stroke-dasharray="${d.type === 'enfants' ? '8 6' : '0'}"/>`
        + etiquette(Math.max(12, Math.min(22, Math.min(l, w) * .32)), 6);
  }
  const sel = opts.selection ? `<rect class="halo-decor" x="${x - 10}" y="${y - 10}" width="${l + 20}" height="${w + 20}"/><g class="poignee" data-poignee="rot" transform="translate(0 ${y - 44})"><line y1="0" y2="34"/><circle r="11"/><path d="M-5 -2 a5 5 0 1 1 2 5"/></g><g class="poignee taille" data-poignee="taille" transform="translate(${-x + 10} ${-y + 10})"><rect x="-9" y="-9" width="18" height="18"/></g>` : '';
  return `<g class="decor${opts.selection ? ' sel' : ''}" data-decor="${d.id}" transform="translate(${r1(d.x)} ${r1(d.y)}) rotate(${d.rot || 0})">${c}${sel}</g>`;
}

/* Définitions SVG communes : dégradés de nappe, parquet, grille */
function defsPlan(){
  return `<defs>
    <linearGradient id="g-satin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f6f3ec"/><stop offset=".55" stop-color="#fdfcf9"/><stop offset="1" stop-color="#ebe6da"/></linearGradient>
    <linearGradient id="g-bleu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3d7c"/><stop offset="1" stop-color="#1b2652"/></linearGradient>
    <linearGradient id="g-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e2b6"/><stop offset=".5" stop-color="#d9bf7f"/><stop offset="1" stop-color="#e9d5a0"/></linearGradient>
    <pattern id="p-parquet" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f3ead6"/><path d="M0 0h30v30H0zM30 30h30v30H30z" fill="#ecdfc2"/><path d="M0 30h60M30 0v60" stroke="#e2d2ae" stroke-width="1"/></pattern>
    <pattern id="p-toile" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#fbfaf6"/>
      <g fill="none" stroke="#26356f" stroke-width="1" opacity=".45"><path d="M10 40 c10 -12 20 -14 30 -6 M18 36 q-6 -8 -2 -14 q6 6 2 14z M30 34 q2 -10 10 -12 q-2 10 -10 12z"/><circle cx="70" cy="70" r="4"/><path d="M70 62 q-4 -8 0 -12 q4 4 0 12z M78 70 q8 -4 12 0 q-4 4 -12 0z M62 70 q-8 4 -12 0 q4 -4 12 0z M70 78 q4 8 0 12 q-4 -4 0 -12z"/></g></pattern>
    <pattern id="p-grille" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1.6" fill="#b9bed3"/><circle cx="50" cy="0" r="1.6" fill="#b9bed3"/><circle cx="0" cy="50" r="1.6" fill="#b9bed3"/><circle cx="50" cy="50" r="1.6" fill="#b9bed3"/></pattern>
  </defs>`;
}

function r1(v){ return Math.round(v * 10) / 10; }
function echapSvg(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function initiales(nom){ const p = String(nom || '').trim().split(/\s+/); return ((p[0] || '')[0] || '').toUpperCase() + ((p.length > 1 ? p[p.length - 1][0] : (p[0] || '')[1]) || '').toUpperCase(); }
function nomAffiche(nom, mode){
  const p = String(nom || '').trim().split(/\s+/);
  if (mode === 'complet') return nom;
  if (mode === 'initiales') return initiales(nom);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}
function iconeRegime(r){ const s = String(r).toLowerCase(); return /v[ée]g[ée]talien|vegan/.test(s) ? '🌱' : /v[ée]g/.test(s) ? '🌿' : /allerg|sans/.test(s) ? '⚠' : '•'; }
