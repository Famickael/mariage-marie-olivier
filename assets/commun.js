/* ============================================================
   Commun à toutes les pages : connexion Supabase, outils, ornements.
   Projet Supabase partagé avec le site d'Aude & Jérémie : les tables et
   espaces de stockage de ce mariage sont préfixés mo_ / mo-.
   La clé "anon / publishable" est publique par conception : ce que
   chacun peut lire ou écrire est décidé par les règles RLS en base.
   ============================================================ */
const CONFIG = {
  SUPABASE_URL: 'https://wrcjthhrouditgbpjegy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyY2p0aGhyb3VkaXRnYnBqZWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTIxNDAsImV4cCI6MjEwNDk4ODE0MH0.8Tubv77Ugz5fhPLUl1ZJCa8QA3JVXKtagkeD-0TBXWk',
  BUCKET_SOUVENIRS: 'mo-souvenirs',
  BUCKET_PLANS: 'mo-plans',
  COUPLE: 'Marie & Olivier',
  DATE_ISO: '2026-12-05',
  DATE_LONGUE: 'Samedi 5 décembre 2026'
};
const CONFIGURE = !CONFIG.SUPABASE_URL.includes('VOTRE-PROJET');
const sb = (CONFIGURE && window.supabase) ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) : null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function echap(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function taille(o){ return o < 1048576 ? (o/1024).toFixed(0) + ' Ko' : o < 1073741824 ? (o/1048576).toFixed(1) + ' Mo' : (o/1073741824).toFixed(2) + ' Go'; }
function sansAccent(s){ return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }
function uid(){ return uuid().slice(0, 12); }
function telecharger(blob, nom){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }

function toast(txt, ms = 2200){
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = txt; t.classList.add('vu'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('vu'), ms);
}

/* URL absolue d'une page du site, pour partager un lien ou un QR code. */
function urlSite(chemin){ const base = location.href.replace(/[^/]*([?#].*)?$/, ''); return new URL(chemin, base).href; }

/* ---------- Pages organisateurs ----------
   Pas de mot de passe : l'accès repose sur des liens distincts, donnés seulement à la famille.
   Chaque page organisateur porte le même bandeau, avec la zone « publication » toujours à droite. */

/* bandeauOrga(el, { titre, publication }) : publication = { type:'interrupteur', actif, libelle, onChange }
   ou { type:'etat', texte, lien, lienTexte } */
function bandeauOrga(el, o){
  el.className = 'bandeau-orga';
  let pub = '';
  if (o.publication && o.publication.type === 'interrupteur') {
    pub = `<label class="publier" title="${echap(o.publication.aide || '')}"><span class="lib">${echap(o.publication.libelle)}</span><input type="checkbox" id="bandeau-publier" ${o.publication.actif ? 'checked' : ''}><span class="interrupteur"></span><span class="etat">${o.publication.actif ? 'Publié' : 'Non publié'}</span></label>`;
  } else if (o.publication) {
    pub = `<span class="pub-etat"><span class="lib">${echap(o.publication.libelle || 'Publication')}</span><b id="bandeau-pub-texte">${echap(o.publication.texte || '')}</b>${o.publication.lien ? `<a class="btn petit or" href="${o.publication.lien}" target="_blank" rel="noopener">${echap(o.publication.lienTexte || 'Voir la page des invités')}</a>` : ''}</span>`;
  }
  el.innerHTML = `<a class="retour" href="${BASE_ASSETS}../" title="Retour à l'accueil"><span class="monogramme">M<span class="et">&amp;</span>O</span></a>
    <span class="titre-bandeau">${echap(o.titre)}</span><span class="actions-bandeau">${o.actions || ''}</span><span class="espace"></span>${pub}`;
  const c = el.querySelector('#bandeau-publier');
  if (c && o.publication.onChange) c.onchange = () => { o.publication.onChange(c.checked, v => { c.checked = v; el.querySelector('.etat').textContent = v ? 'Publié' : 'Non publié'; }); };
}
function majBandeauPub(texte){ const b = $('#bandeau-pub-texte'); if (b) b.textContent = texte; }

/* ---------- Réglages de publication (table mo_reglages) ---------- */
async function reglage(cle, defaut = false){
  if (!sb) return defaut;
  const { data } = await sb.from('mo_reglages').select('valeur').eq('cle', cle).maybeSingle();
  return data ? data.valeur : defaut;
}
async function definirReglage(cle, valeur){
  const { error } = await sb.from('mo_reglages').upsert({ cle, valeur, updated_at: new Date().toISOString() });
  if (error) { toast('Enregistrement impossible : ' + error.message, 4000); return false; }
  return true;
}
/* Interrupteur de publication standard du bandeau : lit le réglage, l'enregistre, confirme à la publication. */
async function publicationReglage(cle, libelle, aide, question){
  const actif = await reglage(cle, false);
  return { type: 'interrupteur', libelle, aide, actif, onChange: async (v, retablir) => {
    if (v && question && !confirm(question)) { retablir(false); return; }
    const ok = await definirReglage(cle, v);
    if (!ok) { retablir(!v); return; }
    retablir(v); toast(v ? `${libelle} : publié` : `${libelle} : non publié`, 2500);
  } };
}

/* Motifs du faire-part : <img> détourées (assets/motifs/*.png). `base` = chemin relatif vers assets/. */
const BASE_ASSETS = (document.currentScript && document.currentScript.src.replace(/commun\.js.*$/, '')) || 'assets/';
function motif(nom, cls = '', style = ''){ return `<img class="motif ${cls}" style="${style}" src="${BASE_ASSETS}motifs/${nom}.png" alt="" draggable="false" decoding="async">`; }

/* Colonnes latérales (grands écrans) : les deux panneaux du faire-part ouvert, de part et d'autre du contenu. */
function colonnesCote(){
  // les grands panneaux ne sont chargés que si l'écran est assez large pour les afficher
  const poser = () => { if ($('.cote') || !matchMedia('(min-width:980px)').matches) return; document.body.insertAdjacentHTML('afterbegin', `<div class="cote gauche" aria-hidden="true">${motif('panneau-gauche')}</div><div class="cote droite" aria-hidden="true">${motif('panneau-droit')}</div>`); };
  poser(); matchMedia('(min-width:980px)').addEventListener('change', poser);
  // petits écrans : quelques motifs du faire-part en fond, le long des bords
  // (répartis sur la hauteur réelle de la page, en évitant le pied bleu)
  if (!matchMedia('(min-width:980px)').matches && !$('.fond-mobile')) {
    const pied = $('.pied-bleu'); const H = (pied ? pied.offsetTop : document.documentElement.scrollHeight) - innerWidth * .4;
    const noms = [['couv-droite-haut', 'a'], ['couv-gauche-bas', 'b'], ['oiseau-branche', 'c'], ['motif-a', 'd']];
    const n = Math.max(2, Math.min(4, Math.floor(H / (innerHeight * .5))));
    noms.slice(0, n).forEach(([nom, cls], i) => document.body.insertAdjacentHTML('afterbegin', motif(nom, 'fond-mobile ' + cls, `top:${Math.round(innerHeight * .5 + (H - innerHeight * .5) * i / n)}px`)));
  }
}

/* En-tête commun des pages invités : <header class="entete-site" data-titre="…" data-sous="…"> */
function enteteSite(el){
  el.classList.add('carte-papier', 'cadre');
  el.innerHTML = `${motif('motif-a', 'orn a')}${motif('couv-droite-haut', 'orn b')}${motif('coin-bas-gauche', 'orn c').replace('alt=""', 'alt="" onerror="this.remove()"')}
    <p class="capitales">Notre mariage</p>
    <div class="monogramme">M<span class="et">&amp;</span>O</div>
    <p class="capitales" style="letter-spacing:.3em">05.12.2026</p>
    <div class="filet-or"><span>✦</span></div>
    <h1>${echap(el.dataset.titre || '')}</h1>
    ${el.dataset.sous ? `<p class="sous">${el.dataset.sous}</p>` : ''}
    <span class="ruban-coin" aria-hidden="true"><svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg">
      <path d="M152 128 C 120 160, 96 200, 70 250 L 112 250 L 100 232 C 124 196, 146 164, 166 136 Z" fill="#1b2652"/>
      <path d="M168 128 C 196 150, 232 170, 268 180 L 274 212 L 246 204 C 216 190, 186 168, 162 142 Z" fill="#1b2652"/>
      <path d="M158 122 C 110 70, 30 74, 26 118 C 22 164, 96 170, 158 128 Z" fill="#1b2652"/><path d="M152 122 C 110 92, 56 94, 48 118 C 56 146, 112 146, 150 124" fill="none" stroke="#0f1838" stroke-opacity=".45" stroke-width="4"/>
      <path d="M162 122 C 206 60, 300 66, 298 112 C 296 160, 214 172, 162 128 Z" fill="#1b2652"/><path d="M168 122 C 210 90, 268 90, 276 112 C 268 142, 212 146, 170 124" fill="none" stroke="#0f1838" stroke-opacity=".45" stroke-width="4"/>
      <path d="M136 104 C 148 98, 172 98, 184 104 C 194 118, 194 136, 184 148 C 170 156, 150 156, 136 148 C 126 136, 126 118, 136 104 Z" fill="#141d4a"/>
    </svg></span>`;
}
document.addEventListener('DOMContentLoaded', () => { $$('header.entete-site').forEach(enteteSite); if (document.body.dataset.cotes !== 'non') colonnesCote(); });

function piedBleu(){
  return `${motif('pied-gauche', 'blanc orn a')}${motif('pied-droit', 'blanc orn b')}
    <div class="monogramme">M<span class="et">&amp;</span>O</div>
    <p class="capitales">Samedi 5 décembre 2026 · Ouvrouer-les-Champs</p>`;
}

/* QR code (bibliothèque qrcodejs chargée par la page) */
function qrDans(el, texte, taille = 160){
  el.innerHTML = '';
  if (!window.QRCode) { el.textContent = texte; return; }
  new QRCode(el, { text: texte, width: taille, height: taille, colorDark: '#1b2652', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
}
