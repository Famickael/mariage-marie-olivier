/* ============================================================
   Ouverture du faire-part : plein écran, à chaque arrivée sur une page.
   Séquence cinématographique en quatre plans, pilotée par des classes
   (chaque classe déclenche des animations CSS, voir charte.css) :
     1. approche  (0 → 1,6 s)   la caméra s'approche du faire-part fermé
     2. tire / denoue / glisse (1,6 → 4,3 s)  le ruban se dénoue brin par brin et tombe (en fondu)
     3. ouvert    (4,3 → 6,4 s)  les volets s'ouvrent en 3D, la caméra avance ; le site est déjà là,
                                 derrière, et apparaît en fondu (body.fp-ouvre) tandis qu'il est découvert
     4. sortie    (6,4 → 8,2 s)  les volets continuent au-delà de 180°, sortent du cadre et s'effacent,
                                 la caméra traverse, le voile se retire ; fin à 8,2 s (+ 0,5 s de fondu)
   Les étapes se chevauchent légèrement (chaque classe est posée un peu avant la fin de la précédente).
   À charger après commun.js.
   ============================================================ */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const M = n => `<img class="motif" src="${BASE_ASSETS}motifs/${n}.png" alt="" draggable="false">`;
  const ov = document.createElement('div');
  ov.id = 'ouverture'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = `
  <i class="voile vg"></i><i class="voile vd"></i><i class="voile vh"></i><i class="voile vb"></i>
  <i class="halo"></i>
  <div class="fp" id="fp">
    <div class="volet g">
      <div class="face recto">
        <span class="m m1">${M('fp-hg')}</span><span class="m m2">${M('fp-bg')}</span>
        <div class="cartouche"><p class="capitales">Notre Mariage</p><div class="monogramme">M<span class="et">&amp;</span>O</div><p class="capitales date">05.12.2026</p></div>
      </div>
      <div class="face dos"></div>
    </div>
    <div class="volet d">
      <div class="face recto">
        <span class="m m1">${M('fp-hd')}</span><span class="m m2">${M('fp-bd')}</span>
      </div>
      <div class="face dos"></div>
    </div>
    <div class="ruban"><i class="bord g"></i><i class="bord d"></i></div>
    <div class="noeud">
      <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- gros-grain : fines côtes perpendiculaires au sens du ruban -->
          <pattern id="gg-pa" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(76)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-pb" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(108)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-ba" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-bb" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(54)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <!-- modelé : dégradés posés sur les MÊMES tracés que la matière (aucun décalage possible) -->
          <linearGradient id="om-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".55" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".3"/></linearGradient>
          <linearGradient id="om-d" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".55" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".3"/></linearGradient>
          <linearGradient id="om-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#0f1838" stop-opacity=".12"/></linearGradient>
          <linearGradient id="om-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1838" stop-opacity=".06"/><stop offset="1" stop-color="#0f1838" stop-opacity=".34"/></linearGradient>
          <radialGradient id="om-c" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#0f1838" stop-opacity="0"/><stop offset="1" stop-color="#0f1838" stop-opacity=".4"/></radialGradient>
        </defs>
        <!-- Toutes les jonctions sont SOUS le ventre (ellipse x 191-279, y 70-166, dessinée en dernier) :
             le haut des pans (y 116, sur l'axe du ruban) et les racines des boucles (x 235, au cœur du ventre).
             Les pans sont tirés / allongés depuis ce point d'ancrage ; les boucles se replient vers lui. -->
        <g class="pan b"><g class="osc">
          <path d="M218 116 L258 116 C270 180,290 244,318 312 L300 300 L282 324 C262 254,236 186,218 116 Z" fill="url(#gg-pb)"/>
          <path d="M218 116 L258 116 C270 180,290 244,318 312 L300 300 L282 324 C262 254,236 186,218 116 Z" fill="url(#om-d)"/>
        </g></g>
        <g class="pan a"><g class="osc">
          <path d="M212 116 L252 116 C250 190,232 258,176 338 L158 318 L128 330 C180 254,206 190,212 116 Z" fill="url(#gg-pa)"/>
          <path d="M212 116 L252 116 C250 190,232 258,176 338 L158 318 L128 330 C180 254,206 190,212 116 Z" fill="url(#om-g)"/>
        </g></g>
        <!-- boucle gauche (petite) : deux brins, haut et bas, qui se recouvrent à la pointe et à la racine -->
        <g class="boucle a"><g class="resp">
          <g class="brin bas"><path d="M34 56 C8 98,100 150,235 152 L235 124 C130 122,70 108,54 78 Z" fill="url(#gg-ba)"/><path d="M34 56 C8 98,100 150,235 152 L235 124 C130 122,70 108,54 78 Z" fill="url(#om-b)"/></g>
          <g class="brin haut"><path d="M235 84 C170 40,80 28,30 60 L50 82 C90 56,160 72,235 112 Z" fill="url(#gg-ba)"/><path d="M235 84 C170 40,80 28,30 60 L50 82 C90 56,160 72,235 112 Z" fill="url(#om-h)"/></g>
        </g></g>
        <!-- boucle droite (grande, relevée) -->
        <g class="boucle b"><g class="resp">
          <g class="brin bas"><path d="M428 32 C456 94,372 142,235 152 L235 124 C340 118,394 94,398 64 Z" fill="url(#gg-bb)"/><path d="M428 32 C456 94,372 142,235 152 L235 124 C340 118,394 94,398 64 Z" fill="url(#om-b)"/></g>
          <g class="brin haut"><path d="M235 84 C300 22,382 2,424 40 L404 70 C374 36,310 56,235 112 Z" fill="url(#gg-bb)"/><path d="M235 84 C300 22,382 2,424 40 L404 70 C374 36,310 56,235 112 Z" fill="url(#om-h)"/></g>
        </g></g>
        <!-- le ventre : recouvre toutes les jonctions -->
        <g class="centre">
          <path d="M235 70 C264 70,280 90,280 118 C280 146,264 166,235 166 C206 166,190 146,190 118 C190 90,206 70,235 70 Z" fill="#141d4a"/>
          <path d="M235 70 C264 70,280 90,280 118 C280 146,264 166,235 166 C206 166,190 146,190 118 C190 90,206 70,235 70 Z" fill="url(#om-c)"/>
          <path d="M212 92 C226 84,246 84,260 94 M210 146 C226 154,246 154,262 144" fill="none" stroke="#33438a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        </g>
      </svg>
    </div>
  </div>
  <p class="indice">Cliquez sur le faire-part pour l'ouvrir</p>
  <button class="passer" type="button">Passer</button>`;
  document.body.prepend(ov);
  document.body.classList.add('fp-en-cours');
  const fp = ov.querySelector('#fp');
  const t = [];
  let fini = false;
  // Plan 3 : les volets s'ouvrent ; le site devient visible derrière (caché par le voile et les volets)
  const ouvre = () => { fp.classList.add('ouvert'); ov.classList.add('ouvre'); document.body.classList.add('fp-ouvre'); };
  const fin = () => {
    if (fini) return; fini = true;
    t.forEach(clearTimeout);
    // « Passer » avant l'ouverture : la page apparaît vite (fp-vite raccourcit son fondu)
    if (!document.body.classList.contains('fp-ouvre')) document.body.classList.add('fp-ouvre', 'fp-vite');
    ov.classList.add('sortie', 'fin');
    document.body.classList.remove('fp-en-cours');
    setTimeout(() => ov.remove(), 500);
    setTimeout(() => document.body.classList.remove('fp-ouvre', 'fp-vite'), 1700);   // libère les will-change
  };
  // Plan 1 : approche
  requestAnimationFrame(() => { fp.classList.add('approche'); ov.classList.add('approche'); });   // .halo suit la caméra
  // Plans 2 à 4, décalés par rapport au début du dénouage
  const suite = [[() => fp.classList.add('tire'), 0], [() => fp.classList.add('denoue'), 520], [() => fp.classList.add('glisse'), 2150],
                 [ouvre, 2700], [() => ov.classList.add('sortie'), 4800], [fin, 6600]];
  let lance = false;
  const lancer = () => { if (lance || fini) return; lance = true; ov.classList.remove('attente'); suite.forEach(([f, d]) => t.push(setTimeout(f, d))); };
  if (document.body.dataset.ouverture === 'clic') {
    // page principale : le faire-part attend qu'on clique dessus
    t.push(setTimeout(() => ov.classList.add('attente'), 1500));
    fp.addEventListener('click', lancer); ov.querySelector('.indice').addEventListener('click', lancer);
    document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') lancer(); }, { once: true });
  } else t.push(setTimeout(lancer, 1600));
  // « Passer » : on saute directement au site (les blocs se posent, l'overlay s'efface)
  ov.querySelector('.passer').onclick = fin;
})();
