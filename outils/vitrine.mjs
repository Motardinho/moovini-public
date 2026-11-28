// Habillage commun de l'accueil et de L'app, aperçu du 14 novembre 2026.
export function vitrine(html, section = 'application') {
 const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
 return html.slice(0, html.indexOf('<body')) .replace(/<link rel="stylesheet" href="\/assets\/site\.css[^"]*">/, '').replace('</head>', '<link rel="stylesheet" href="/assets/vitrine.css?v=20261128c"><script defer src="/assets/vitrine.js?v=20261114a"></script></head>') + `<body class="vitrine">
 <a class="skip" href="#contenu">Aller au contenu</a>
 <header class="v-nav"><a class="v-brand" href="/" aria-label="Moovini, accueil"><img src="/images/identite-20261114/icone.png" width="40" height="40" alt="">moovini</a><nav aria-label="Navigation principale"><a href="/application/" ${section === 'application' ? 'aria-current="page"' : ''}>L’app</a><a href="/seance-de-la-semaine/">Une séance à découvrir</a><a href="/blog/">Le blog</a><a href="/questions-frequentes/" ${section === 'questions-frequentes' ? 'aria-current="page"' : ''}>Questions</a></nav><a class="v-download" href="/telecharger/">Télécharger <span aria-hidden="true">↗</span></a></header>
 <main id="contenu">${main}</main>
 <footer class="v-footer"><a class="v-brand" href="/">moovini</a><p>Un peu de mouvement. À ton rythme.</p><nav aria-label="Pied de page"><a href="/application/">L’app</a><a href="/exercices/">Exercices</a><a href="/seance-de-la-semaine/">La séance de la semaine</a><a href="/blog/">Blog</a><a href="/pour-qui/debutant-sedentaire/">Débutants</a><a href="/pour-qui/teletravail/">Télétravail</a><a href="/pour-qui/reprendre-le-sport-apres-40-ans/">Après 40 ans</a><a href="/questions-frequentes/">Questions fréquentes</a><a href="/assistance/">Assistance</a><a href="/privacy/">Confidentialité</a><a href="/cgu/">Conditions d’utilisation</a><a href="mailto:contact@moovini.app">Contact</a></nav><small>© 2026 Moovini. Des exercices pour le bien-être, sans remplacer l’avis d’un professionnel de santé.</small></footer></body></html>`;
}

// Les pages éditoriales gardent leurs contenus et scripts (séance hebdomadaire, clips).
export function habillerContenu(html, section) {
 const shell = vitrine('<html><head></head><body><main></main></body></html>', section);
 const header = shell.match(/<header class="v-nav">[\s\S]*?<\/header>/)[0];
 const footer = shell.match(/<footer class="v-footer">[\s\S]*?<\/footer>/)[0];
 const appel = `<section class="v-cta" id="boutiques"><p class="v-eyebrow">Gym douce à la maison</p><h2>À toi de bouger.<br><em>À ton rythme.</em></h2><p class="v-lead">7 jours gratuits et sans engagement pour découvrir Moovini.</p><div class="v-actions"><a class="v-badge" href="https://apps.apple.com/fr/app/apple-store/id6825750322?pt=129550693&amp;ct=site-${section}&amp;mt=8"><img src="/images/badge-app-store-fr.svg" width="177" height="56" alt="Télécharger dans l’App Store"></a><a class="v-badge v-badge-google" href="https://play.google.com/store/apps/details?id=com.marcolevrai.moovini&amp;hl=fr&amp;referrer=utm_source%3Dmoovini.app%26utm_medium%3Dsite%26utm_campaign%3Dsite-${section}" rel="noopener"><img src="/images/badge-google-play-fr.png" width="188" height="73" alt="Disponible sur Google Play"></a></div><p class="v-fine">Puis 59,99 € par an ou 9,99 € par mois. Abonnement à renouvellement automatique, résiliable dans l’App Store ou Google Play. <a href="/cgu/">Conditions</a>.</p></section>`;
 let result = html.replace('</head>', '<link rel="stylesheet" href="/assets/vitrine.css?v=20261128c"><link rel="stylesheet" href="/assets/editorial.css?v=20261114b"></head>')
 .replace('<body>', '<body class="editorial"><a class="skip" href="#contenu">Aller au contenu</a>');
 if (result.includes('<header class="barre">')) result = result.replace(/<header class="barre">[\s\S]*?<\/header>/, header);
 else result = result.replace(/(<body[^>]*>)/, '$1' + header);
 if (result.includes('<footer class="pied">')) result = result.replace(/<footer class="pied">[\s\S]*?<\/footer>/, '<div class="v-bottom">'+appel+footer+'</div>');
 else result = result.replace('</body>', '<div class="v-bottom">'+footer+'</div></body>');
 return result.replace('<main>', '<main id="contenu">').replace("document.querySelector('.barre')", "document.querySelector('.v-nav')").replace("barre.querySelector('.marque')", "barre.querySelector('.v-brand')");
}
