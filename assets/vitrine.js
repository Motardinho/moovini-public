document.querySelectorAll('[data-demo]').forEach(video => {
 const button = video.closest('.v-demo').querySelector('button');
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 let active = !reduce.matches && !navigator.connection?.saveData;
 function label(){button.textContent = video.paused ? 'Lire la démonstration' : 'Mettre en pause';button.setAttribute('aria-pressed', String(!video.paused));}
 video.addEventListener('play',label);video.addEventListener('pause',label);
 button.addEventListener('click',()=>{active=video.paused;if(active)video.play().catch(label);else video.pause();});
 new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&active)video.play().catch(label);else video.pause();}),{threshold:.25}).observe(video);
 reduce.addEventListener('change',()=>{if(reduce.matches){active=false;video.pause();}});label();
});
