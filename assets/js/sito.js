/* Comandi del sito: comparsa delle sezioni e link WhatsApp della segreteria. */
(function () {
  /* Le sezioni compaiono con calma mentre scorri */
  var el = document.querySelectorAll('.tappa:not(.hero) .card, .tappa .foto, .finale .card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vista'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    el.forEach(function (x) { x.classList.add('rivela'); io.observe(x); });
  }

  /* WhatsApp della segreteria: numero in formato internazionale, senza + e spazi (es. 393331234567) */
  var NUMERO = '';
  var TESTO = 'Buongiorno, ho visto il sito di Simone e vorrei informazioni sul primo incontro';
  document.querySelectorAll('[data-whatsapp]').forEach(function (a) {
    if (NUMERO) {
      a.href = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(TESTO);
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.addEventListener('click', function (e) { e.preventDefault(); });
      a.setAttribute('aria-disabled', 'true');
      a.title = 'Numero della segreteria ancora da inserire';
    }
  });
})();
