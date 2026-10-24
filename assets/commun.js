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
function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12); }
function telecharger(blob, nom){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }

function toast(txt, ms = 2200){
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = txt; t.classList.add('vu'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('vu'), ms);
}

/* URL absolue d'une page du site, pour partager un lien ou un QR code. */
function urlSite(chemin){ const base = location.href.replace(/[^/]*([?#].*)?$/, ''); return new URL(chemin, base).href; }

/* ---------- Connexion organisateur ----------
   exigerConnexion(titre, onOk) : si une session existe, onOk() tout de suite ;
   sinon affiche un petit formulaire, puis onOk() après connexion. */
async function exigerConnexion(titre, onOk){
  if (!CONFIGURE) { document.body.insertAdjacentHTML('afterbegin', '<p class="centre doux italique" style="padding:30px">Le site n\'est pas encore relié à sa base de données (assets/commun.js).</p>'); return; }
  const { data } = await sb.auth.getSession();
  if (data.session) return onOk(data.session);
  const bloc = document.createElement('section');
  bloc.className = 'connexion carte-papier cadre';
  bloc.innerHTML = `
    <div class="monogramme" style="font-size:2.6rem">M<span class="et">&amp;</span>O</div>
    <div class="filet-or"><span>✦</span></div>
    <h1>${echap(titre)}</h1>
    <p class="capitales doux" style="margin:8px 0 0">Accès réservé</p>
    <form>
      <label class="champ" for="cx-email">E-mail</label><input id="cx-email" type="email" autocomplete="username" required>
      <label class="champ" for="cx-mdp">Mot de passe</label><input id="cx-mdp" type="password" autocomplete="current-password" required>
      <p class="centre" style="margin-top:24px"><button class="btn" type="submit">Entrer</button></p>
      <p class="err" aria-live="polite"></p>
    </form>`;
  document.body.prepend(bloc);
  bloc.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = bloc.querySelector('.err'); err.textContent = '';
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#cx-email').value.trim(), password: $('#cx-mdp').value });
    if (error) { err.textContent = 'Connexion refusée : vérifiez l\'e-mail et le mot de passe.'; return; }
    bloc.remove(); onOk(data.session);
  });
}
async function deconnecter(){ await sb.auth.signOut(); location.reload(); }

/* ---------- Ornements « toile de Jouy » en trait bleu ---------- */
const ORNEMENTS = {
  branche: `<svg viewBox="0 0 120 120" class="orne" aria-hidden="true">
    <path d="M10 112 C 34 86, 54 64, 64 34 S 84 8, 108 6"/>
    <path d="M30 92 q-16 -4 -20 -20 q16 2 20 20z"/><path d="M30 92 q4 -16 20 -20 q-2 16 -20 20z"/>
    <path d="M48 70 q-18 -2 -24 -18 q18 0 24 18z"/><path d="M48 70 q6 -16 22 -18 q-4 16 -22 18z"/>
    <path d="M62 44 q-16 -6 -18 -22 q16 4 18 22z"/><path d="M62 44 q8 -14 24 -14 q-6 14 -24 14z"/>
    <path d="M80 20 q-6 -12 0 -18 q8 8 0 18z"/><path d="M80 20 q12 -2 18 6 q-10 4 -18 -6z"/>
    <circle class="plein" cx="108" cy="6" r="2.2"/></svg>`,
  colibri: `<svg viewBox="0 0 120 80" class="orne" aria-hidden="true">
    <path d="M6 40 L 34 37"/>
    <path d="M34 37 c4 -6 12 -8 18 -4 c10 2 22 6 32 14 c8 6 18 10 30 12 c-12 4 -24 2 -34 -2 c-10 6 -24 8 -34 2 c-8 -4 -14 -12 -12 -22z"/>
    <circle class="plein" cx="42" cy="36" r="1.6"/>
    <path d="M56 36 c4 -14 14 -26 30 -32 c-4 10 -8 18 -16 26"/><path d="M62 38 c8 -10 22 -18 40 -18 c-8 8 -18 14 -30 18"/>
    <path d="M60 50 c4 4 10 6 16 6"/></svg>`,
  papillon: `<svg viewBox="0 0 60 50" class="orne" aria-hidden="true">
    <path d="M30 14 v26"/><path d="M30 14 l-5 -9 M30 14 l5 -9"/>
    <path d="M30 20 c-6 -14 -24 -18 -26 -8 c-2 8 10 14 26 12z"/><path d="M30 20 c6 -14 24 -18 26 -8 c2 8 -10 14 -26 12z"/>
    <path d="M30 26 c-10 2 -18 10 -14 16 c4 4 12 -4 14 -12z"/><path d="M30 26 c10 2 18 10 14 16 c-4 4 -12 -4 -14 -12z"/></svg>`,
  mimosa: `<svg viewBox="0 0 100 100" class="orne" aria-hidden="true">
    <path d="M8 96 C 30 70, 50 50, 92 10"/><path d="M40 62 c-6 -10 -16 -14 -26 -12"/><path d="M62 40 c0 -12 -6 -22 -16 -26"/>
    <g class="plein"><circle cx="14" cy="50" r="3"/><circle cx="20" cy="46" r="2.5"/><circle cx="26" cy="51" r="2.6"/><circle cx="46" cy="14" r="3"/><circle cx="52" cy="20" r="2.4"/>
    <circle cx="44" cy="22" r="2.4"/><circle cx="92" cy="10" r="3"/><circle cx="86" cy="18" r="2.6"/><circle cx="78" cy="22" r="2.2"/><circle cx="70" cy="34" r="2.4"/></g></svg>`,
  fleur: `<svg viewBox="0 0 60 60" class="orne" aria-hidden="true">
    <g transform="translate(30 30)">
    <path d="M0 -4 c-8 -10 -6 -22 0 -24 c6 2 8 14 0 24z"/><path d="M0 -4 c-8 -10 -6 -22 0 -24 c6 2 8 14 0 24z" transform="rotate(72)"/>
    <path d="M0 -4 c-8 -10 -6 -22 0 -24 c6 2 8 14 0 24z" transform="rotate(144)"/><path d="M0 -4 c-8 -10 -6 -22 0 -24 c6 2 8 14 0 24z" transform="rotate(216)"/>
    <path d="M0 -4 c-8 -10 -6 -22 0 -24 c6 2 8 14 0 24z" transform="rotate(288)"/><circle r="4" class="or"/></g></svg>`
};
/* Les dessins riches (assets/ornements.js, style gravure) remplacent les esquisses ci-dessus quand ils sont chargés. */
const ALIAS_ORNEMENTS = { branche: 'brancheFleurie', mimosa: 'mimosa', colibri: 'colibri', papillon: 'papillon', fleur: 'fleur' };
function ornement(nom, cls = '', style = ''){
  const riches = window.ORNEMENTS_RICHES || {};
  const src = riches[nom] || riches[ALIAS_ORNEMENTS[nom]] || ORNEMENTS[nom] || ORNEMENTS[Object.keys(ALIAS_ORNEMENTS).find(k => ALIAS_ORNEMENTS[k] === nom)] || '';
  return src.replace(/^<svg /, `<svg class="orne ${cls}" style="${style}" `).replace(/ class="orne"(?=[ >])/, '');
}

/* En-tête commun des pages invités : <header class="entete-site" data-titre="…" data-sous="…"> */
function enteteSite(el){
  el.classList.add('carte-papier', 'cadre');
  el.innerHTML = `${ornement('brancheFleurie', 'orn a')}${ornement('mimosa', 'orn b')}${ornement('colibri', 'orn c')}${ornement('papillon', 'orn d')}
    <p class="capitales">Notre mariage</p>
    <div class="monogramme">M<span class="et">&amp;</span>O</div>
    <p class="capitales" style="letter-spacing:.3em">05.12.2026</p>
    <div class="filet-or"><span>✦</span></div>
    <h1>${echap(el.dataset.titre || '')}</h1>
    ${el.dataset.sous ? `<p class="sous">${el.dataset.sous}</p>` : ''}`;
}
document.addEventListener('DOMContentLoaded', () => $$('header.entete-site').forEach(enteteSite));

function piedBleu(texte){
  return `${ornement('brancheFleurie', 'orn a')}${ornement('oiseauPerche', 'orn b')}
    <div class="monogramme">M<span class="et">&amp;</span>O</div>
    <p class="capitales">Samedi 5 décembre 2026 · Ouvrouer-les-Champs</p>
    ${texte ? `<p>${echap(texte)}</p>` : ''}`;
}

/* QR code (bibliothèque qrcodejs chargée par la page) */
function qrDans(el, texte, taille = 160){
  el.innerHTML = '';
  if (!window.QRCode) { el.textContent = texte; return; }
  new QRCode(el, { text: texte, width: taille, height: taille, colorDark: '#1b2652', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
}
