/* I gesti della longevità: cinque gesti uno alla volta, nessun voto, nessun dato salvato o inviato. */
(function () {
  var box = document.querySelector('.gesti-box');
  if (!box) return;
  var gesti = [].slice.call(box.querySelectorAll('.gesto'));
  var passi = [].slice.call(box.querySelectorAll('.gesti-passi i'));
  var risposte = box.querySelector('.risposte');
  var indietro = box.querySelector('.indietro');
  var esito = box.querySelector('.esito');
  var nomi = ['alzarti dalla sedia', 'stare su una gamba', 'sederti a terra e rialzarti', 'fare le scale', 'girarti mentre cammini'];
  var date = [], ora = 0;

  function mostra(i) {
    ora = i;
    gesti.forEach(function (g, k) {
      g.hidden = k !== i;
      if (k === i) { g.classList.remove('disegna'); void g.offsetWidth; g.classList.add('disegna'); }
    });
    passi.forEach(function (p, k) { p.className = k < i ? 'fatto' : (k === i ? 'ora' : ''); });
    risposte.hidden = false; esito.hidden = true;
    indietro.hidden = i === 0;
  }

  function fine() {
    gesti.forEach(function (g) { g.hidden = true; });
    passi.forEach(function (p) { p.className = 'fatto'; });
    risposte.hidden = true; indietro.hidden = true; esito.hidden = false;
    var da = []; date.forEach(function (r, k) { if (r !== 'facile') da.push(nomi[k]); });
    var t, d;
    if (da.length === 0) {
      t = 'I tuoi gesti di oggi sono una bella base.';
      d = 'Allenarli adesso è il modo migliore per tenerli a lungo. Possiamo costruire insieme un percorso che li mantenga e ti porti un po’ più in là.';
    } else if (da.length <= 2) {
      t = 'Ci sono un paio di gesti su cui lavorare con calma.';
      d = 'È proprio da qui che si parte, un passo alla volta, con esercizi pensati per come stai tu.';
    } else {
      t = 'Alcuni gesti oggi ti costano fatica.';
      d = 'È più comune di quanto pensi, e su ognuno si può lavorare con gradualità, vicino a un appoggio e con me accanto.';
    }
    esito.querySelector('h3').textContent = t;
    esito.querySelector('.esito-testo').textContent = d;
    esito.querySelector('.esito-lista').textContent = da.length ? 'Da dove partirei: ' + da.join(', ') + '.' : '';
    esito.querySelector('h3').setAttribute('tabindex', '-1');
    esito.querySelector('h3').focus({ preventScroll: true });
  }

  risposte.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    date[ora] = b.dataset.r;
    if (ora < gesti.length - 1) mostra(ora + 1); else fine();
  });
  indietro.addEventListener('click', function () { if (ora > 0) mostra(ora - 1); });
  box.querySelector('.rifai').addEventListener('click', function () { date = []; mostra(0); });
  mostra(0);
})();
