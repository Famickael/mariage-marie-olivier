/* ============================================================
   Éditeur de plan de table · Marie & Olivier
   Données d'un plan : un document JSON (table « plans » dans Supabase)
   { salle, groupes, invites, tables, decors, reglages }
   ============================================================ */
const COULEURS_GROUPES = ['#26356f', '#5b7fb5', '#7f9c8a', '#a77fa0', '#c98f6b', '#b8913f', '#6fa0c8', '#9b5d6a', '#8a8fa8', '#4f7a74'];
const GRILLE = 10;

let plans = [];          // liste { id, nom, publie, updated_at }
let plan = null;         // { id, nom, version, publie }
let D = null;            // données du plan affiché
let sel = null;          // { type: 'table' | 'decor', id }
let cam = { x: 40, y: 40, s: .4 };
let inviteActif = null;  // invité « en main » pour le placer d'un toucher
let urlFond = null;
const pile = { annuler: [], refaire: [] };
let saisieEnCours = false;
let sauvegarde = { minuterie: null, enCours: false, encore: false, sale: false };

const svg = $('#svg'), monde = $('#monde');

/* ============================================================
   Démarrage
   ============================================================ */
exigerConnexion('Plan de table', async () => {
  $('#app').hidden = false;
  construirePalettes();
  brancherInterface();
  await chargerListePlans();
  const voulu = localStorage.getItem('plan-actif');
  if (!plans.length) await creerPlan('Plan principal', donneesExemple());
  await ouvrirPlan(plans.some(p => p.id === voulu) ? voulu : plans[0].id);
});

async function chargerListePlans(){
  const { data, error } = await sb.from('mo_plans').select('id,nom,publie,updated_at').order('created_at');
  if (error) { statut('Erreur : ' + error.message, 'err'); return; }
  plans = data;
}
function rendreSelecteurPlans(){
  $('#sel-plan').innerHTML = plans.map(p => `<option value="${p.id}" ${plan && p.id === plan.id ? 'selected' : ''}>${echap(p.nom)}${p.publie ? ' ★' : ''}</option>`).join('');
}

async function ouvrirPlan(id){
  if (sauvegarde.sale) await sauverMaintenant();
  const { data, error } = await sb.from('mo_plans').select('*').eq('id', id).single();
  if (error) { statut('Erreur : ' + error.message, 'err'); return; }
  plan = { id: data.id, nom: data.nom, version: data.version, publie: data.publie };
  D = normaliser(data.data);
  // copie de secours locale plus récente ? (ex. coupure réseau)
  try {
    const sec = JSON.parse(localStorage.getItem('plan-secours-' + id) || 'null');
    if (sec && sec.version === data.version && sec.t > new Date(data.updated_at).getTime() + 2000 && JSON.stringify(sec.data) !== JSON.stringify(data.data)
        && confirm('Des modifications faites sur cet appareil n\'avaient pas pu être enregistrées. Les récupérer ?')) {
      D = normaliser(sec.data); marquerSale();
    }
  } catch {}
  localStorage.setItem('plan-actif', id);
  pile.annuler = []; pile.refaire = []; sel = null; inviteActif = null;
  $('#chk-publier').checked = !!plan.publie;
  rendreSelecteurPlans();
  await chargerFond();
  rendreTout({ panneau: true });
  ajusterVue();
  if (!sauvegarde.sale) statut('Enregistré', 'ok');
}

function normaliser(d){
  d = d && typeof d === 'object' ? d : {};
  d.salle = Object.assign({ l: 2000, h: 1400, fond: null, grille: true }, d.salle || {});
  d.reglages = Object.assign({ affichage: 'prenom', police: 17 }, d.reglages || {});
  d.reglages.stock = Object.assign({}, STOCK_DEFAUT, d.reglages.stock || {});
  d.groupes = d.groupes || []; d.invites = d.invites || []; d.tables = d.tables || []; d.decors = d.decors || [];
  d.tables.forEach(t => { t.sieges = t.sieges || []; t.sieges.length = Math.max(t.n, 0); for (let i = 0; i < t.n; i++) if (t.sieges[i] === undefined) t.sieges[i] = null; });
  return d;
}

async function creerPlan(nom, data){
  const { data: row, error } = await sb.from('mo_plans').insert({ nom, data, version: 1 }).select('id,nom,publie,updated_at').single();
  if (error) { alert('Création impossible : ' + error.message); return null; }
  plans.push(row); return row.id;
}

/* Plan de départ : la grande salle de l'Espace Oratorien (140 m², 17,3 × 8 m),
   relevée sur le plan d'architecte, avec une proposition de disposition. */
function donneesExemple(){
  const g = [
    { id: 'g-maries', nom: 'Les mariés', couleur: '#b8913f' },
    { id: 'g-marie', nom: 'Famille de Marie', couleur: '#26356f' },
    { id: 'g-olivier', nom: 'Famille d\'Olivier', couleur: '#5b7fb5' },
    { id: 'g-amis', nom: 'Amis', couleur: '#7f9c8a' },
    { id: 'g-collegues', nom: 'Collègues', couleur: '#a77fa0' },
    { id: 'g-enfants', nom: 'Enfants', couleur: '#c98f6b' }
  ];
  const inv = [{ id: 'i-marie', nom: 'Marie Bertrand', groupe: 'g-maries' }, { id: 'i-olivier', nom: 'Olivier Nivesse', groupe: 'g-maries' }];
  // Mobilier de la salle : 20 tables 80×120, 4 tables 75×180, 100 chaises.
  // Proposition : table d'honneur (2 × 75×180) dos aux baies vitrées, 4 rangées de 4 tables 80×120.
  const tables = [{ id: uid(), forme: 'honneur', module: 'm180', nb: 2, x: 957, y: 105, rot: 0, l: 360, w: 75, n: 6, nom: 'Les mariés', numero: '', nappe: 'or', centre: 'bouquet', chemin: true, sieges: [null, null, 'i-marie', 'i-olivier', null, null] }];
  [[400, 'Colibri'], [650, 'Mimosa'], [1010, 'Hortensia'], [1260, 'Pivoine']].forEach(([x, nom], i) => tables.push({ id: uid(), forme: 'rect', module: 'm120', nb: 4, bouts: 1, x, y: 470, rot: 90, l: 480, w: 80, n: 18,
    nom, numero: String(i + 1), nappe: 'satin', centre: i % 2 ? 'mimosa' : 'bouquet', chemin: true, sieges: Array(18).fill(null) }));
  const d = (type, x, y, l, w, rot = 0, texte = '') => ({ id: uid(), type, x, y, l, w, rot, texte });
  const decors = [
    // la salle telle qu'elle est
    d('fenetre', 957, 0, 577, 14, 0, ''),
    d('porte', 390, 0, 90, 14, 0, 'Sanitaires'),
    d('porte', 1478, 0, 90, 14, 0, 'Rangement'),
    d('porte', 0, 100, 90, 14, -90, 'Secours'),
    d('entree', 872, 800, 160, 20, 180, 'Entrée'),
    d('porte', 51, 800, 90, 14, 180, 'Office'),
    d('bar', 177, 400, 470, 90, 90, 'Bar'),
    d('meuble', 41, 120, 70, 150, 0, 'Frigo'),
    d('ecran', 1724, 498, 220, 12, -90, 'Écran'),
    d('pilier', 1445, 790, 50, 30, 0, 'Sono'),
    // la fête
    d('piste', 1530, 430, 320, 360),
    d('dj', 1530, 722, 200, 80),
    d('gateau', 1330, 110, 90, 90),
    d('sapin', 600, 85, 110, 110)
  ];
  const k = .611; // pixels du plan d'architecte par centimètre
  const fond = { url: '../assets/plan-salle.webp', x: Math.round(-97 / k), y: Math.round(-281 / k), l: Math.round(1200 / k), h: Math.round(1041 / k), opacite: .3, verrou: true };
  return { salle: { l: 1730, h: 800, fond, grille: true }, reglages: { affichage: 'prenom', police: 17, stock: { ...STOCK_DEFAUT } }, groupes: g, invites: inv, tables, decors };
}

/* ============================================================
   Historique et sauvegarde
   ============================================================ */
function instantane(){ pile.annuler.push(JSON.stringify(D)); if (pile.annuler.length > 120) pile.annuler.shift(); pile.refaire = []; majBoutonsHisto(); }
function modifier(fn, opts = {}){
  if (!opts.sansHisto) instantane();
  fn();
  marquerSale();
  rendreTout(opts);
}
function annuler(){ if (!pile.annuler.length) return; pile.refaire.push(JSON.stringify(D)); D = normaliser(JSON.parse(pile.annuler.pop())); verifierSel(); marquerSale(); rendreTout({ panneau: true }); majBoutonsHisto(); }
function refaire(){ if (!pile.refaire.length) return; pile.annuler.push(JSON.stringify(D)); D = normaliser(JSON.parse(pile.refaire.pop())); verifierSel(); marquerSale(); rendreTout({ panneau: true }); majBoutonsHisto(); }
function majBoutonsHisto(){ $('#b-annuler').disabled = !pile.annuler.length; $('#b-refaire').disabled = !pile.refaire.length; }
function verifierSel(){ if (sel && !trouverSel()) sel = null; }

function marquerSale(){
  sauvegarde.sale = true; statut('Modifications…');
  try { localStorage.setItem('plan-secours-' + plan.id, JSON.stringify({ t: Date.now(), version: plan.version, data: D })); } catch {}
  clearTimeout(sauvegarde.minuterie);
  sauvegarde.minuterie = setTimeout(sauverMaintenant, 1200);
}
async function sauverMaintenant(){
  clearTimeout(sauvegarde.minuterie);
  if (sauvegarde.enCours) { sauvegarde.encore = true; return; }
  if (!sauvegarde.sale) return;
  sauvegarde.enCours = true; sauvegarde.sale = false; statut('Enregistrement…');
  const v = plan.version;
  try {
    const { data, error } = await sb.from('mo_plans').update({ data: D, version: v + 1 }).eq('id', plan.id).eq('version', v).select('version,updated_at');
    if (error) throw error;
    if (!data.length) await conflit();
    else {
      plan.version = data[0].version;
      try { localStorage.setItem('plan-secours-' + plan.id, JSON.stringify({ t: new Date(data[0].updated_at).getTime(), version: plan.version, data: D })); } catch {}
      statut('Enregistré', 'ok');
    }
  } catch (e) {
    sauvegarde.sale = true;
    statut(navigator.onLine ? 'Échec de l\'enregistrement, nouvel essai…' : 'Hors ligne : gardé sur cet appareil', 'err');
    sauvegarde.minuterie = setTimeout(sauverMaintenant, 8000);
  } finally {
    sauvegarde.enCours = false;
    if (sauvegarde.encore) { sauvegarde.encore = false; sauverMaintenant(); }
  }
}
async function conflit(){
  const { data } = await sb.from('mo_plans').select('*').eq('id', plan.id).single();
  if (!data) return;
  if (confirm('Ce plan vient d\'être modifié sur un autre appareil (Olivier ? Marie ?).\n\nOK : garder VOTRE version et écraser l\'autre.\nAnnuler : charger l\'autre version (vos dernières modifications seront perdues).')) {
    plan.version = data.version; sauvegarde.sale = true; return sauverMaintenant();
  }
  plan.version = data.version; D = normaliser(data.data); sel = null; rendreTout({ panneau: true }); statut('Version de l\'autre appareil chargée', 'ok');
}
function statut(txt, cls = ''){ const s = $('#statut'); s.textContent = txt; s.className = 'statut ' + cls; }
window.addEventListener('beforeunload', e => { if (sauvegarde.sale || sauvegarde.enCours) { sauverMaintenant(); e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('online', () => { if (sauvegarde.sale) sauverMaintenant(); });

/* ============================================================
   Rendu
   ============================================================ */
function index(){
  return { invites: new Map(D.invites.map(i => [i.id, i])), groupes: new Map(D.groupes.map(g => [g.id, g])) };
}
function rendreTout(opts = {}){
  rendrePlan();
  rendreInvites();
  rendreLegende();
  rendreStock();
  if (opts.panneau !== false) rendreProprietes();
}

function rendrePlan(){
  const { l, h, fond, grille } = D.salle;
  const ix = index();
  let s = `<rect class="sol" x="0" y="0" width="${l}" height="${h}"/>`;
  if (fond && urlFond) s += `<image class="fond-plan${fond.verrou ? '' : ' mobile'}" data-fond="1" href="${urlFond}" x="${fond.x}" y="${fond.y}" width="${fond.l}" height="${fond.h}" opacity="${fond.opacite}" preserveAspectRatio="none"/>`;
  if (grille) s += `<rect x="0" y="0" width="${l}" height="${h}" fill="url(#p-grille)" pointer-events="none"/>`;
  s += `<rect class="sol-filet" x="14" y="14" width="${l - 28}" height="${h - 28}" pointer-events="none"/>`;
  s += `<text class="cote" x="${l / 2}" y="-18">${fmtM(l)}</text><text class="cote" transform="translate(-18 ${h / 2}) rotate(-90)">${fmtM(h)}</text>`;
  for (const d of D.decors) s += renduDecor(d, { selection: sel && sel.type === 'decor' && sel.id === d.id });
  for (const t of D.tables) s += renduTable(t, { ...ix, selection: sel && sel.type === 'table' && sel.id === t.id, affichage: D.reglages.affichage, police: D.reglages.police });
  monde.innerHTML = s;
  appliquerCamera();
}
function fmtM(cm){ return (cm / 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' m'; }

function appliquerCamera(){
  monde.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${cam.s})`);
  $('#zoom-pct').textContent = Math.round(cam.s * 100 / .4) + ' %';
}
function ajusterVue(){
  const r = svg.getBoundingClientRect(); if (!r.width) return;
  let x0 = 0, y0 = 0, x1 = D.salle.l, y1 = D.salle.h;
  for (const t of D.tables) { const R = rayonTable(t) + 60; x0 = Math.min(x0, t.x - R); y0 = Math.min(y0, t.y - R); x1 = Math.max(x1, t.x + R); y1 = Math.max(y1, t.y + R); }
  const m = 50;
  cam.s = Math.min((r.width - 2 * m) / (x1 - x0), (r.height - 2 * m) / (y1 - y0));
  cam.x = (r.width - (x1 - x0) * cam.s) / 2 - x0 * cam.s;
  cam.y = (r.height - (y1 - y0) * cam.s) / 2 - y0 * cam.s;
  appliquerCamera();
}
function zoomer(f, cx, cy){
  const r = svg.getBoundingClientRect();
  if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
  const s2 = Math.min(4, Math.max(.05, cam.s * f));
  cam.x = cx - (cx - cam.x) * s2 / cam.s; cam.y = cy - (cy - cam.y) * s2 / cam.s; cam.s = s2;
  appliquerCamera();
}
function versMonde(clientX, clientY){ const r = svg.getBoundingClientRect(); return { x: (clientX - r.left - cam.x) / cam.s, y: (clientY - r.top - cam.y) / cam.s }; }
function centreVue(){ const r = svg.getBoundingClientRect(); return versMonde(r.left + r.width / 2, r.top + r.height / 2); }

function stockUtilise(){
  const u = { m120: 0, m180: 0, chaises: 0 };
  for (const t of D.tables) { if (MODULES[t.module]) u[t.module] += t.nb || 1; u.chaises += t.n; }
  return u;
}
function rendreStock(){
  const u = stockUtilise(), st = D.reglages.stock;
  $('#stock').innerHTML = [['m120', 'tables 80×120'], ['m180', 'tables 75×180'], ['chaises', 'chaises']]
    .map(([k, l]) => `<div class="${u[k] > st[k] ? 'trop' : ''}" title="${u[k] > st[k] ? 'Plus que ce que fournit la salle !' : 'Utilisées / disponibles dans la salle'}"><b>${u[k]}/${st[k]}</b><span>${l}</span></div>`).join('');
}

function rendreLegende(){
  const utilises = new Set(D.invites.filter(i => placeDe(i.id)).map(i => i.groupe));
  $('#legende').innerHTML = D.groupes.filter(g => utilises.has(g.id)).map(g => `<span><i style="background:${g.couleur}"></i>${echap(g.nom)}</span>`).join('');
}

/* ---------- liste des invités ---------- */
function placeDe(gid){
  for (const t of D.tables) { const i = t.sieges.indexOf(gid); if (i >= 0) return { table: t, i }; }
  return null;
}
function libelleTable(t){ return t.nom ? (t.numero ? `${t.numero} · ${t.nom}` : t.nom) : (t.numero ? 'Table ' + t.numero : 'Table'); }

function rendreInvites(){
  const total = D.invites.length, places = D.invites.filter(i => placeDe(i.id)).length;
  const capacite = D.tables.reduce((a, t) => a + t.n, 0);
  $('#compteurs').innerHTML = `<div><b>${total}</b><span>invités</span></div><div><b>${places}</b><span>placés</span></div><div><b>${capacite - places}</b><span>places libres</span></div>`;
  $('#badge-invites').textContent = total - places || '';
  const opts = D.groupes.map(g => `<option value="${g.id}">${echap(g.nom)}</option>`).join('');
  for (const id of ['#ajout-groupe', '#imp-groupe', '#fi-groupe']) { const el = $(id); const v = el.value; el.innerHTML = opts; if (v && D.groupes.some(g => g.id === v)) el.value = v; else if (D.groupes[1] && D.groupes[0].id === 'g-maries') el.value = D.groupes[1].id; }

  const q = sansAccent($('#recherche').value.trim()), f = $('#filtre').value;
  const ul = $('#liste-invites'); ul.innerHTML = '';
  const visibles = D.invites.filter(i => {
    const p = placeDe(i.id);
    if (f === 'libres' && p) return false;
    if (f === 'places' && !p) return false;
    return !q || sansAccent(i.nom).includes(q);
  });
  if (!visibles.length) {
    ul.innerHTML = `<li class="vide-liste">${total ? (f === 'libres' && !q ? 'Tout le monde est placé ✦' : 'Aucun invité ne correspond.') : 'Ajoutez vos invités ci-dessus, ou collez une liste.'}</li>`;
  }
  const parGroupe = new Map(D.groupes.map(g => [g.id, []])); parGroupe.set('_', []);
  visibles.forEach(i => (parGroupe.get(i.groupe) || parGroupe.get('_')).push(i));
  for (const [gid, liste] of parGroupe) {
    if (!liste.length) continue;
    const g = D.groupes.find(x => x.id === gid);
    ul.insertAdjacentHTML('beforeend', `<li class="grp"><i style="background:${g ? g.couleur : '#999'}"></i>${echap(g ? g.nom : 'Sans groupe')} · ${liste.length}</li>`);
    liste.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    for (const i of liste) {
      const p = placeDe(i.id);
      const li = document.createElement('li');
      li.className = 'invite' + (inviteActif === i.id ? ' actif' : '');
      li.dataset.invite = i.id;
      li.innerHTML = `<span class="poignee-drag" title="Glisser vers une place">⠿</span><span class="pastille-g" style="background:${g ? g.couleur : '#999'}"></span>
        <span class="n">${echap(i.nom)}${i.regime ? ' <small>' + iconeRegime(i.regime) + '</small>' : ''}${i.enfant ? ' <small>✿</small>' : ''}</span>
        ${p ? `<span class="t" title="${echap(libelleTable(p.table))}">${echap(p.table.numero || (p.table.nom || '').slice(0, 8))}</span>` : ''}
        <button class="ed" title="Modifier">✎</button>`;
      ul.appendChild(li);
    }
  }
  const a = inviteActif && D.invites.find(i => i.id === inviteActif);
  $('#actif-info').hidden = !a;
  if (a) $('#actif-info').innerHTML = `<b>${echap(a.nom)}</b> est en main : touchez une place libre sur le plan. <button id="b-lacher">Annuler</button>`;
  if (a) $('#b-lacher').onclick = () => { inviteActif = null; rendreInvites(); };
}

/* ---------- panneau de droite ---------- */
function trouverSel(){ if (!sel) return null; return (sel.type === 'table' ? D.tables : D.decors).find(x => x.id === sel.id) || null; }

function rendreProprietes(){
  const p = $('#proprietes'), o = trouverSel();
  if (!o) return rendreSalle(p);
  if (sel.type === 'table') return rendreTableProp(p, o);
  return rendreDecorProp(p, o);
}

function rendreTableProp(p, t){
  const ix = index();
  p.innerHTML = `
    <span class="sous">Table ${FORMES[t.forme] ? FORMES[t.forme].nom.toLowerCase() : ''}</span>
    <h2>${echap(libelleTable(t))}</h2>
    <div class="nom-idee"><div><label class="champ" for="p-nom">Nom de la table</label><input type="text" id="p-nom" data-champ="nom" value="${echap(t.nom || '')}" placeholder="Ex. Colibri"></div>
      <button class="icone-btn" id="p-idee" title="Une idée de nom dans l'esprit du faire-part">✦</button></div>
    <div class="duo"><div><label class="champ" for="p-num">Numéro</label><input type="text" id="p-num" data-champ="numero" value="${echap(t.numero || '')}" placeholder="—"></div>
      <div><label class="champ">Places</label><div class="stepper"><button data-places="-1" aria-label="Une place de moins">−</button><span>${t.n}</span><button data-places="1" aria-label="Une place de plus">+</button></div></div></div>

    ${['rect', 'honneur'].includes(t.forme) ? `<h4>Tables de la salle</h4>
    <div class="modules">${Object.entries(MODULES).map(([k, m]) => `<button class="btn petit ${t.module === k ? '' : 'clair'}" data-module="${k}">${m.nom}</button>`).join('')}<button class="btn petit ${t.module ? 'clair' : ''}" data-module="">Libre</button></div>
    ${t.module ? `<label class="champ">Nombre de tables ${MODULES[t.module].nom} mises bout à bout</label>
      <div class="stepper"><button data-nb="-1" aria-label="Une table de moins">−</button><span>${t.nb || 1}</span><button data-nb="1" aria-label="Une table de plus">+</button></div>
      <p class="aide">${(t.l / 100).toLocaleString('fr-FR')} m × ${(t.w / 100).toLocaleString('fr-FR')} m · ${placesModulaires(t)} places conseillées</p>` : ''}` : ''}
    <h4>Forme</h4>
    <div class="formes">${Object.entries(FORMES).map(([k, f]) => `<button data-forme="${k}" class="${t.forme === k ? 'actif' : ''}">${f.nom.split(' (')[0]}</button>`).join('')}</div>
    <div class="duo" ${t.module ? 'hidden' : ''}>
      <div><label class="champ" for="p-l">${t.forme === 'ronde' ? 'Diamètre' : 'Longueur'} (cm)</label><input type="number" id="p-l" data-champ="l" data-num="1" min="40" step="10" value="${t.l}"></div>
      ${t.forme === 'ronde' ? '<div></div>' : `<div><label class="champ" for="p-w">Largeur (cm)</label><input type="number" id="p-w" data-champ="w" data-num="1" min="40" step="10" value="${t.w}"></div>`}
    </div>
    ${t.forme === 'rect' ? `<label class="champ" for="p-bouts">Places en bout de table</label><select id="p-bouts" data-champ="bouts" data-num="1">${[0, 1, 2].map(b => `<option value="${b}" ${(t.bouts | 0) === b ? 'selected' : ''}>${b === 0 ? 'Aucune' : b + ' à chaque bout'}</option>`).join('')}</select>` : ''}
    <label class="champ" for="p-rot">Rotation · <span id="p-rot-v">${Math.round(t.rot || 0)}°</span></label><input type="range" id="p-rot" data-champ="rot" data-num="1" min="-180" max="180" step="5" value="${Math.round(t.rot || 0)}">

    <h4>Habillage</h4>
    <label class="champ">Nappe</label>
    <div class="nappes">${Object.entries(NAPPES).map(([k, n]) => `<button data-nappe="${k}" class="${(t.nappe || 'satin') === k ? 'actif' : ''}" title="${n.nom}" style="background:${apercuNappe(k)}"></button>`).join('')}</div>
    <label class="champ">Centre de table</label>
    <div class="centres">${Object.entries(CENTRES).map(([k, n]) => `<button data-centre="${k}" class="${(t.centre || 'aucun') === k ? 'actif' : ''}">${n}</button>`).join('')}</div>
    ${['rect', 'honneur', 'ovale'].includes(t.forme) ? `<label class="case"><input type="checkbox" id="p-chemin" ${t.chemin ? 'checked' : ''}> Chemin de table</label>` : ''}

    <h4>Convives · ${t.sieges.filter(Boolean).length}/${t.n}</h4>
    <ol class="convives">${t.sieges.map((gid, i) => {
      const inv = gid && ix.invites.get(gid), g = inv && ix.groupes.get(inv.groupe);
      return inv ? `<li><i style="background:${g ? g.couleur : '#999'}"></i><span>${echap(inv.nom)}${inv.regime ? ' ' + iconeRegime(inv.regime) : ''}</span><button data-liberer="${i}" title="Libérer cette place">×</button></li>`
                 : `<li class="libre"><i style="background:transparent;border:1px dashed #9aa1c0"></i><span>place libre</span></li>`;
    }).join('')}</ol>

    <div class="actions-prop">
      <button class="btn petit clair" id="p-dupliquer">Dupliquer</button>
      <button class="btn petit clair" id="p-vider">Vider la table</button>
      <button class="btn petit clair danger" id="p-suppr">Supprimer</button>
    </div>`;
  brancherChamps(p, t);
  $('#p-idee').onclick = () => {
    const pris = new Set(D.tables.map(x => x.nom));
    const libres = NOMS_TABLES.filter(n => !pris.has(n));
    const n = (libres.length ? libres : NOMS_TABLES)[Math.floor(Math.random() * (libres.length || NOMS_TABLES.length))];
    modifier(() => { t.nom = n; });
  };
  $$('[data-places]', p).forEach(b => b.onclick = () => changerPlaces(t, t.n + Number(b.dataset.places)));
  $$('[data-module]', p).forEach(b => b.onclick = () => {
    const k = b.dataset.module;
    if (!k) return modifier(() => { t.module = null; });
    const m = MODULES[k], nb = t.module === k ? t.nb : Math.max(1, Math.round(t.l / m.l));
    redimModules(t, k, nb);
  });
  $$('[data-nb]', p).forEach(b => b.onclick = () => redimModules(t, t.module, Math.max(1, (t.nb || 1) + Number(b.dataset.nb))));
  $$('[data-forme]', p).forEach(b => b.onclick = () => modifier(() => {
    const f = b.dataset.forme; if (f === t.forme) return;
    if (f === 'ronde') t.w = t.l;
    if (f === 'carree') { const c = Math.max(t.l, t.w); t.l = t.w = Math.min(c, 200); }
    if ((f === 'rect' || f === 'honneur') && t.w > 120) { t.l = Math.max(t.l, 220); t.w = 90; }
    if (f === 'ovale' && t.l === t.w) t.l = Math.round(t.l * 1.45);
    if (f === 'coeur') { t.l = 150; t.w = 130; }
    if (!['rect', 'honneur'].includes(f)) t.module = null;
    t.forme = f;
  }));
  $$('[data-nappe]', p).forEach(b => b.onclick = () => modifier(() => { t.nappe = b.dataset.nappe; }));
  $$('[data-centre]', p).forEach(b => b.onclick = () => modifier(() => { t.centre = b.dataset.centre; }));
  const ch = $('#p-chemin', p); if (ch) ch.onchange = () => modifier(() => { t.chemin = ch.checked; });
  $$('[data-liberer]', p).forEach(b => b.onclick = () => modifier(() => { t.sieges[Number(b.dataset.liberer)] = null; }));
  $('#p-dupliquer').onclick = () => dupliquerSel();
  $('#p-vider').onclick = () => { if (t.sieges.some(Boolean) && confirm('Libérer toutes les places de cette table ?')) modifier(() => { t.sieges = t.sieges.map(() => null); }); };
  $('#p-suppr').onclick = supprimerSel;
}
function apercuNappe(k){ return { satin: 'linear-gradient(135deg,#fff,#ebe6da)', ivoire: '#f6efdf', bleu: '#1b2652', ciel: '#e4e7f1', or: 'linear-gradient(135deg,#f1e2b6,#d9bf7f)', toile: '#fbfaf6 radial-gradient(circle at 30% 30%,#26356f 0 2px,transparent 3px) 0 0/10px 10px' }[k]; }

/* Assemble nb tables du modèle k bout à bout ; le nombre de places suit. */
function redimModules(t, k, nb){
  const m = MODULES[k]; nb = Math.min(nb, 30);
  const n = placesModulaires({ ...t, module: k, nb });
  if (n < t.n && t.sieges.slice(n).some(Boolean) && !confirm('Des invités sont assis sur les places retirées : ils retourneront dans la liste « à placer ». Continuer ?')) return;
  modifier(() => {
    t.module = k; t.nb = nb; t.l = m.l * nb; t.w = m.w;
    t.sieges = t.sieges.slice(0, n); while (t.sieges.length < n) t.sieges.push(null); t.n = n;
  });
}

function changerPlaces(t, n){
  n = Math.max(0, Math.min(40, n));
  if (n < t.n && t.sieges.slice(n).some(Boolean) && !confirm('Des invités sont assis sur les places retirées : ils retourneront dans la liste « à placer ». Continuer ?')) return;
  modifier(() => { t.sieges = t.sieges.slice(0, n); while (t.sieges.length < n) t.sieges.push(null); t.n = n; });
}

function rendreDecorProp(p, d){
  const T = TYPES_DECOR[d.type] || TYPES_DECOR.texte;
  p.innerHTML = `
    <span class="sous">Élément de décor</span>
    <h2>${echap(d.texte || T.nom)}</h2>
    <label class="champ" for="p-texte">${d.type === 'texte' ? 'Texte' : 'Libellé affiché'}</label><input type="text" id="p-texte" data-champ="texte" value="${echap(d.texte || '')}" placeholder="${echap(T.nom)}">
    <div class="duo">
      <div><label class="champ" for="p-l">Longueur (cm)</label><input type="number" id="p-l" data-champ="l" data-num="1" min="10" step="10" value="${d.l}"></div>
      <div><label class="champ" for="p-w">Largeur (cm)</label><input type="number" id="p-w" data-champ="w" data-num="1" min="5" step="5" value="${d.w}"></div>
    </div>
    <label class="champ" for="p-rot">Rotation · <span id="p-rot-v">${Math.round(d.rot || 0)}°</span></label><input type="range" id="p-rot" data-champ="rot" data-num="1" min="-180" max="180" step="5" value="${Math.round(d.rot || 0)}">
    <div class="actions-prop">
      <button class="btn petit clair" id="p-dupliquer">Dupliquer</button>
      <button class="btn petit clair" id="p-arriere" title="Placer sous les autres éléments">Mettre dessous</button>
      <button class="btn petit clair danger" id="p-suppr">Supprimer</button>
    </div>`;
  brancherChamps(p, d);
  $('#p-dupliquer').onclick = () => dupliquerSel();
  $('#p-arriere').onclick = () => modifier(() => { D.decors = [d, ...D.decors.filter(x => x !== d)]; });
  $('#p-suppr').onclick = supprimerSel;
}

function rendreSalle(p){
  const f = D.salle.fond;
  const total = D.invites.length, places = D.invites.filter(i => placeDe(i.id)).length;
  const regimes = D.invites.filter(i => i.regime).length, enfants = D.invites.filter(i => i.enfant).length;
  p.innerHTML = `
    <span class="sous">Rien de sélectionné</span>
    <h2>La salle</h2>
    <div class="stats">
      <div><b>${D.tables.length}</b><span>tables</span></div><div><b>${D.tables.reduce((a, t) => a + t.n, 0)}</b><span>couverts</span></div>
      <div><b>${places}/${total}</b><span>invités placés</span></div><div><b>${enfants} · ${regimes}</b><span>enfants · régimes</span></div>
    </div>
    <h4>Dimensions</h4>
    <div class="duo">
      <div><label class="champ" for="s-l">Longueur (m)</label><input type="number" id="s-l" min="4" max="100" step="0.5" value="${D.salle.l / 100}"></div>
      <div><label class="champ" for="s-h">Largeur (m)</label><input type="number" id="s-h" min="4" max="100" step="0.5" value="${D.salle.h / 100}"></div>
    </div>
    <label class="case"><input type="checkbox" id="s-grille" ${D.salle.grille ? 'checked' : ''}> Grille (un point tous les 50 cm, aimantation à 10 cm)</label>

    <h4>Mobilier fourni par la salle</h4>
    <div class="duo" style="grid-template-columns:1fr 1fr 1fr">
      <div><label class="champ" for="st-m120">80×120</label><input type="number" id="st-m120" min="0" value="${D.reglages.stock.m120}"></div>
      <div><label class="champ" for="st-m180">75×180</label><input type="number" id="st-m180" min="0" value="${D.reglages.stock.m180}"></div>
      <div><label class="champ" for="st-ch">Chaises</label><input type="number" id="st-ch" min="0" value="${D.reglages.stock.chaises}"></div>
    </div>
    <p class="aide">Le compteur en haut de l'onglet « Mobilier » passe en rouge si le plan en demande plus.</p>

    <h4>Plan de la salle en fond</h4>
    ${f ? `
      <label class="champ" for="f-op">Transparence</label><input type="range" id="f-op" min="0.1" max="1" step="0.05" value="${f.opacite}">
      <label class="champ" for="f-l">Largeur réelle de l'image (m)</label><input type="number" id="f-l" min="1" step="0.1" value="${(f.l / 100).toFixed(1)}">
      <p class="aide">Astuce : ajustez cette largeur jusqu'à ce qu'une table ronde de 1,80 m recouvre une table du plan.</p>
      <label class="case"><input type="checkbox" id="f-verrou" ${f.verrou ? 'checked' : ''}> Verrouiller le fond (sinon il se déplace à la souris)</label>
      <div class="actions-prop"><button class="btn petit clair" id="f-changer">Changer d'image</button><button class="btn petit clair danger" id="f-retirer">Retirer le fond</button></div>`
    : `<p class="aide">Importez une photo ou un scan du plan de la salle : il s'affiche sous vos tables pour les placer exactement.</p>
       <div class="actions-prop"><button class="btn petit" id="f-changer">Importer le plan de la salle</button></div>`}

    <h4>Affichage des noms</h4>
    <select id="s-aff">${[['prenom', 'Prénom + initiale'], ['complet', 'Prénom et nom'], ['initiales', 'Initiales']].map(([k, l]) => `<option value="${k}" ${D.reglages.affichage === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <label class="champ" for="s-police">Taille des noms</label><input type="range" id="s-police" min="10" max="40" step="1" value="${D.reglages.police}">

    <h4>Raccourcis</h4>
    <p class="aide">Glisser le fond : se déplacer · molette ou pincement : zoomer · Suppr : supprimer · Ctrl+D : dupliquer · flèches : ajuster · Ctrl+Z : annuler.</p>`;
  const num = (id, fn) => { const el = $(id, p); el.onfocus = () => { saisieEnCours = false; }; el.oninput = () => { const v = parseFloat(el.value); if (!(v > 0)) return; if (!saisieEnCours) { instantane(); saisieEnCours = true; } fn(v); marquerSale(); rendrePlan(); }; el.onchange = () => { saisieEnCours = false; }; };
  num('#s-l', v => { D.salle.l = Math.round(v * 100); });
  num('#s-h', v => { D.salle.h = Math.round(v * 100); });
  $('#s-grille', p).onchange = e => modifier(() => { D.salle.grille = e.target.checked; }, { panneau: false });
  $('#s-aff', p).onchange = e => modifier(() => { D.reglages.affichage = e.target.value; }, { panneau: false });
  num('#s-police', v => { D.reglages.police = v; });
  for (const [id, k] of [['#st-m120', 'm120'], ['#st-m180', 'm180'], ['#st-ch', 'chaises']]) num(id, v => { D.reglages.stock[k] = Math.round(v); rendreStock(); });
  $('#f-changer', p).onclick = () => $('#in-fond').click();
  if (f) {
    num('#f-op', v => { f.opacite = v; });
    num('#f-l', v => { const ratio = f.h / f.l; f.l = Math.round(v * 100); f.h = Math.round(f.l * ratio); });
    $('#f-verrou', p).onchange = e => modifier(() => { f.verrou = e.target.checked; }, { panneau: false });
    $('#f-retirer', p).onclick = () => { if (confirm('Retirer le plan de fond ?')) modifier(() => { D.salle.fond = null; }); };
  }
}

/* Champs liés : saisie en direct, un seul pas d'historique par champ */
function brancherChamps(p, obj){
  $$('[data-champ]', p).forEach(el => {
    el.addEventListener('focus', () => { saisieEnCours = false; });
    el.addEventListener('input', () => {
      let v = el.value;
      if (el.dataset.num) { v = parseFloat(v); if (isNaN(v)) return; }
      if (!saisieEnCours) { instantane(); saisieEnCours = true; }
      const k = el.dataset.champ;
      obj[k] = v;
      if (obj.forme === 'ronde' && k === 'l') obj.w = v;
      if (k === 'rot') { const s = $('#p-rot-v'); if (s) s.textContent = Math.round(v) + '°'; }
      marquerSale(); rendrePlan();
      if (k === 'nom' || k === 'numero' || k === 'texte') { const h = $('h2', p); if (h) h.textContent = sel.type === 'table' ? libelleTable(obj) : (obj.texte || TYPES_DECOR[obj.type].nom); rendreInvites(); }
    });
    el.addEventListener('change', () => {
      saisieEnCours = false;
      if (el.dataset.champ === 'bouts' && obj.module) redimModules(obj, obj.module, obj.nb);
      if (el.tagName === 'SELECT') rendreProprietes();
    });
  });
}

/* ============================================================
   Ajout, suppression, placement
   ============================================================ */
function construirePalettes(){
  // une seule copie des dégradés et motifs, toujours affichée (un <defs> masqué rendrait les nappes invisibles)
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${defsPlan()}</svg>`);
  const bouton = m => {
    const t = { ...m, id: 'apercu', x: 0, y: 0, rot: 0, nappe: m.forme === 'coeur' ? 'or' : 'satin', sieges: [] };
    const R = rayonTable(t);
    return `<button data-modele="${m.cle}" title="Ajouter : ${echap(m.label)}"><svg viewBox="${-R - 4} ${-R * .78} ${2 * R + 8} ${R * 1.56}">${renduTable(t, { lecture: true })}</svg>${echap(m.label)}</button>`;
  };
  $('#pal-salle').innerHTML = MODELES_SALLE.map(bouton).join('');
  $('#pal-tables').innerHTML = MODELES_TABLES.map(bouton).join('');
  $('#pal-decors').innerHTML = Object.entries(TYPES_DECOR).map(([k, T]) => {
    const d = { id: 'apercu', type: k, x: 0, y: 0, rot: 0, l: T.l, w: T.w, texte: k === 'texte' ? 'Aa' : '' };
    const L = Math.max(T.l, T.w) * .62 + 20;
    return `<button data-decor-type="${k}" title="Ajouter : ${echap(T.nom)}"><svg viewBox="${-L} ${-L * .74} ${2 * L} ${L * 1.48}">${renduDecor(d)}</svg>${echap(T.nom)}</button>`;
  }).join('');
  $$('#pal-salle [data-modele], #pal-tables [data-modele]').forEach(b => b.onclick = () => ajouterTable([...MODELES_SALLE, ...MODELES_TABLES].find(m => m.cle === b.dataset.modele)));
  $$('#pal-decors [data-decor-type]').forEach(b => b.onclick = () => ajouterDecor(b.dataset.decorType));
}

function positionLibre(rayon){
  const c = centreVue();
  for (let k = 0; k < 40; k++) {
    const a = k * 2.4, d = k ? 60 + k * 40 : 0;
    const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
    if (D.tables.every(t => Math.hypot(t.x - x, t.y - y) > rayonTable(t) + rayon)) return { x: aimanter(x), y: aimanter(y) };
  }
  return { x: aimanter(c.x), y: aimanter(c.y) };
}
function aimanter(v){ return D.salle.grille ? Math.round(v / GRILLE) * GRILLE : Math.round(v); }

function ajouterTable(m){
  const nums = D.tables.map(t => parseInt(t.numero, 10)).filter(n => !isNaN(n));
  const pris = new Set(D.tables.map(t => t.nom));
  const nom = m.cle === 'debout' ? '' : m.forme === 'coeur' ? 'Les mariés' : (NOMS_TABLES.find(n => !pris.has(n)) || '');
  const t = { id: uid(), forme: m.forme, l: m.l, w: m.w, n: m.n, bouts: m.bouts || 0, rot: 0, nom, module: m.module || null, nb: m.nb || 1,
    numero: m.cle === 'debout' || m.forme === 'coeur' ? '' : String((nums.length ? Math.max(...nums) : 0) + 1),
    nappe: m.forme === 'coeur' ? 'or' : 'satin', centre: m.cle === 'debout' ? 'aucun' : m.forme === 'coeur' ? 'bouquet' : 'bouquet', sieges: Array(m.n).fill(null) };
  Object.assign(t, positionLibre(rayonTable(t)));
  modifier(() => { D.tables.push(t); sel = { type: 'table', id: t.id }; });
  fermerTiroirs(); astuce('Table ajoutée : déplacez-la, puis glissez des invités sur ses places.');
  const u = stockUtilise(), st = D.reglages.stock;
  if (t.module && u[t.module] > st[t.module]) toast(`Attention : la salle n'a que ${st[t.module]} tables ${MODULES[t.module].nom}`, 3500);
  else if (u.chaises > st.chaises) toast(`Attention : ${u.chaises} chaises pour ${st.chaises} disponibles`, 3500);
}
function ajouterDecor(type){
  const T = TYPES_DECOR[type], c = centreVue();
  const d = { id: uid(), type, l: T.l, w: T.w, rot: 0, x: aimanter(c.x), y: aimanter(c.y), texte: type === 'texte' ? 'Votre texte' : '' };
  modifier(() => { D.decors.push(d); sel = { type: 'decor', id: d.id }; });
  fermerTiroirs();
}
function supprimerSel(){
  const o = trouverSel(); if (!o) return;
  if (sel.type === 'table' && o.sieges.some(Boolean) && !confirm(`Supprimer « ${libelleTable(o)} » ? Ses ${o.sieges.filter(Boolean).length} convives retourneront dans la liste à placer.`)) return;
  modifier(() => {
    if (sel.type === 'table') D.tables = D.tables.filter(t => t !== o); else D.decors = D.decors.filter(d => d !== o);
    sel = null;
  });
}
function dupliquerSel(){
  const o = trouverSel(); if (!o) return;
  const c = JSON.parse(JSON.stringify(o)); c.id = uid(); c.x += 60; c.y += 60;
  if (sel.type === 'table') {
    c.sieges = c.sieges.map(() => null);
    const nums = D.tables.map(t => parseInt(t.numero, 10)).filter(n => !isNaN(n));
    if (/^\d+$/.test(c.numero || '')) c.numero = String(Math.max(...nums) + 1);
    const pris = new Set(D.tables.map(t => t.nom)); if (pris.has(c.nom)) c.nom = NOMS_TABLES.find(n => !pris.has(n)) || c.nom;
    Object.assign(c, positionLibre(rayonTable(c)));
    modifier(() => { D.tables.push(c); sel = { type: 'table', id: c.id }; });
  } else modifier(() => { D.decors.push(c); sel = { type: 'decor', id: c.id }; });
}

/* Place un invité. Si la place est prise et que l'invité venait d'une autre place, on échange. */
function placer(gid, tid, i){
  const t = D.tables.find(x => x.id === tid); if (!t || i >= t.n) return;
  modifier(() => {
    const avant = placeDe(gid);
    const occupant = t.sieges[i];
    if (avant) avant.table.sieges[avant.i] = null;
    t.sieges[i] = gid;
    if (occupant && occupant !== gid && avant) avant.table.sieges[avant.i] = occupant;
  });
  const inv = D.invites.find(x => x.id === gid);
  if (inv) toast(`${inv.nom} → ${libelleTable(t)}`, 1400);
}
function placerSurTable(gid, tid){
  const t = D.tables.find(x => x.id === tid); if (!t) return;
  const i = t.sieges.findIndex(s => !s);
  if (i < 0) { toast('Cette table est complète'); return; }
  placer(gid, tid, i);
}
function liberer(gid){ const p = placeDe(gid); if (p) modifier(() => { p.table.sieges[p.i] = null; }); }

/* ============================================================
   Interactions sur le plan
   ============================================================ */
let geste = null;           // geste en cours
const pointeurs = new Map();

function brancherInterface(){
  svg.addEventListener('pointerdown', surPointerDown);
  svg.addEventListener('pointermove', surPointerMove);
  svg.addEventListener('pointerup', surPointerUp);
  svg.addEventListener('pointercancel', surPointerUp);
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomer(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  svg.addEventListener('dblclick', e => { const t = e.target.closest('[data-table]'); if (t && !e.target.closest('[data-siege]')) { ouvrirTiroir('droite'); const n = $('#p-nom'); if (n) { n.focus(); n.select(); } } });
  window.addEventListener('resize', () => appliquerCamera());

  $('#b-zoom-plus').onclick = () => zoomer(1.25);
  $('#b-zoom-moins').onclick = () => zoomer(.8);
  $('#b-zoom-ajuster').onclick = ajusterVue;
  $('#b-annuler').onclick = annuler; $('#b-refaire').onclick = refaire; majBoutonsHisto();
  $('#b-deco').onclick = async () => { await sauverMaintenant(); deconnecter(); };
  $('#b-gauche').onclick = () => basculerTiroir('gauche');
  $('#b-droite').onclick = () => basculerTiroir('droite');

  $$('.onglets button').forEach(b => b.onclick = () => {
    $$('.onglets button').forEach(x => x.classList.toggle('actif', x === b));
    $('#o-mobilier').hidden = b.dataset.onglet !== 'mobilier'; $('#o-invites').hidden = b.dataset.onglet !== 'invites';
  });

  // menus
  const menu = (btn, m) => { $(btn).onclick = e => { e.stopPropagation(); const v = $(m).hidden; $$('.menu').forEach(x => x.hidden = true); $(m).hidden = !v; }; };
  menu('#b-menu-plan', '#menu-plan'); menu('#b-imprimer', '#menu-imprimer');
  document.addEventListener('click', () => $$('.menu').forEach(x => x.hidden = true));
  $$('#menu-plan [data-act]').forEach(b => b.onclick = () => actionPlan(b.dataset.act));
  $$('#menu-imprimer [data-imp]').forEach(b => b.onclick = () => imprimer(b.dataset.imp));
  $('#sel-plan').onchange = e => ouvrirPlan(e.target.value);
  $('#chk-publier').onchange = publier;

  // invités
  $('#f-ajout').addEventListener('submit', e => {
    e.preventDefault();
    const nom = $('#ajout-nom').value.trim(); if (!nom) return;
    modifier(() => { D.invites.push({ id: uid(), nom, groupe: $('#ajout-groupe').value }); }, { panneau: false });
    $('#ajout-nom').value = ''; $('#ajout-nom').focus();
  });
  $('#recherche').oninput = rendreInvites; $('#filtre').onchange = rendreInvites;
  $('#liste-invites').addEventListener('pointerdown', surListePointerDown);
  $('#liste-invites').addEventListener('click', e => {
    const li = e.target.closest('[data-invite]'); if (!li) return;
    if (e.target.closest('.ed')) return ouvrirInvite(li.dataset.invite);
  });
  $('#b-import').onclick = () => { $('#imp-texte').value = ''; $('#dlg-import').showModal(); };
  $('#imp-annuler').onclick = () => $('#dlg-import').close();
  $('#form-import').addEventListener('submit', importerListe);
  $('#b-groupes').onclick = ouvrirGroupes;
  $('#grp-ajout').onclick = () => { modifier(() => { D.groupes.push({ id: uid(), nom: 'Nouveau groupe', couleur: COULEURS_GROUPES[D.groupes.length % COULEURS_GROUPES.length] }); }, { panneau: false }); rendreGroupes(); };
  $('#fi-annuler').onclick = () => $('#dlg-invite').close();

  // fond de plan, sauvegardes
  $('#in-fond').onchange = importerFond;
  $('#in-sauvegarde').onchange = importerSauvegarde;

  // clavier
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,select,dialog[open]')) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? refaire() : annuler(); }
    else if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); refaire(); }
    else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); dupliquerSel(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (sel) { e.preventDefault(); supprimerSel(); } }
    else if (e.key === 'Escape') { sel = null; inviteActif = null; fermerPop(); rendreTout({ panneau: true }); }
    else if (e.key.startsWith('Arrow') && sel) {
      e.preventDefault(); const o = trouverSel(), pas = e.shiftKey ? 50 : 5;
      modifier(() => { if (e.key === 'ArrowLeft') o.x -= pas; if (e.key === 'ArrowRight') o.x += pas; if (e.key === 'ArrowUp') o.y -= pas; if (e.key === 'ArrowDown') o.y += pas; }, { panneau: false });
    }
  });
}

function surPointerDown(e){
  fermerPop();
  pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  svg.setPointerCapture(e.pointerId);
  if (pointeurs.size === 2) { // pincement
    const [a, b] = [...pointeurs.values()];
    geste = { mode: 'pince', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: cam.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, x0: cam.x, y0: cam.y };
    return;
  }
  const m = versMonde(e.clientX, e.clientY);
  const cible = e.target.closest('[data-poignee],[data-siege],[data-table],[data-decor],[data-fond]');
  const base = { x0: e.clientX, y0: e.clientY, m0: m, bouge: false, id: e.pointerId };
  if (!cible) { geste = { ...base, mode: 'pan', camX: cam.x, camY: cam.y }; if (sel) { sel = null; rendreTout({ panneau: true }); } return; }

  if (cible.dataset.poignee) {
    const o = trouverSel();
    geste = { ...base, mode: cible.dataset.poignee === 'rot' ? 'rotation' : 'taille', obj: o, l0: o.l, w0: o.w };
    return;
  }
  if (cible.dataset.siege) {
    const [tid, i] = cible.dataset.siege.split(':'); const t = D.tables.find(x => x.id === tid);
    const gid = t && t.sieges[Number(i)];
    if (gid) { geste = { ...base, mode: 'invite', gid, depuis: { tid, i: Number(i) } }; return; }
    // place libre : un clic place, un glisser déplace la table
    geste = { ...base, mode: 'deplacer', type: 'table', obj: t, ox: t.x, oy: t.y, siegeLibre: { tid, i: Number(i) } };
    return;
  }
  if (cible.dataset.fond) { const f = D.salle.fond; geste = { ...base, mode: 'fond', ox: f.x, oy: f.y }; return; }
  const type = cible.dataset.table ? 'table' : 'decor';
  const id = cible.dataset.table || cible.dataset.decor;
  const obj = (type === 'table' ? D.tables : D.decors).find(x => x.id === id);
  if (!sel || sel.id !== id) { sel = { type, id }; rendrePlan(); rendreProprietes(); }
  // si un invité est « en main », toucher une table le place à la première place libre
  if (type === 'table' && inviteActif) { const g = inviteActif; inviteActif = null; placerSurTable(g, id); geste = null; return; }
  geste = { ...base, mode: 'deplacer', type, obj, ox: obj.x, oy: obj.y };
}

function surPointerMove(e){
  if (pointeurs.has(e.pointerId)) pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!geste) return;
  if (geste.mode === 'pince') {
    const [a, b] = [...pointeurs.values()]; if (!b) return;
    const d = Math.hypot(a.x - b.x, a.y - b.y), r = svg.getBoundingClientRect();
    const s2 = Math.min(4, Math.max(.05, geste.s0 * d / geste.d0));
    const cx = geste.cx - r.left, cy = geste.cy - r.top, ncx = (a.x + b.x) / 2 - r.left, ncy = (a.y + b.y) / 2 - r.top;
    cam.s = s2; cam.x = ncx - (cx - geste.x0) * s2 / geste.s0; cam.y = ncy - (cy - geste.y0) * s2 / geste.s0;
    appliquerCamera(); return;
  }
  if (e.pointerId !== geste.id) return;
  const dx = e.clientX - geste.x0, dy = e.clientY - geste.y0;
  if (!geste.bouge && Math.hypot(dx, dy) < 5) return;
  const premier = !geste.bouge; geste.bouge = true;
  const m = versMonde(e.clientX, e.clientY);

  switch (geste.mode) {
    case 'pan':
      svg.classList.add('pan'); cam.x = geste.camX + dx; cam.y = geste.camY + dy; appliquerCamera(); break;
    case 'deplacer': {
      if (premier) instantane();
      const o = geste.obj, libre = e.altKey;
      o.x = libre ? Math.round(geste.ox + m.x - geste.m0.x) : aimanter(geste.ox + m.x - geste.m0.x);
      o.y = libre ? Math.round(geste.oy + m.y - geste.m0.y) : aimanter(geste.oy + m.y - geste.m0.y);
      const g = monde.querySelector(`[data-${geste.type}="${o.id}"]`);
      if (g) g.setAttribute('transform', `translate(${o.x} ${o.y}) rotate(${o.rot || 0})`);
      break;
    }
    case 'rotation': {
      if (premier) instantane();
      const o = geste.obj;
      let a = Math.atan2(m.y - o.y, m.x - o.x) * 180 / Math.PI + 90;
      if (!e.shiftKey) a = Math.round(a / 15) * 15;
      o.rot = ((a + 540) % 360) - 180;
      rendrePlan(); const r = $('#p-rot'); if (r) { r.value = Math.round(o.rot); $('#p-rot-v').textContent = Math.round(o.rot) + '°'; }
      break;
    }
    case 'taille': {
      if (premier) instantane();
      const o = geste.obj, c = cosd(-(o.rot || 0)), s = sind(-(o.rot || 0));
      const lx = (m.x - o.x) * c - (m.y - o.y) * s, ly = (m.x - o.x) * s + (m.y - o.y) * c;
      o.l = Math.max(10, aimanter(Math.abs(lx) * 2 - 20)); o.w = Math.max(5, aimanter(Math.abs(ly) * 2 - 20));
      rendrePlan(); break;
    }
    case 'fond': {
      if (premier) instantane();
      const f = D.salle.fond; f.x = Math.round(geste.ox + m.x - geste.m0.x); f.y = Math.round(geste.oy + m.y - geste.m0.y);
      const im = monde.querySelector('[data-fond]'); if (im) { im.setAttribute('x', f.x); im.setAttribute('y', f.y); }
      break;
    }
    case 'invite':
      if (premier) debutFantome(geste.gid);
      bougerFantome(e.clientX, e.clientY);
      break;
  }
}

function surPointerUp(e){
  pointeurs.delete(e.pointerId);
  if (!geste) return;
  if (geste.mode === 'pince') { if (pointeurs.size === 0) geste = null; return; }
  if (e.pointerId !== geste.id) return;
  svg.classList.remove('pan');
  const g = geste; geste = null;
  if (g.mode === 'invite') {
    if (g.bouge) return finFantome(e.clientX, e.clientY, g.gid, g.depuis);
    if (inviteActif && inviteActif !== g.gid) { const a = inviteActif; inviteActif = null; return placer(a, g.depuis.tid, g.depuis.i); }
    return popSiege(e.clientX, e.clientY, g.depuis.tid, g.depuis.i);
  }
  if (g.mode === 'deplacer' && !g.bouge && g.siegeLibre) {
    if (inviteActif) { const a = inviteActif; inviteActif = null; return placer(a, g.siegeLibre.tid, g.siegeLibre.i); }
    return popSiege(e.clientX, e.clientY, g.siegeLibre.tid, g.siegeLibre.i);
  }
  if (g.bouge && ['deplacer', 'rotation', 'taille', 'fond'].includes(g.mode)) { marquerSale(); rendreTout({ panneau: g.mode === 'taille' }); }
}

/* ---------- glisser un invité ---------- */
let surbrillance = null;
function debutFantome(gid){
  const inv = D.invites.find(i => i.id === gid); if (!inv) return;
  const f = $('#fantome'); f.textContent = inv.nom; f.hidden = false;
  document.body.style.cursor = 'grabbing';
}
function bougerFantome(x, y){
  const f = $('#fantome'); f.style.left = x + 'px'; f.style.top = y + 'px';
  const el = document.elementFromPoint(x, y);
  const cible = el && (el.closest('[data-siege]') || el.closest('[data-table]'));
  if (surbrillance && surbrillance !== cible) surbrillance.classList.remove('cible');
  if (cible) cible.classList.add('cible');
  surbrillance = cible;
}
function finFantome(x, y, gid, depuis){
  $('#fantome').hidden = true; document.body.style.cursor = '';
  if (surbrillance) surbrillance.classList.remove('cible'); surbrillance = null;
  const el = document.elementFromPoint(x, y);
  const s = el && el.closest('[data-siege]'), t = el && el.closest('[data-table]');
  if (s) { const [tid, i] = s.dataset.siege.split(':'); return placer(gid, tid, Number(i)); }
  if (t) return placerSurTable(gid, t.dataset.table);
  if (depuis && el && (el.closest('#gauche') || el.closest('#svg'))) { liberer(gid); toast('Place libérée', 1200); }
}

/* Depuis la liste : glisser (souris, ou poignée ⠿ au doigt), ou toucher pour « prendre en main » */
function surListePointerDown(e){
  const li = e.target.closest('[data-invite]'); if (!li || e.target.closest('.ed')) return;
  const viaPoignee = !!e.target.closest('.poignee-drag');
  if (e.pointerType !== 'mouse' && !viaPoignee) {
    // au doigt : un simple toucher prend l'invité en main
    const y0 = e.clientY;
    li.addEventListener('pointerup', ev => { if (Math.abs(ev.clientY - y0) < 8) prendreEnMain(li.dataset.invite); }, { once: true });
    return;
  }
  e.preventDefault();
  const gid = li.dataset.invite, x0 = e.clientX, y0 = e.clientY; let bouge = false;
  const move = ev => {
    if (!bouge && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
    if (!bouge) { bouge = true; debutFantome(gid); if (innerWidth <= 980) fermerTiroirs(); }
    bougerFantome(ev.clientX, ev.clientY);
  };
  const up = ev => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    if (bouge) finFantome(ev.clientX, ev.clientY, gid, null); else prendreEnMain(gid);
  };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
}
function prendreEnMain(gid){
  inviteActif = inviteActif === gid ? null : gid;
  rendreInvites();
  if (inviteActif) { astuce('Touchez une place libre (ou une table) pour y asseoir ' + D.invites.find(i => i.id === gid).nom); if (innerWidth <= 980) fermerTiroirs(); }
}

/* ---------- petite fenêtre sur une place ---------- */
function popSiege(x, y, tid, i){
  const t = D.tables.find(z => z.id === tid); if (!t) return;
  const gid = t.sieges[i], ix = index(), pop = $('#pop');
  if (gid) {
    const inv = ix.invites.get(gid), g = inv && ix.groupes.get(inv.groupe);
    pop.innerHTML = `<h5>${echap(inv ? inv.nom : '?')}</h5><p class="aide">${echap(libelleTable(t))} · place ${i + 1}${g ? ' · ' + echap(g.nom) : ''}${inv && inv.regime ? '<br>' + echap(inv.regime) : ''}</p>
      <div class="actions"><button class="btn petit clair" data-a="modif">Modifier</button><button class="btn petit clair" data-a="lib">Libérer la place</button></div>`;
    pop.querySelector('[data-a=modif]').onclick = () => { fermerPop(); ouvrirInvite(gid); };
    pop.querySelector('[data-a=lib]').onclick = () => { fermerPop(); liberer(gid); };
  } else {
    pop.innerHTML = `<h5>${echap(libelleTable(t))} · place ${i + 1}</h5><input type="search" id="pop-q" placeholder="Qui s'assoit ici ?" autocomplete="off"><ul id="pop-l"></ul>`;
    const majListe = () => {
      const q = sansAccent($('#pop-q').value.trim());
      const libres = D.invites.filter(v => !placeDe(v.id) && (!q || sansAccent(v.nom).includes(q))).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).slice(0, 30);
      const brut = $('#pop-q').value.trim();
      $('#pop-l').innerHTML = libres.map((v, k) => { const g = ix.groupes.get(v.groupe); return `<li><button data-g="${v.id}" class="${k === 0 ? 'focus' : ''}"><i style="background:${g ? g.couleur : '#999'}"></i>${echap(v.nom)}</button></li>`; }).join('')
        + (brut && !D.invites.some(v => sansAccent(v.nom) === sansAccent(brut)) ? `<li><button data-nouveau="1">＋ Ajouter « ${echap(brut)} »</button></li>` : '')
        + (!libres.length && !brut ? '<li class="aide" style="padding:6px">Tout le monde est déjà placé.</li>' : '');
      $$('#pop-l [data-g]').forEach(b => b.onclick = () => { fermerPop(); placer(b.dataset.g, tid, i); });
      const n = $('#pop-l [data-nouveau]');
      if (n) n.onclick = () => { const id = uid(); fermerPop(); modifier(() => { D.invites.push({ id, nom: brut, groupe: D.groupes[1] ? D.groupes[1].id : (D.groupes[0] || {}).id }); t.sieges[i] = id; }); };
    };
    setTimeout(() => { const q = $('#pop-q'); if (!q) return; q.oninput = majListe; q.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); const b = $('#pop-l button'); if (b) b.click(); } }; majListe(); if (matchMedia('(pointer:fine)').matches) q.focus(); });
  }
  pop.hidden = false;
  const w = 270, h = pop.offsetHeight || 200;
  pop.style.left = Math.min(innerWidth - w - 8, Math.max(8, x + 12)) + 'px';
  pop.style.top = Math.min(innerHeight - h - 8, Math.max(64, y - 20)) + 'px';
}
function fermerPop(){ $('#pop').hidden = true; }
document.addEventListener('pointerdown', e => { if (!$('#pop').hidden && !e.target.closest('#pop') && !e.target.closest('#svg')) fermerPop(); });

/* ---------- fiche invité ---------- */
function ouvrirInvite(gid){
  const inv = D.invites.find(i => i.id === gid); if (!inv) return;
  rendreInvites();
  $('#fi-nom').value = inv.nom; $('#fi-groupe').value = inv.groupe || ''; $('#fi-regime').value = inv.regime || '';
  $('#fi-enfant').checked = !!inv.enfant; $('#fi-note').value = inv.note || '';
  const p = placeDe(gid);
  $('#fi-place').textContent = p ? `Assis·e à : ${libelleTable(p.table)}, place ${p.i + 1}` : 'Pas encore placé·e.';
  $('#fi-liberer').hidden = !p;
  $('#form-invite').onsubmit = e => {
    e.preventDefault();
    const nom = $('#fi-nom').value.trim(); if (!nom) return;
    modifier(() => { Object.assign(inv, { nom, groupe: $('#fi-groupe').value, regime: $('#fi-regime').value.trim(), enfant: $('#fi-enfant').checked, note: $('#fi-note').value.trim() }); });
    $('#dlg-invite').close();
  };
  $('#fi-liberer').onclick = () => { liberer(gid); $('#dlg-invite').close(); };
  $('#fi-suppr').onclick = () => {
    if (!confirm(`Retirer ${inv.nom} de la liste des invités ?`)) return;
    modifier(() => { const pl = placeDe(gid); if (pl) pl.table.sieges[pl.i] = null; D.invites = D.invites.filter(i => i.id !== gid); if (inviteActif === gid) inviteActif = null; });
    $('#dlg-invite').close();
  };
  $('#dlg-invite').showModal();
}

function importerListe(e){
  e.preventDefault();
  const lignes = $('#imp-texte').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lignes.length) { $('#dlg-import').close(); return; }
  const defaut = $('#imp-groupe').value;
  let n = 0, doublons = 0;
  modifier(() => {
    for (const l of lignes) {
      const morceaux = l.split(/\s*[;\t]\s*/);
      const nom = morceaux[0].replace(/\s+/g, ' ').trim(); if (!nom) continue;
      if (D.invites.some(i => sansAccent(i.nom) === sansAccent(nom))) { doublons++; continue; }
      let groupe = defaut;
      if (morceaux[1]) {
        let g = D.groupes.find(x => sansAccent(x.nom) === sansAccent(morceaux[1]));
        if (!g) { g = { id: uid(), nom: morceaux[1], couleur: COULEURS_GROUPES[D.groupes.length % COULEURS_GROUPES.length] }; D.groupes.push(g); }
        groupe = g.id;
      }
      const regime = morceaux[2] || '';
      D.invites.push({ id: uid(), nom, groupe, regime, enfant: /enfant/i.test(morceaux.slice(1).join(' ')) });
      n++;
    }
  });
  $('#dlg-import').close();
  toast(`${n} invité${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}${doublons ? `, ${doublons} déjà dans la liste` : ''}`, 3000);
  $$('.onglets button')[1].click();
}

function ouvrirGroupes(){ rendreGroupes(); $('#dlg-groupes').showModal(); }
function rendreGroupes(){
  const ul = $('#liste-groupes'); ul.innerHTML = '';
  for (const g of D.groupes) {
    const nb = D.invites.filter(i => i.groupe === g.id).length;
    const li = document.createElement('li');
    li.innerHTML = `<input type="color" value="${g.couleur}"><input type="text" value="${echap(g.nom)}"><span class="nb">${nb}</span><button type="button" title="Supprimer">×</button>`;
    const [c, n] = li.querySelectorAll('input');
    c.oninput = () => { g.couleur = c.value; marquerSale(); rendreTout({ panneau: false }); };
    c.onchange = () => {};
    n.oninput = () => { g.nom = n.value; marquerSale(); rendreInvites(); rendreLegende(); };
    li.querySelector('button').onclick = () => {
      if (D.groupes.length <= 1) return;
      if (nb && !confirm(`Supprimer le groupe « ${g.nom} » ? Ses ${nb} invités passeront dans « ${D.groupes.find(x => x !== g).nom} ».`)) return;
      modifier(() => { const autre = D.groupes.find(x => x !== g); D.invites.forEach(i => { if (i.groupe === g.id) i.groupe = autre.id; }); D.groupes = D.groupes.filter(x => x !== g); }, { panneau: false });
      rendreGroupes();
    };
    ul.appendChild(li);
  }
}

/* ============================================================
   Plans : variantes, publication, fond, sauvegardes
   ============================================================ */
async function actionPlan(act){
  $$('.menu').forEach(x => x.hidden = true);
  if (act === 'nouveau') {
    const nom = prompt('Nom du nouveau plan :', 'Variante ' + (plans.length + 1)); if (!nom) return;
    await sauverMaintenant();
    const vierge = { salle: { ...D.salle }, reglages: { ...D.reglages }, groupes: JSON.parse(JSON.stringify(D.groupes)), invites: JSON.parse(JSON.stringify(D.invites)), tables: [], decors: JSON.parse(JSON.stringify(D.decors)) };
    const id = await creerPlan(nom.trim(), vierge); if (id) ouvrirPlan(id);
  } else if (act === 'dupliquer') {
    const nom = prompt('Nom de la copie :', plan.nom + ' (copie)'); if (!nom) return;
    await sauverMaintenant();
    const id = await creerPlan(nom.trim(), JSON.parse(JSON.stringify(D))); if (id) ouvrirPlan(id);
  } else if (act === 'renommer') {
    const nom = prompt('Nouveau nom :', plan.nom); if (!nom) return;
    const { error } = await sb.from('mo_plans').update({ nom: nom.trim() }).eq('id', plan.id);
    if (error) return alert(error.message);
    plan.nom = nom.trim(); plans.find(p => p.id === plan.id).nom = plan.nom; rendreSelecteurPlans();
  } else if (act === 'supprimer') {
    if (plans.length <= 1) return alert('C\'est le seul plan : il ne peut pas être supprimé.');
    if (!confirm(`Supprimer définitivement le plan « ${plan.nom} » ?`)) return;
    sauvegarde.sale = false; clearTimeout(sauvegarde.minuterie);
    const { error } = await sb.from('mo_plans').delete().eq('id', plan.id);
    if (error) return alert(error.message);
    plans = plans.filter(p => p.id !== plan.id); ouvrirPlan(plans[0].id);
  } else if (act === 'exporter') {
    telecharger(new Blob([JSON.stringify({ nom: plan.nom, data: D }, null, 1)], { type: 'application/json' }), `plan-de-table-${sansAccent(plan.nom).replace(/[^a-z0-9]+/g, '-')}.json`);
  } else if (act === 'importer') $('#in-sauvegarde').click();
  else if (act === 'publier') { $('#chk-publier').checked = !$('#chk-publier').checked; publier(); }
  else if (act === 'deco') { await sauverMaintenant(); deconnecter(); }
}
async function importerSauvegarde(e){
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); const data = normaliser(j.data || j);
    const id = await creerPlan((j.nom || 'Plan importé') + ' (importé)', data); if (id) ouvrirPlan(id);
  } catch (err) { alert('Fichier illisible : ' + err.message); }
}
async function publier(){
  const on = $('#chk-publier').checked;
  if (on && !confirm('Publier ce plan ? Les invités qui ont le lien « Trouver ma table » pourront y chercher leur nom et voir leur table et leurs voisins.')) { $('#chk-publier').checked = false; return; }
  await sauverMaintenant();
  if (on) { const { error } = await sb.from('mo_plans').update({ publie: false }).neq('id', plan.id).eq('publie', true); if (error) { alert(error.message); $('#chk-publier').checked = false; return; } }
  const { error } = await sb.from('mo_plans').update({ publie: on }).eq('id', plan.id);
  if (error) { alert(error.message); $('#chk-publier').checked = !on; return; }
  plan.publie = on; plans.forEach(p => p.publie = on ? p.id === plan.id : (p.id === plan.id ? false : p.publie)); rendreSelecteurPlans();
  toast(on ? 'Publié : « Trouver ma table » montre ce plan' : 'Dépublié : les invités ne voient plus rien', 3000);
}

async function importerFond(e){
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  statut('Envoi du plan de fond…');
  const chemin = `fonds/${uid()}-${f.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-60)}`;
  const { error } = await sb.storage.from(CONFIG.BUCKET_PLANS).upload(chemin, f, { contentType: f.type });
  if (error) { statut('Échec de l\'envoi', 'err'); alert('Envoi impossible : ' + error.message); return; }
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    const ratio = img.naturalHeight / img.naturalWidth;
    modifier(() => {
      const l = D.salle.l;
      D.salle.fond = { chemin, x: 0, y: 0, l, h: Math.round(l * ratio), opacite: .55, verrou: false };
      sel = null;
    });
    urlFond = url; rendrePlan(); ajusterVue();
    astuce('Plan importé. Réglez sa largeur réelle dans le panneau « La salle », puis verrouillez-le.', 5000);
  };
  img.src = url;
}
async function chargerFond(){
  urlFond = null;
  const f = D.salle.fond; if (!f) return;
  if (f.url) { urlFond = f.url; return; }
  if (!f.chemin) return;
  const { data } = await sb.storage.from(CONFIG.BUCKET_PLANS).createSignedUrl(f.chemin, 60 * 60 * 24);
  if (data) urlFond = data.signedUrl;
}

/* ============================================================
   Impressions
   ============================================================ */
function imprimer(type){
  $$('.menu').forEach(x => x.hidden = true);
  const ix = index(), imp = $('#impression');
  const tete = titre => `<div class="imp-tete"><div class="monogramme">M<span class="et">&amp;</span>O</div><h1>${titre}</h1><p class="capitales">${CONFIG.DATE_LONGUE}</p></div>`;
  const tables = [...D.tables].filter(t => t.n).sort((a, b) => (parseInt(a.numero, 10) || 999) - (parseInt(b.numero, 10) || 999) || (a.nom || '').localeCompare(b.nom || '', 'fr'));
  let html = '', paysage = false;
  if (type === 'csv') {
    const l = [['Nom', 'Groupe', 'Table', 'Numéro', 'Place', 'Régime', 'Enfant', 'Note']];
    for (const i of [...D.invites].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))) {
      const p = placeDe(i.id), g = ix.groupes.get(i.groupe);
      l.push([i.nom, g ? g.nom : '', p ? p.table.nom || '' : '', p ? p.table.numero || '' : '', p ? p.i + 1 : '', i.regime || '', i.enfant ? 'oui' : '', i.note || '']);
    }
    const csv = l.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    return telecharger(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), 'plan-de-table.csv');
  }
  if (type === 'plan') {
    paysage = true;
    const m = 120, vb = `${-m} ${-m} ${D.salle.l + 2 * m} ${D.salle.h + 2 * m}`;
    let s = `<rect class="sol" x="0" y="0" width="${D.salle.l}" height="${D.salle.h}" style="fill:#fff;stroke:#1b2652;stroke-width:6"/>`;
    for (const d of D.decors) s += renduDecor(d);
    for (const t of D.tables) s += renduTable(t, { ...ix, affichage: D.reglages.affichage, police: D.reglages.police });
    html = `<div class="imp-page imp-plan">${tete('Plan de table')}<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${s}</svg></div>`;
  } else if (type === 'tables') {
    html = `<div class="imp-page">${tete('Les tables')}<div class="imp-tables">${tables.map(t => `<div class="imp-table"><div class="num">${t.numero ? 'Table ' + echap(t.numero) : ''}</div><h3>${echap(t.nom || 'Table')}</h3><ol>${t.sieges.filter(Boolean).map(g => { const i = ix.invites.get(g); return i ? `<li>${echap(i.nom)}${i.regime ? ' · <em>' + echap(i.regime) + '</em>' : ''}${i.enfant ? ' · enfant' : ''}</li>` : ''; }).join('')}</ol></div>`).join('')}</div></div>`;
  } else if (type === 'alpha') {
    const liste = D.invites.map(i => ({ i, p: placeDe(i.id) })).filter(x => x.p).sort((a, b) => nomDeFamille(a.i.nom).localeCompare(nomDeFamille(b.i.nom), 'fr') || a.i.nom.localeCompare(b.i.nom, 'fr'));
    let lettre = '', corps = '';
    for (const { i, p } of liste) {
      const L = sansAccent(nomDeFamille(i.nom))[0].toUpperCase();
      if (L !== lettre) { lettre = L; corps += `<div class="lettre">${L}</div>`; }
      corps += `<div class="l"><span>${echap(nomInverse(i.nom))}</span><span class="pts"></span><span>${echap(libelleTable(p.table))}</span></div>`;
    }
    html = `<div class="imp-page">${tete('Trouvez votre table')}<div class="imp-alpha">${corps}</div></div>`;
  } else if (type === 'cartons') {
    const liste = tables.flatMap(t => t.sieges.filter(Boolean).map(g => ({ i: ix.invites.get(g), t }))).filter(x => x.i);
    const ornes = ['colibri', 'oiseau-branche', 'colibri-droit', 'motif-a'];
    html = `<div class="imp-page imp-cartons">${liste.map(({ i, t }, k) => `<div class="carton"><span class="pli"></span>${motif(ornes[k % ornes.length], '', 'position:absolute;right:3mm;bottom:2mm;width:20mm;max-height:22mm;object-fit:contain')}<div class="bas"><div class="nom">${echap(i.nom)}</div><div class="tab">${echap(libelleTable(t))}</div></div></div>`).join('')}</div>`;
  } else if (type === 'traiteur') {
    let tot = { a: 0, e: 0 }, lignes = '';
    for (const t of tables) {
      const inv = t.sieges.filter(Boolean).map(g => ix.invites.get(g)).filter(Boolean);
      const e = inv.filter(i => i.enfant).length, a = inv.length - e; tot.a += a; tot.e += e;
      const reg = inv.filter(i => i.regime).map(i => `${echap(i.nom)} : ${echap(i.regime)}`).join('<br>');
      lignes += `<tr><td>${echap(libelleTable(t))}</td><td>${a}</td><td>${e}</td><td>${reg || '—'}</td></tr>`;
    }
    html = `<div class="imp-page imp-traiteur">${tete('Récapitulatif traiteur')}<table><thead><tr><th>Table</th><th>Adultes</th><th>Enfants</th><th>Régimes &amp; allergies</th></tr></thead><tbody>${lignes}</tbody>
      <tfoot><tr><td>Total</td><td>${tot.a}</td><td>${tot.e}</td><td>${tot.a + tot.e} couverts</td></tr></tfoot></table></div>`;
  }
  imp.innerHTML = `<style>@page{size:A4 ${paysage ? 'landscape' : 'portrait'};margin:12mm}</style>` + html;
  setTimeout(() => print(), 300);
}
function nomDeFamille(n){ const p = n.trim().split(/\s+/); return p.length > 1 ? p.slice(1).join(' ') : p[0]; }
function nomInverse(n){ const p = n.trim().split(/\s+/); return p.length > 1 ? `${p.slice(1).join(' ').toUpperCase()} ${p[0]}` : n; }

/* ---------- divers ---------- */
function astuce(txt, ms = 3200){ const a = $('#astuce'); a.textContent = txt; a.classList.add('vu'); clearTimeout(a._h); a._h = setTimeout(() => a.classList.remove('vu'), ms); }
function basculerTiroir(c){ const on = !document.body.classList.contains('voir-' + c); fermerTiroirs(); document.body.classList.toggle('voir-' + c, on); }
function ouvrirTiroir(c){ fermerTiroirs(); document.body.classList.add('voir-' + c); }
function fermerTiroirs(){ document.body.classList.remove('voir-gauche', 'voir-droite'); }
