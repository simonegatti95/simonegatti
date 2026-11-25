/* Comandi del sito: interruttore delle animazioni e link WhatsApp della segreteria. */
(function () {
  var html = document.documentElement;

  /* Senza animazioni: la scelta resta salvata nel browser di chi visita */
  var btn = document.getElementById('anim');
  function label() {
    var off = html.classList.contains('no-gl');
    btn.textContent = off ? 'Con animazioni' : 'Senza animazioni';
    btn.setAttribute('aria-pressed', off ? 'true' : 'false');
  }
  if (btn) {
    label();
    btn.addEventListener('click', function () {
      var off = html.classList.contains('no-gl');
      try { localStorage.setItem('sg-animazioni', off ? 'si' : 'no'); } catch (e) {}
      location.reload();
    });
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
