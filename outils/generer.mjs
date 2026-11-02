// Générateur des pages de contenu de moovini.app (23 octobre 2026) : blog, pages « Pour qui », questions fréquentes,
// fiches exercices et plan du site. Sans dépendance : node outils/generer.mjs, depuis la racine du site.
//
// Sources, dans contenu/ :
// - seances.json : séances de « La séance de la semaine », composées par le moteur de l'app (même export que les exercices) ;
// - blog/<slug>.md et pour-qui/<slug>.md : en-tête (titre, description, date, mots-cles) puis texte en Markdown simple ;
// - questions-frequentes.md : chaque « ## » est une question, le texte qui suit sa réponse ;
// - application.html : la page « L'app » (24 octobre 2026), en HTML parce qu'elle alterne textes et captures ; même en-tête que
//   les .md, et <?exercices slug,slug?> y devient une rangée de fiches exercices ;
// - exercices.json : export du catalogue de l'app (node scripts/export-site.mjs, dans le dépôt de l'app) ;
// - exercices-retenus.json : les seuls exercices qui ont leur fiche sur le site (25 octobre 2026), dans l'ordre du
//   catalogue. Les fiches et images d'un exercice retiré sont effacées, et un lien vers sa fiche devient du texte.
// Les vignettes retenues des exercices sont réduites dans images/fiches/ par outils/vignettes.py (Pillow).
// L'accueil (index.html) et les pages légales ne sont pas générés ; seul le plan du site les liste.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://moovini.app';
const APP = 'C:/Projets/Moovini';
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
// Empreinte de la feuille de style dans son adresse : un navigateur qui a gardé l'ancienne en cache charge la nouvelle.
const VERSION_CSS = createHash('sha256').update(readFileSync(join(RACINE, 'assets/site.css'))).digest('hex').slice(0, 8);
const FAMILLES = { mobilite: 'Mobilité', cardio: 'Cardio doux', force: 'Renforcement', calme: 'Calme' };
// « Simple » plutôt que « Tout doux », le nom de la durée de 10 min dans l'app (24 octobre 2026).
const NIVEAUX = { 1: 'Simple', 2: 'Modéré', 3: 'Plus soutenu' };
const BOUTIQUES = `<div class="boutiques" role="group" aria-label="Être prévenu de la sortie">
      <a class="bientot apple" href="mailto:contact@moovini.app?subject=Pr%C3%A9venez-moi%20%C3%A0%20la%20sortie%20de%20Moovini&amp;body=Bonjour%2C%20j%E2%80%99aimerais%20%C3%AAtre%20pr%C3%A9venu(e)%20quand%20Moovini%20sortira%20sur%20l%E2%80%99App%20Store." title="Être prévenu de la sortie sur l’App Store"><svg viewBox="0 0 14 17" aria-hidden="true"><path fill="currentColor" d="M11.6 9c0-2 1.7-3 1.8-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.8-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7s1.8-1 2.5-2c.8-1.2 1.1-2.3 1.1-2.4 0 0-2.1-.8-2.1-3.3zM9.6 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/></svg><span><small>Bientôt sur l’</small><strong>App Store</strong></span></a>
      <a class="bientot google" href="mailto:contact@moovini.app?subject=Sortie%20Android%20de%20Moovini&amp;body=Bonjour%2C%20pr%C3%A9venez-moi%20quand%20Moovini%20sera%20disponible%20sur%20Google%20Play." title="Être prévenu de la sortie sur Google Play"><svg viewBox="0 0 24 26" aria-hidden="true"><path fill="#48C6E5" d="M1 1.5v23L13 13z"/><path fill="#65D58B" d="m1 1.5 15 8.6-3 2.9z"/><path fill="#FFD46A" d="m16 10.1 5 2.9-5 2.9-3-2.9z"/><path fill="#FA7B80" d="m1 24.5 12-11.5 3 2.9z"/></svg><span><small>Bientôt sur</small><strong>Google Play</strong></span></a>
    </div>`;

const ecrire = (chemin, contenu) => { const f = join(RACINE, chemin); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, contenu); };
const echapper = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texteBrut = html => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
// Titre pour Google (coupé vers 60 caractères) : la première forme qui tient. Pas de « | Moovini » ni d'autre séparateur
// (demande du 24 octobre 2026) ; Google affiche déjà le nom du site.
const titrePour = (...formes) => formes.find(f => f.length <= 62) ?? formes[formes.length - 1];
// Liste écrite en français : « Sur une chaise, debout ou au sol » (jamais de point médian entre les éléments).
const listeFr = l => l.length < 2 ? (l[0] ?? '') : `${l.slice(0, -1).join(', ')} ou ${l[l.length - 1].toLowerCase()}`;
const dateFr = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Markdown simple : intertitres, paragraphes, listes, citations, gras, italique, liens ----------
function enLigne(t) {
  return echapper(t)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => ficheRetiree(url) ? txt : `<a href="${url.replace(/&amp;/g, '&amp;')}"${/^https?:/.test(url) && !url.startsWith(SITE) ? ' rel="noopener"' : ''}>${txt}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(«])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(«])_([^_\s][^_]*)_/g, '$1<em>$2</em>');
}
function markdown(md) {
  const blocs = md.replace(/\r/g, '').trim().split(/\n{2,}/);
  return blocs.map(b => {
    const l = b.split('\n');
    if (/^#{2,4} /.test(b)) { const n = b.match(/^#+/)[0].length; const t = b.replace(/^#+ /, ''); return `<h${n} id="${ancre(t)}">${enLigne(t)}</h${n}>`; }
    if (l.every(x => /^\s*[-*] /.test(x))) return `<ul>${l.map(x => `<li>${enLigne(x.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
    if (l.every(x => /^\s*\d+[.)] /.test(x))) return `<ol>${l.map(x => `<li>${enLigne(x.replace(/^\s*\d+[.)] /, ''))}</li>`).join('')}</ol>`;
    if (l.every(x => /^> ?/.test(x))) return `<blockquote><p>${enLigne(l.map(x => x.replace(/^> ?/, '')).join(' '))}</p></blockquote>`;
    return `<p>${enLigne(l.join(' '))}</p>`;
  }).join('\n');
}
const ancre = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function lireMd(fichier) {
  const brut = readFileSync(fichier, 'utf8').replace(/^\uFEFF/, '');
  const m = brut.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`En-tête manquant : ${fichier}`);
  const meta = Object.fromEntries(m[1].split(/\r?\n/).filter(Boolean).map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  return { ...meta, corps: m[2] };
}

// Image de couverture d'un article ou d'une page « Pour qui » (champs « image » et « image-alt » de l'en-tête) :
// en haut de la page, en aperçu de partage et en vignette dans les cartes. Photos 16:9 de 1600 px dans images/blog/
// et images/pour-qui/, avec à côté une réduction de 640 px (suffixe -640) pour les cartes.
const couverture = x => x.image ? `<figure class="couverture"><img src="${x.image}" alt="${echapper(x['image-alt'] ?? '')}" width="1280" height="720" fetchpriority="high" decoding="async"></figure>` : '';
const vignette = x => x.image ? `<img src="${x.image.replace(/\.webp$/, '-640.webp')}" alt="" width="640" height="360" loading="lazy" decoding="async">` : '';
const imageDePartage = x => x.image ? `${SITE}${x.image}` : undefined;

// Les exercices bougent à l'écran (demande du 2 novembre 2026). La page reste écrite avec des images fixes : le script les
// anime quand elles approchent, joue seulement ce qui se voit, et ne fait rien si le visiteur demande moins d'animations ou
// économise ses données. Une image data-cadre (le lecteur de l'app) garde son décor : le clip se pose dessus, en fondu.
const SCRIPT_CLIPS = `<script>
  (() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
    const lecture = new IntersectionObserver(l => l.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()), { threshold: .25 });
    const animer = img => {
      const v = document.createElement('video');
      v.muted = v.defaultMuted = v.loop = v.playsInline = true;
      v.preload = 'auto';
      v.src = img.dataset.clip;
      if (img.dataset.cadre) {
        const [gauche, haut, largeur, hauteur, fondu] = img.dataset.cadre.split(' ');
        v.style.cssText = \`left:\${gauche};top:\${haut};width:\${largeur};height:\${hauteur};--fondu:\${fondu}\`;
        v.setAttribute('aria-hidden', 'true');
        v.addEventListener('playing', () => v.classList.add('joue'), { once: true });
        img.after(v);
      } else {
        // L'image devient l'affiche du clip, dont la première image est la même. Dans la page tout de suite : Safari sur
        // iPhone ne lance pas une vidéo hors de la page. S'il refuse de la jouer (mode économie d'énergie), l'affiche reste.
        v.className = img.className;
        v.width = img.getAttribute('width'); v.height = img.getAttribute('height');
        v.poster = img.getAttribute('src');
        v.setAttribute('aria-label', img.alt);
        img.replaceWith(v);
      }
      lecture.observe(v);
    };
    const approche = new IntersectionObserver(l => l.forEach(e => { if (e.isIntersecting) { approche.unobserve(e.target); animer(e.target); } }), { rootMargin: '200px' });
    document.querySelectorAll('img[data-clip]').forEach(img => approche.observe(img));
  })();
</script>
`;

// ---------- Gabarit commun ----------
function page({ chemin, titre, titreSeo, description, image = `${SITE}/images/partage.jpg`, imageAlt = 'Moovini, l\u2019app de mouvement doux', jsonld = [], corps, type = 'website' }) {
  const url = `${SITE}${chemin}`;
  const graphe = { '@context': 'https://schema.org', '@graph': [...jsonld] };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(titreSeo ?? titre)}</title>
<meta name="description" content="${echapper(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Moovini">
<meta property="og:locale" content="fr_FR">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${echapper(titre)}">
<meta property="og:description" content="${echapper(description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${echapper(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14292E">
<!-- Icônes carrées, multiples de 48 px : Google n'affiche pas d'icône rectangulaire dans ses résultats. -->
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/images/favicon-192.png" type="image/png" sizes="192x192">
<link rel="icon" href="/images/symbole.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=${VERSION_CSS}">
${jsonld.length ? `<script type="application/ld+json">\n${JSON.stringify(graphe, null, 1)}\n</script>\n` : ''}</head>
<body>
<header class="barre">
  <a class="marque" href="/"><img src="/images/logo-creme.svg" alt="Moovini, accueil" width="104" height="100"></a>
  <nav aria-label="Navigation principale">
    <a href="/application/"${chemin === '/application/' ? ' aria-current="page"' : ''}>L'app</a>
    <a href="/seance-de-la-semaine/"${chemin === '/seance-de-la-semaine/' ? ' aria-current="page"' : ''}>La séance<span class="long"> de la semaine</span></a>
    <a href="/blog/"${chemin.startsWith('/blog/') ? ' aria-current="page"' : ''}>Blog</a>
    <a href="/questions-frequentes/"${chemin.startsWith('/questions') ? ' aria-current="page"' : ''}>Questions</a>
    <a class="appli" href="#boutiques">Bientôt sur iOS et Android</a>
  </nav>
</header>
<main id="contenu">
${corps.replaceAll('<?boutiques?>', BOUTIQUES)}
</main>
<footer class="pied">
  <section class="appel" id="boutiques" aria-labelledby="appel-titre">
    <h2 id="appel-titre">Recommence à bouger, <em>en douceur.</em></h2>
    <p>Moovini, c'est le mouvement doux pour les sédentaires et les débutants : des séances composées d'après tes réponses, de 10 à 30 minutes, sur une chaise ou debout, chez toi ou au bureau. Aucune inscription requise et 7 jours d'essai gratuit.</p>
    ${BOUTIQUES}
  </section>
  <nav class="liens" aria-label="Pied de page">
    <a href="/">Accueil</a><a href="/application/">L'app en détail</a><a href="/seance-de-la-semaine/">La séance de la semaine</a><a href="/blog/">Blog</a><a href="/exercices/">Exercices</a><a href="/pour-qui/teletravail/">Télétravail</a>
    <a href="/pour-qui/reprendre-le-sport-apres-40-ans/">Après 40 ans</a><a href="/pour-qui/debutant-sedentaire/">Débutants</a>
    <a href="/questions-frequentes/">Questions fréquentes</a><a href="/privacy/">Confidentialité</a><a href="/cgu/">Conditions d'utilisation</a><a href="/assistance/">Assistance</a>
    <a href="mailto:contact@moovini.app">contact@moovini.app</a>
  </nav>
  <p class="mention">Moovini propose des exercices doux pour le bien-être et ne remplace pas l'avis d'un médecin ou d'un(e) kiné. © 2026 Moovini</p>
</footer>
<button class="haut-page" type="button" aria-label="Revenir en haut de la page" title="Revenir en haut"><svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M10 16V4M4.5 9.5 10 4l5.5 5.5"/></svg></button>
<script>
  // Ombre sous la barre dès qu'on défile, bouton de retour en haut après un écran.
  const barre = document.querySelector('.barre'), haut = document.querySelector('.haut-page');
  const suivre = () => { barre.classList.toggle('decollee', scrollY > 4); haut.classList.toggle('visible', scrollY > innerHeight * .8); };
  addEventListener('scroll', suivre, { passive: true }); suivre();
  haut.addEventListener('click', () => { scrollTo({ top: 0 }); barre.querySelector('.marque').focus({ preventScroll: true }); });
</script>
${corps.includes('data-clip') ? SCRIPT_CLIPS : ''}</body>
</html>
`;
}
const ORGANISATION = { '@id': `${SITE}/#organisation` };
const filAriane = elements => ({ '@type': 'BreadcrumbList', itemListElement: elements.map(([nom, chemin], i) => ({ '@type': 'ListItem', position: i + 1, name: nom, item: `${SITE}${chemin}` })) });
const arianeHtml = elements => `<nav class="ariane" aria-label="Fil d'Ariane"><ol>${elements.map(([nom, chemin], i) => i === elements.length - 1 ? `<li aria-current="page">${echapper(nom)}</li>` : `<li><a href="${chemin}">${echapper(nom)}</a></li>`).join('')}</ol></nav>`;

const plan = [['/', '2026-10-23'], ['/privacy/', '2026-10-23'], ['/cgu/', '2026-10-23'], ['/assistance/', '2026-10-26']];

// ---------- Exercices ----------
const catalogue = JSON.parse(readFileSync(join(RACINE, 'contenu', 'exercices.json'), 'utf8'));
const retenus = JSON.parse(readFileSync(join(RACINE, 'contenu', 'exercices-retenus.json'), 'utf8'));
for (const s of retenus) if (!catalogue.some(e => e.slug === s)) throw new Error(`Exercice inconnu dans exercices-retenus.json : ${s}`);
const exercices = catalogue.filter(e => retenus.includes(e.slug));
const ficheRetiree = url => { const m = url.match(/^\/exercices\/([a-z0-9-]+)\/$/); return !!m && !retenus.includes(m[1]); };
for (const d of readdirSync(join(RACINE, 'exercices'), { withFileTypes: true }))
  if (d.isDirectory() && !retenus.includes(d.name)) rmSync(join(RACINE, 'exercices', d.name), { recursive: true });
const vignettes = [], clipsFiches = [];
// Image de la fiche : tirée de la vidéo retenue (nette), sinon la vignette retenue (180 px), sinon aucune.
for (const e of exercices) for (const v of e.variants) {
  const source = v.videoSrc ?? v.thumbnail;
  if (!source) continue;
  v.image = `/images/fiches/${source.split('/').pop().replace(/\.\w+$/, '')}.webp`;
  // Au sol, la personne est allongée : image en 3:2 au lieu d'un carré.
  v.ratio = v.position === 'sol' && v.videoSrc ? 1.5 : 1;
  vignettes.push([join(APP, source), join(RACINE, v.image.slice(1)), v.ratio]);
  // Même cadre que l'image, qui bouge une fois à l'écran (demande du 2 novembre 2026) ; voir SCRIPT_CLIPS.
  if (v.videoSrc) {
    v.clip = v.image.replace('/images/fiches/', '/images/clips/').replace(/\.webp$/, '.mp4');
    clipsFiches.push([join(APP, v.videoSrc), join(RACINE, v.clip.slice(1)), v.ratio, 480]);
  }
}
const manquantes = vignettes.filter(([, dest]) => !existsSync(dest));
const gardees = new Set(vignettes.map(([, dest]) => basename(dest)));
for (const f of readdirSync(join(RACINE, 'images', 'fiches'))) if (!gardees.has(f)) rmSync(join(RACINE, 'images', 'fiches', f));
if (manquantes.length) {
  writeFileSync(join(RACINE, 'outils', '.vignettes.json'), JSON.stringify(manquantes));
  execFileSync('python', [join(RACINE, 'outils', 'vignettes.py'), join(RACINE, 'outils', '.vignettes.json')], { stdio: 'inherit' });
}
// Fabrique les clips qui manquent dans un dossier et efface ceux qui ne servent plus.
function preparerClips(dossier, liste) {
  mkdirSync(join(RACINE, dossier), { recursive: true });
  const gardes = new Set(liste.map(([, dest]) => basename(dest)));
  for (const f of readdirSync(join(RACINE, dossier))) if (!gardes.has(f)) rmSync(join(RACINE, dossier, f));
  const absents = liste.filter(([, dest]) => !existsSync(dest));
  if (!absents.length) return;
  writeFileSync(join(RACINE, 'outils', '.clips.json'), JSON.stringify(absents));
  execFileSync('python', [join(RACINE, 'outils', 'clips.py'), join(RACINE, 'outils', '.clips.json')], { stdio: 'inherit' });
  rmSync(join(RACINE, 'outils', '.clips.json'));
}
preparerClips('images/clips', clipsFiches);
// Vignette d'un exercice (liste, en-tête de fiche, partage) : la variante debout, sinon au sol, sinon sur chaise, pour que
// la liste ne montre pas que des mouvements assis (demande du 25 octobre 2026). Une image au sol, en 3:2, est montrée
// entière dans le carré.
const ORDRE_VIGNETTE = ['debout', 'sol', 'assis'];
const varianteVignette = e => e.variants.filter(v => v.image).sort((a, b) => ORDRE_VIGNETTE.indexOf(a.position) - ORDRE_VIGNETTE.indexOf(b.position))[0];
const imageDe = e => varianteVignette(e)?.image ?? null;
const attributClip = v => v.clip ? ` data-clip="${v.clip}"` : '';
const visuel = (e, taille) => {
  const v = varianteVignette(e);
  return v ? `<img${v.ratio > 1 ? ' class="large"' : ''} src="${v.image}"${attributClip(v)} alt="${echapper(e.name)} : démonstration" width="${taille}" height="${taille}" loading="lazy" decoding="async">`
    : `<span class="sans-photo ${e.family}" aria-hidden="true">${echapper(e.name.slice(0, 1))}</span>`;
};
const positions = e => [...new Set(e.variants.map(v => v.label))];

for (const e of exercices) {
  const chemin = `/exercices/${e.slug}/`;
  const ariane = [['Accueil', '/'], ['Exercices', '/exercices/'], [e.name, chemin]];
  // Peu de fiches par famille : la même famille d'abord, puis les autres.
  const voisins = [...exercices.filter(x => x.family === e.family), ...exercices.filter(x => x.family !== e.family)].filter(x => x.slug !== e.slug).slice(0, 4);
  const sections = e.variants.map(v => `
<section class="variante">
  <h2>${echapper(v.name ?? e.name)} ${v.label === 'Debout' ? 'debout' : v.label === 'Au sol' ? 'au sol' : 'sur une chaise'}</h2>
  <div class="variante-corps">
    ${v.image ? `<img class="photo${v.ratio > 1 ? ' large' : ''}" src="${v.image}"${attributClip(v)} alt="${echapper(e.name)} ${v.label.toLowerCase()} : position de démonstration" width="480" height="${Math.round(480 / v.ratio)}" loading="lazy" decoding="async">` : ''}
    <div>
      ${v.pitch ? `<p class="accroche">${echapper(v.pitch)}</p>` : ''}
      ${v.steps.length ? `<h3>Les étapes</h3><ol class="etapes">${v.steps.map(([t, txt]) => `<li><strong>${echapper(t)}</strong><br>${echapper(txt)}</li>`).join('')}</ol>` : ''}
      ${v.tips.length ? `<h3>Les astuces</h3><ul class="astuces">${v.tips.map(t => `<li>${echapper(t)}</li>`).join('')}</ul>` : ''}
      ${v.gear?.length ? `<p class="objets">À prévoir : ${echapper(v.gear.join(', '))}.</p>` : ''}
    </div>
  </div>
</section>`).join('');
  const debut = `${e.name} (${positions(e).join(', ').toLowerCase()}) : ${e.pitch.replace(/\.$/, '')}.`;
  const description = [`${debut} Les étapes, les astuces et une version plus douce dans Moovini.`, `${debut} Les étapes et les astuces, pas à pas.`, `${debut} Pas à pas.`, debut]
    .find(d => d.length <= 158) ?? debut;
  ecrire(`exercices/${e.slug}/index.html`, page({
    chemin, titre: `${e.name} : l'exercice pas à pas`, titreSeo: titrePour(`${e.name} : exercice ${FAMILLES[e.family].toLowerCase()} pas à pas`, `${e.name} : l'exercice pas à pas`, `${e.name}, pas à pas`, e.name),
    description, image: imageDe(e) ? `${SITE}${imageDe(e)}` : undefined, imageAlt: e.name,
    jsonld: [filAriane(ariane), { '@type': 'WebPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: `${e.name} : l'exercice pas à pas`, description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, publisher: ORGANISATION, ...(imageDe(e) ? { primaryImageOfPage: `${SITE}${imageDe(e)}` } : {}) }],
    corps: `${arianeHtml(ariane)}
<article class="fiche">
  <header class="fiche-tete">
    ${visuel(e, 160)}
    <div>
      <h1>${echapper(e.name)}</h1>
      <p class="chapeau">${echapper(e.pitch)}</p>
      <ul class="pastilles">
        <li class="famille ${e.family}">${FAMILLES[e.family]}</li><li>${NIVEAUX[e.level]}</li>${positions(e).map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  </header>
  <dl class="reperes">
    <div><dt>Zones</dt><dd>${echapper(e.zones.join(', '))}</dd></div>
    <div><dt>Dosage</dt><dd>${echapper(e.dosage)}</dd></div>
    ${e.side ? `<div><dt>Côtés</dt><dd>${echapper(e.side)}</dd></div>` : ''}
    ${e.gear.length ? `<div><dt>À prévoir</dt><dd>${echapper(e.gear.join(', '))}</dd></div>` : ''}
  </dl>
  ${sections}
  ${e.caution ? `<p class="precaution"><strong>Précaution.</strong> ${echapper(e.caution)}</p>` : ''}
  <p class="prudence">Va à ton rythme et arrête si ça fait mal. En cas de problème de santé, de blessure ou de grossesse, demande d'abord conseil à ton médecin.</p>
  <aside class="dans-appli"><h2>Dans Moovini</h2><p>Moovini place ${echapper(e.name.toLowerCase())} dans tes séances quand il convient à tes réponses : démonstration en vidéo, voix qui te guide, décompte et version plus douce si besoin.</p></aside>
</article>
${voisins.length ? `<section class="voisins"><h2>D'autres exercices</h2><ul class="grille-fiches">${voisins.map(x => `<li><a href="/exercices/${x.slug}/">${visuel(x, 96)}<span>${echapper(x.name)}</span></a></li>`).join('')}</ul></section>` : ''}`,
  }));
  plan.push([chemin, AUJOURDHUI]);
}
{
  const chemin = '/exercices/';
  const ariane = [['Accueil', '/'], ['Exercices', chemin]];
  const groupes = Object.keys(FAMILLES).map(f => [f, exercices.filter(e => e.family === f)]).filter(([, l]) => l.length);
  ecrire('exercices/index.html', page({
    chemin, titre: `Aperçu du catalogue d'exercices de Moovini : ${exercices.length} mouvements pas à pas`, titreSeo: 'Exercices doux sur chaise, debout ou au sol : un aperçu',
    description: `Un aperçu des exercices doux de Moovini : ${exercices.length} mouvements sur ${catalogue.length}, mobilité, cardio doux, renforcement et respiration, sur une chaise, debout ou au sol.`,
    jsonld: [filAriane(ariane), { '@type': 'CollectionPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: "Aperçu du catalogue d'exercices de Moovini", inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` } }],
    corps: `${arianeHtml(ariane)}
<header class="entete-page"><p class="surtitre">Les exercices de Moovini</p><h1>Un aperçu du catalogue : ${exercices.length} exercices sur les ${catalogue.length} de l'app</h1>
<p class="chapeau">Quelques mouvements doux pour débutants et sédentaires, sur une chaise, debout ou au sol, chacun avec ses étapes et ses astuces. L'app en compte bien d'autres, du plus simple au plus soutenu, et les combine en séances de 10 à 30 minutes d'après tes réponses. <a href="/seance-de-la-semaine/">Regarde la séance de la semaine</a>.</p></header>
${groupes.map(([f, l]) => `<section class="groupe"><h2 id="${f}">${FAMILLES[f]} <span>${l.length} exercice${l.length > 1 ? 's' : ''}</span></h2><ul class="grille-fiches">${l.map(x => `<li><a href="/exercices/${x.slug}/">${visuel(x, 96)}<span>${echapper(x.name)}</span><small>${listeFr(positions(x))}</small></a></li>`).join('')}</ul></section>`).join('\n')}`,
  }));
  plan.push([chemin, AUJOURDHUI]);
}

// ---------- La séance de la semaine (2 novembre 2026) ----------
// contenu/seances.json : séances composées par le moteur de l'app (node scripts/export-site.mjs), une par semaine à partir
// du lundi 2 novembre 2026, puis on reprend au début. Toutes sont écrites dans la page, celle de la semaine de génération
// visible ; un petit script montre celle de la semaine en cours, sans nouvelle publication. Images : le lecteur de l'app
// sur chaque exercice (images/seance/sSS-EE.webp, marketing/site/20261102-seance-semaine/ dans le dépôt de l'app).
// Le geste y bouge : contenu/seance-cadres.json dit où la vidéo est posée sur chaque image (même script de capture) et le
// clip (images/seance/clips/) couvre la largeur de l'écran, de la tête aux pieds, entre la consigne et le minuteur.
{
  const seances = JSON.parse(readFileSync(join(RACINE, 'contenu', 'seances.json'), 'utf8'));
  const cadres = JSON.parse(readFileSync(join(RACINE, 'contenu', 'seance-cadres.json'), 'utf8'));
  // En points d'écran. Marges autour du geste, sans toucher la consigne : elle commence 14 points sous la zone du geste.
  const LARGEUR_ECRAN = 393, HAUTEUR_ECRAN = 1041 * 393 / 480, BARRE_ETAT = 54, MARGE_HAUT = 10, MARGE_BAS = 13, FONDU = 6;
  // Le cadre d'un clip tient à sa vidéo : il vaut pour toutes les images de cette vidéo, même posée un peu autrement.
  const zones = new Map();
  for (const { video, place: [gauche, , largeur, hauteur], box } of Object.values(cadres)) {
    if (!box) continue;
    const z = zones.get(video) ?? { x0: 1, x1: 0, hauteurMin: Infinity, box };
    z.x0 = Math.min(z.x0, -gauche / largeur);
    z.x1 = Math.max(z.x1, (LARGEUR_ECRAN - gauche) / largeur);
    z.hauteurMin = Math.min(z.hauteurMin, hauteur);
    z.largeur = Math.max(z.largeur ?? 0, largeur);
    zones.set(video, z);
  }
  const clipsSeance = [];
  for (const [video, z] of zones) {
    z.y0 = Math.max(0, z.box[2] - MARGE_HAUT / z.hauteurMin);
    z.y1 = Math.min(1, z.box[3] + MARGE_BAS / z.hauteurMin);
    z.clip = `/images/seance/clips/${video}`;
    clipsSeance.push([join(APP, 'assets/videos', video), join(RACINE, z.clip.slice(1)), [z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0], (z.x1 - z.x0) * z.largeur * 480 / LARGEUR_ECRAN]);
  }
  preparerClips('images/seance/clips', clipsSeance);
  const pourcent = x => `${(x * 100).toFixed(2)}%`;
  // Attributs de l'image : le clip, et sa place sur l'image en part de l'écran (gauche, haut, largeur, hauteur, fondu).
  const clipDuLecteur = nom => {
    const c = cadres[nom], z = c && zones.get(c.video);
    if (!z) return '';
    const [gauche, haut, largeur, hauteur] = c.place;
    const cadre = [(gauche + z.x0 * largeur) / LARGEUR_ECRAN, (BARRE_ETAT + haut + z.y0 * hauteur) / HAUTEUR_ECRAN, (z.x1 - z.x0) * largeur / LARGEUR_ECRAN, (z.y1 - z.y0) * hauteur / HAUTEUR_ECRAN, FONDU / ((z.y1 - z.y0) * hauteur)];
    return ` data-clip="${z.clip}" data-cadre="${cadre.map(pourcent).join(' ')}"`;
  };
  const chemin = '/seance-de-la-semaine/';
  const ariane = [['Accueil', '/'], ['La séance de la semaine', chemin]];
  const POSITIONS = { debout: 'Debout', assis: 'Sur une chaise', sol: 'Au sol' };
  const JOUR = 864e5, DEPART = Date.UTC(2026, 10, 2);
  const duree = s => { const m = Math.floor(s / 60), r = s % 60; return m ? (r ? `${m} min ${String(r).padStart(2, '0')}` : `${m} min`) : `${r} s`; };
  const niveau = n => `<li class="niveau"><span class="crans" aria-hidden="true">${[1, 2, 3].map(c => `<i${c <= n ? ' class="plein"' : ''}></i>`).join('')}</span>${NIVEAUX[n]}</li>`;
  // Une version au sol porte parfois le même nom que le mouvement : la position suffit alors à la dire.
  const variante = (v, m) => `${v.nom && v.nom !== m.nom ? `${echapper(v.nom)}, ${POSITIONS[v.position].toLowerCase()}` : POSITIONS[v.position].toLowerCase()} (${NIVEAUX[v.niveau].toLowerCase()})`;
  const carte = (m, i, s, numero) => {
    const image = `/images/seance/s${String(numero).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}.webp`;
    if (!existsSync(join(RACINE, image.slice(1)))) throw new Error(`Image du lecteur manquante : ${image}`);
    const nom = echapper(m.nom);
    return `<li class="mouvement">
  <figure class="lecteur"><img src="${image}"${clipDuLecteur(basename(image, '.webp'))} alt="${nom}, ${POSITIONS[m.position].toLowerCase()} : le lecteur de Moovini pendant l'exercice" width="480" height="1041" loading="lazy" decoding="async"></figure>
  <div>
    <h3><span class="rang">${i + 1}.</span> ${retenus.includes(m.slug) ? `<a href="/exercices/${m.slug}/">${nom}</a>` : nom}</h3>
    <ul class="pastilles"><li class="position ${m.position}">${POSITIONS[m.position]}</li>${niveau(m.niveau)}<li class="famille ${m.famille}">${FAMILLES[m.famille]}</li></ul>
    <p class="mouvement-detail">${duree(m.secondes)}${m.cotes ? ', en changeant de côté' : ''}.${m.objets.length ? ` À prévoir : ${echapper(m.objets.join(', '))}.` : ''}</p>
    ${m.variantes.length ? `<p class="mouvement-variantes"><strong>Variantes :</strong> ${m.variantes.map(v => variante(v, m)).join(' ; ')}.</p>` : ''}
  </div>
</li>`;
  };
  const article = (s, k, visible) => {
    const compte = p => s.mouvements.filter(m => m.position === p).length;
    const objets = [...new Set([...(compte('assis') ? ['une chaise'] : []), ...s.mouvements.flatMap(m => m.objets), ...(compte('sol') ? ['de la place au sol'] : [])])];
    const moyenne = s.mouvements.reduce((a, m) => a + m.niveau, 0) / s.mouvements.length;
    const nv = moyenne < 1.5 ? 1 : moyenne < 2.3 ? 2 : 3;
    return `<article class="seance" data-rang="${k}"${visible ? '' : ' hidden'}>
  <header class="seance-tete">
    <p>${echapper(s.etape)}</p>
    <h2>${echapper(s.titre)}</h2>
    <span class="seance-duree">${s.minutes} min</span>
  </header>
  <dl class="reperes">
    <div><dt>Mouvements</dt><dd>${s.mouvements.length}</dd></div>
    <div><dt>Positions</dt><dd>${Object.keys(POSITIONS).filter(compte).map(p => `${compte(p)} ${POSITIONS[p].toLowerCase()}`).join(', ')}</dd></div>
    <div><dt>À prévoir</dt><dd>${objets.length ? echapper(objets.join(', ').replace(/^./, c => c.toUpperCase())) : 'Rien'}</dd></div>
    <div><dt>Niveau</dt><dd>${NIVEAUX[nv]}</dd></div>
    <div><dt>Zones</dt><dd>${echapper(s.zones)}</dd></div>
  </dl>
  <ol class="mouvements">
${s.mouvements.map((m, i) => carte(m, i, s, k + 1)).join('\n')}
  </ol>
</article>`;
  };
  const rangDeLaSemaine = Math.floor((Date.now() - DEPART) / (7 * JOUR));
  const actuelle = ((rangDeLaSemaine % seances.length) + seances.length) % seances.length;
  const description = 'Une vraie séance de gym douce composée par l’app Moovini, exercice par exercice : position, niveau, variantes et durées. Elle change chaque lundi.';
  ecrire('seance-de-la-semaine/index.html', page({
    chemin, titre: 'La séance de la semaine : une vraie séance de gym douce', titreSeo: 'Séance de gym douce à la maison : la séance de la semaine', description,
    image: `${SITE}/images/seance/s01-02.webp`, imageAlt: 'Le lecteur de Moovini pendant un exercice',
    jsonld: [filAriane(ariane), { '@type': 'WebPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: 'La séance de la semaine', description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${SITE}/#app` } }],
    corps: `${arianeHtml(ariane)}
<header class="entete-page"><p class="surtitre">Une autre séance chaque lundi</p><h1>La séance de la semaine : une vraie séance de gym douce</h1>
<p class="chapeau">Chaque semaine, une vraie séance choisie parmi les ${catalogue.length} exercices de l'app. Les mouvements, leur ordre et leurs durées sont ceux que Moovini compose, sans retouche. Chaque image vient de son lecteur, à l'exercice près.</p>
<p class="seance-dates" id="seance-dates"></p></header>
${seances.map((s, k) => article(s, k, k === actuelle)).join('\n')}
<aside class="dans-appli"><h2>Dans Moovini</h2><p>Cette séance est composée pour un profil type, sans zone à ménager. Dans l'app, la tienne part de tes réponses : ton temps, tes positions, tes zones à ménager. Une vidéo, une consigne courte, une voix et un minuteur te guident, et tu peux remplacer un mouvement ou passer à une version plus douce.</p><?boutiques?></aside>
<p class="prudence">Va à ton rythme et arrête si ça fait mal. En cas de problème de santé, de blessure ou de grossesse, demande d'abord conseil à ton médecin.</p>
<script>
  // Montre la séance de la semaine en cours, à l'heure de Paris. ?decalage=1 : la semaine suivante, pour vérifier.
  (() => {
    const JOUR = 864e5, DEPART = Date.UTC(2026, 10, 2), seances = [...document.querySelectorAll('.seance')];
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date()).map(x => [x.type, +x.value]));
    const decalage = +new URLSearchParams(location.search).get('decalage') || 0;
    const jour = Date.UTC(p.year, p.month - 1, p.day) + decalage * 7 * JOUR;
    const lundi = jour - ((new Date(jour).getUTCDay() + 6) % 7) * JOUR, dimanche = lundi + 6 * JOUR;
    const n = seances.length, rang = ((Math.floor((lundi - DEPART) / (7 * JOUR)) % n) + n) % n;
    seances.forEach((s, i) => { s.hidden = i !== rang; });
    const jeudi = new Date(lundi + 3 * JOUR), debutAn = Date.UTC(jeudi.getUTCFullYear(), 0, 1), semaine = 1 + Math.floor((jeudi - debutAn) / (7 * JOUR));
    const date = (t, o) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...o }).format(t);
    const memeMois = new Date(lundi).getUTCMonth() === new Date(dimanche).getUTCMonth();
    document.getElementById('seance-dates').textContent = 'Semaine ' + semaine + ', du lundi ' + date(lundi, memeMois ? { day: 'numeric' } : { day: 'numeric', month: 'long' }) + ' au dimanche ' + date(dimanche, { day: 'numeric', month: 'long' });
  })();
</script>`,
  }));
  plan.push([chemin, AUJOURDHUI]);
}

// ---------- Blog et pages « Pour qui » ----------
function articles(dossier) {
  const d = join(RACINE, 'contenu', dossier);
  return existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.md')).map(f => ({ slug: f.slice(0, -3), ...lireMd(join(d, f)) })) : [];
}
const billets = articles('blog').sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre));
for (const b of billets) {
  const chemin = `/blog/${b.slug}/`;
  const ariane = [['Accueil', '/'], ['Blog', '/blog/'], [b.titre, chemin]];
  const autres = billets.filter(x => x.slug !== b.slug).slice(0, 3);
  ecrire(`blog/${b.slug}/index.html`, page({
    chemin, titre: b.titre, titreSeo: titrePour(b.titre), description: b.description, type: 'article', image: imageDePartage(b), imageAlt: b['image-alt'],
    jsonld: [filAriane(ariane), { '@type': 'BlogPosting', '@id': `${SITE}${chemin}#article`, mainEntityOfPage: `${SITE}${chemin}`, headline: b.titre, description: b.description, datePublished: b.date, dateModified: b['mise-a-jour'] ?? b.date, inLanguage: 'fr-FR', keywords: b['mots-cles'], image: imageDePartage(b) ?? `${SITE}/images/partage.jpg`, author: ORGANISATION, publisher: ORGANISATION, isPartOf: { '@id': `${SITE}/#site` } }],
    corps: `${arianeHtml(ariane)}
<article class="billet">
  <header class="entete-page"><p class="surtitre">Publié le <time datetime="${b.date}">${dateFr(b.date)}</time></p><h1>${echapper(b.titre)}</h1></header>
  ${couverture(b)}
  <div class="texte">${markdown(b.corps)}</div>
</article>
${autres.length ? `<section class="voisins"><h2>À lire aussi</h2><ul class="cartes">${autres.map(x => `<li><a href="/blog/${x.slug}/">${vignette(x)}<strong>${echapper(x.titre)}</strong><span>${echapper(x.description)}</span></a></li>`).join('')}</ul></section>` : ''}`,
  }));
  plan.push([chemin, b['mise-a-jour'] ?? b.date]);
}
{
  const chemin = '/blog/';
  const ariane = [['Accueil', '/'], ['Blog', chemin]];
  ecrire('blog/index.html', page({
    chemin, titre: 'Le blog Moovini : bouger en douceur au quotidien', titreSeo: 'Blog Moovini : reprendre le sport en douceur, conseils',
    description: 'Sédentaire ou débutant ? Reprendre le sport en douceur, exercices sur chaise, étirements au bureau, routines du matin : les conseils de Moovini.',
    jsonld: [filAriane(ariane), { '@type': 'Blog', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: 'Le blog Moovini', inLanguage: 'fr-FR', publisher: ORGANISATION, blogPost: billets.map(b => ({ '@id': `${SITE}/blog/${b.slug}/#article` })) }],
    corps: `${arianeHtml(ariane)}
<header class="entete-page"><h1>Le blog Moovini</h1><p class="chapeau">Des conseils simples pour les sédentaires et les débutants : bouger un peu chaque jour, reprendre en douceur et garder le rythme, chez toi comme au bureau.</p></header>
<ul class="cartes grandes">${billets.map(b => `<li><a href="/blog/${b.slug}/">${vignette(b)}<time datetime="${b.date}">${dateFr(b.date)}</time><strong>${echapper(b.titre)}</strong><span>${echapper(b.description)}</span></a></li>`).join('')}</ul>`,
  }));
  plan.push([chemin, billets[0]?.date ?? AUJOURDHUI]);
}
for (const p of articles('pour-qui')) {
  const chemin = `/pour-qui/${p.slug}/`;
  const ariane = [['Accueil', '/'], [p.titre, chemin]];
  ecrire(`pour-qui/${p.slug}/index.html`, page({
    chemin, titre: p.titre, titreSeo: titrePour(p.titre), description: p.description, image: imageDePartage(p), imageAlt: p['image-alt'],
    jsonld: [filAriane(ariane), { '@type': 'WebPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: p.titre, description: p.description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${SITE}/#app` } }],
    corps: `${arianeHtml(ariane)}
<article class="billet">
  <header class="entete-page"><p class="surtitre">Pour qui ?</p><h1>${echapper(p.titre)}</h1></header>
  ${couverture(p)}
  <div class="texte">${markdown(p.corps)}</div>
</article>`,
  }));
  plan.push([chemin, p.date]);
}

// ---------- Page « L'app » ----------
{
  const a = lireMd(join(RACINE, 'contenu', 'application.html'));
  const chemin = '/application/';
  const ariane = [['Accueil', '/'], ["L'app en détail", chemin]];
  const parSlug = Object.fromEntries(exercices.map(e => [e.slug, e]));
  const corps = a.corps.replace(/<\?exercices ([^?]+)\?>/g, (_, liste) => `<ul class="grille-fiches">${liste.split(',').map(s => {
    const x = parSlug[s.trim()];
    if (!x) throw new Error(`Exercice sans fiche dans application.html (voir exercices-retenus.json) : ${s}`);
    return `<li><a href="/exercices/${x.slug}/">${visuel(x, 96)}<span>${echapper(x.name)}</span><small>${listeFr(positions(x))}</small></a></li>`;
  }).join('')}</ul>`);
  ecrire('application/index.html', page({
    chemin, titre: a.titre, titreSeo: a['titre-seo'], description: a.description,
    jsonld: [filAriane(ariane), { '@type': 'WebPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, name: a.titre, description: a.description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${SITE}/#app` }, primaryImageOfPage: `${SITE}/images/app/13-accueil.webp` }],
    corps: `${arianeHtml(ariane)}
${corps.trim()}`,
  }));
  plan.push([chemin, a['mise-a-jour'] ?? a.date]);
}

// ---------- Questions fréquentes ----------
{
  const q = lireMd(join(RACINE, 'contenu', 'questions-frequentes.md'));
  const [intro, ...blocs] = q.corps.split(/^## /m);
  const paires = blocs.map(b => { const [question, ...reste] = b.split('\n'); return [question.trim(), markdown(reste.join('\n'))]; });
  const chemin = '/questions-frequentes/';
  const ariane = [['Accueil', '/'], ['Questions fréquentes', chemin]];
  ecrire('questions-frequentes/index.html', page({
    chemin, titre: q.titre, titreSeo: `${q.titre} : essai, prix, séances, données`, description: q.description,
    jsonld: [filAriane(ariane), { '@type': 'FAQPage', '@id': `${SITE}${chemin}`, url: `${SITE}${chemin}`, inLanguage: 'fr-FR', mainEntity: paires.map(([question, reponse]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: texteBrut(reponse) } })) }],
    corps: `${arianeHtml(ariane)}
<header class="entete-page"><h1>${echapper(q.titre)}</h1><div class="chapeau">${markdown(intro)}</div></header>
<div class="faq">${paires.map(([question, reponse]) => `<details><summary><h2>${echapper(question)}</h2></summary><div class="reponse">${reponse}</div></details>`).join('\n')}</div>`,
  }));
  plan.push([chemin, q.date]);
}

// ---------- Plan du site ----------
ecrire('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${plan.map(([c, d]) => `  <url><loc>${SITE}${c}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`);
// L'accueil et la page de l'app citent le nombre d'exercices en toutes lettres : à reprendre après un changement de catalogue.
const versions = catalogue.reduce((n, e) => n + e.variants.length, 0);
if (!readFileSync(join(RACINE, 'index.html'), 'utf8').includes(`les ${catalogue.length} exercices`)) console.warn(`À corriger dans index.html : ${catalogue.length} exercices`);
if (!readFileSync(join(RACINE, 'contenu', 'application.html'), 'utf8').includes(`<b>${catalogue.length} exercices</b>en ${versions} versions`)) console.warn(`À corriger dans contenu/application.html : ${catalogue.length} exercices en ${versions} versions`);
console.log(`${exercices.length} fiches, ${billets.length} billets, ${articles('pour-qui').length} pages « Pour qui », questions fréquentes ; ${plan.length} adresses dans le plan du site ; ${manquantes.length} vignettes réduites.`);
