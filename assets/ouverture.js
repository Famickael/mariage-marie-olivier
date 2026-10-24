/* ============================================================
   Ouverture du faire-part : plein écran, à chaque arrivée sur une page.
   Séquence pilotée par des classes (animations CSS, voir charte.css) :
     1. approche  le faire-part apparaît en fondu et s'approche
     2. tire / denoue / glisse  on tire un pan, le nœud se desserre, les boucles retombent,
                  puis le ruban glisse et tombe en s'effaçant lentement
     3. ouvert    les volets s'ouvrent et s'éloignent en un seul mouvement continu ; le site
                  apparaît en fondu derrière eux
     4. fin       le voile s'efface
   Le ruban et le nœud vivent dans un calque à part (.fp.liens) superposé au faire-part et animé
   par la même caméra : aucun volet ne peut passer devant eux.
   À charger après commun.js.
   ============================================================ */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const M = n => `<img class="motif" src="${BASE_ASSETS}motifs/${n}.png" alt="" draggable="false">`;
  /* Gros-grain : fines côtes perpendiculaires au sens du ruban (mêmes bleus que le ruban) */
  const GG = (id, a) => `<pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#243271"/></pattern>`;
  /* Boucles et pans à l'épaisseur du ruban ; chaque forme reçoit sa matière puis son modelé (même tracé) */
  const BA = 'M235 92 C200 58,120 30,66 42 C24 52,18 110,40 148 C60 182,140 186,235 146 Z';
  const BB = 'M235 92 C272 52,354 18,406 32 C448 44,452 104,430 146 C410 182,330 186,235 146 Z';
  const PA = 'M203 124 L265 124 C258 200,232 264,202 334 L170 314 L130 338 C160 266,190 198,203 124 Z';
  const PB = 'M207 124 L267 124 C280 196,302 256,340 318 L308 312 L286 340 C262 268,234 198,207 124 Z';
  const CE = 'M235 72 C264 72,276 88,276 119 C276 150,264 166,235 166 C206 166,194 150,194 119 C194 88,206 72,235 72 Z';
  const ov = document.createElement('div');
  ov.id = 'ouverture'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = `
  <i class="voile vg"></i><i class="voile vd"></i><i class="voile vh"></i><i class="voile vb"></i>
  <i class="halo"></i>
  <div class="fp" id="fp">
    <div class="volet g"><div class="pli">
      <div class="face recto">
        <span class="m m1">${M('fp-hg')}</span><span class="m m2">${M('fp-bg')}</span>
        <div class="cartouche"><p class="capitales">Notre Mariage</p><div class="monogramme">M<span class="et">&amp;</span>O</div><p class="capitales date">05.12.2026</p></div>
      </div>
      <div class="face dos"></div>
    </div></div>
    <div class="volet d"><div class="pli">
      <div class="face recto">
        <span class="m m1">${M('fp-hd')}</span><span class="m m2">${M('fp-bd')}</span>
      </div>
      <div class="face dos"></div>
    </div></div>
  </div>
  <div class="fp liens" aria-hidden="true">
    <div class="ruban"><i class="bord g"></i><i class="bord d"></i></div>
    <div class="noeud">
      <div class="part pan b"><svg class="osc" viewBox="-10 0 470 345" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${GG('gg-pa', 76)}${GG('gg-pb', 104)}${GG('gg-ba', -24)}${GG('gg-bb', 24)}${GG('gg-c', 0)}
          <linearGradient id="om-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".34"/></linearGradient>
          <linearGradient id="om-d" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".34"/></linearGradient>
          <linearGradient id="om-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".42"/></linearGradient>
          <radialGradient id="om-c" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".45"/></radialGradient>
        </defs>
        <path d="${PB}" fill="url(#gg-pb)"/><path d="${PB}" fill="url(#om-d)"/></svg></div>
      <div class="part pan a"><svg class="osc" viewBox="-10 0 470 345"><path d="${PA}" fill="url(#gg-pa)"/><path d="${PA}" fill="url(#om-g)"/></svg></div>
      <div class="part boucle a"><svg class="resp" viewBox="-10 0 470 345">
        <path d="${BA}" fill="url(#gg-ba)"/><path d="${BA}" fill="url(#om-l)"/>
        <path d="M232 110 C196 92,126 80,78 96 C112 112,184 124,232 128 Z" fill="#0b1230" fill-opacity=".62"/>
        <path d="M226 94 C190 66,122 44,70 52" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3" stroke-linecap="round"/></svg></div>
      <div class="part boucle b"><svg class="resp" viewBox="-10 0 470 345">
        <path d="${BB}" fill="url(#gg-bb)"/><path d="${BB}" fill="url(#om-l)"/>
        <path d="M238 110 C276 90,348 76,396 92 C360 110,288 124,238 128 Z" fill="#0b1230" fill-opacity=".62"/>
        <path d="M244 94 C284 62,352 38,402 44" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3" stroke-linecap="round"/></svg></div>
      <div class="part centre"><svg viewBox="-10 0 470 345">
        <path d="${CE}" fill="url(#gg-c)"/><path d="${CE}" fill="url(#om-c)"/>
        <path d="M208 90 C224 82,246 82,262 91 M206 150 C224 158,246 158,264 149 M222 100 C218 112,218 128,222 140" fill="none" stroke="#0b1230" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg></div>
    </div>
  </div>
  <i class="rideau"></i>
  <p class="indice">Cliquez sur le faire-part pour l'ouvrir</p>
  <button class="passer" type="button">Passer</button>`;
  document.body.prepend(ov);
  document.body.classList.add('fp-en-cours');
  const fp = ov.querySelector('#fp'), liens = ov.querySelector('.liens');
  const etape = c => { fp.classList.add(c); liens.classList.add(c); };
  const t = [];
  let fini = false;
  const ouvre = () => { etape('ouvert'); ov.classList.add('ouvre'); document.body.classList.add('fp-ouvre'); };
  const fin = () => {
    if (fini) return; fini = true;
    t.forEach(clearTimeout);
    // « Passer » avant l'ouverture : la page apparaît plus vite (fp-vite raccourcit son fondu)
    if (!document.body.classList.contains('fp-ouvre')) document.body.classList.add('fp-ouvre', 'fp-vite');
    ov.classList.add('sortie', 'fin');
    document.body.classList.remove('fp-en-cours');
    setTimeout(() => ov.remove(), 1500);
    setTimeout(() => document.body.classList.remove('fp-ouvre', 'fp-vite'), 3200);   // libère les will-change
  };
  // Plan 1 : approche (posée tout de suite : l'animation part de son image 0, invisible)
  etape('approche'); ov.classList.add('approche');
  // Plans 2 à 4, à partir du moment où l'on tire le ruban
  const suite = [[() => etape('tire'), 0], [() => etape('denoue'), 900], [() => etape('glisse'), 2300],
                 [ouvre, 3700], [() => liens.remove(), 4700], [() => ov.classList.add('sortie'), 6200], [fin, 7500]];   // le ruban, entièrement effacé, est retiré (il ne coûte plus rien)
  let lance = false;
  const lancer = () => { if (lance || fini) return; lance = true; ov.classList.remove('attente'); suite.forEach(([f, d]) => t.push(setTimeout(f, d))); };
  if (document.body.dataset.ouverture === 'clic') {
    // page principale : le faire-part attend qu'on clique dessus
    t.push(setTimeout(() => ov.classList.add('attente'), 2000));
    fp.addEventListener('click', lancer); ov.querySelector('.indice').addEventListener('click', lancer);
    document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') lancer(); }, { once: true });
  } else t.push(setTimeout(lancer, 2000));
  ov.querySelector('.passer').onclick = fin;
})();
