/* Comandi del sito: barra, tappe del percorso, comparsa delle sezioni e link WhatsApp della segreteria. */
(function () {
  /* La barra diventa chiara quando lasci la foto di apertura */
  var nav = document.querySelector('.nav'), hero = document.querySelector('.hero');
  function barra() { nav.classList.toggle('chiara', window.scrollY > hero.offsetHeight - 80); }
  if (nav && hero) { barra(); window.addEventListener('scroll', barra, { passive: true }); }

  /* Le quattro tappe del percorso */
  var tabs = document.querySelectorAll('.tappe [role=tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      document.querySelectorAll('.tappa-p').forEach(function (p) { p.hidden = p.dataset.t !== t.dataset.t; });
    });
  });

  /* Le sezioni compaiono con calma mentre scorri */
  var el = document.querySelectorAll('.sezione h2, .finale h2, .chi figure, .tappa-p img, .libra-card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vista'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    el.forEach(function (x) { x.classList.add('rivela'); io.observe(x); });
  }

  /* WhatsApp della segreteria: numero in formato internazionale, senza + e spazi (es. 393331234567) */
  var NUMERO = '';
  var TESTO = 'Buongiorno, ho visto il sito di Simone e vorrei informazioni sul primo incontro';
  document.querySelectorAll('[data-whatsapp]').forEach(function (a) {
    if (NUMERO) {
      a.href = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(a.dataset.testo || TESTO);
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.addEventListener('click', function (e) { e.preventDefault(); });
      a.setAttribute('aria-disabled', 'true');
      a.title = 'Numero della segreteria ancora da inserire';
    }
  });
})();
