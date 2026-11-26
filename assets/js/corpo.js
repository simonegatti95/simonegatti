/* Mappa del corpo: tocchi una zona e leggi cosa possiamo fare. Nessun dato salvato o inviato.
   Testi da confermare con Simone. */
(function () {
  var Z = {
    spalle: {
      t: 'Collo e spalle',
      noti: 'Fai fatica a girarti in macchina o a prendere qualcosa in alto.',
      fare: 'Lavoriamo sulla mobilità delle spalle e della parte alta della schiena, con movimenti lenti e ampi.',
      oggi: 'Seduto, porta le spalle verso le orecchie e lasciale cadere. Cinque volte, respirando piano.'
    },
    schiena: {
      t: 'Schiena',
      noti: 'Ti pesa stare in piedi a lungo o chinarti per allacciare le scarpe.',
      fare: 'Rinforziamo i muscoli che sostengono la schiena e impariamo a piegarci usando le gambe.',
      oggi: 'In piedi, mani sui fianchi, cammina sul posto per un minuto tenendo la schiena alta.'
    },
    anche: {
      t: 'Anche',
      noti: 'Ti alzi a fatica dal divano o senti le gambe rigide al mattino.',
      fare: 'Le anche sono il motore del cammino: lavoriamo su forza e mobilità, spesso nella sabbia di Libra.',
      oggi: 'Alzati e siediti dalla sedia cinque volte, con calma, usando le mani se serve.'
    },
    ginocchia: {
      t: 'Ginocchia',
      noti: 'Le scale ti preoccupano, soprattutto in discesa.',
      fare: 'Rinforziamo le cosce, che proteggono il ginocchio, con esercizi dosati su come stai quel giorno.',
      oggi: 'Seduto, distendi una gamba davanti a te e tienila ferma tre secondi. Cinque volte per gamba.'
    },
    piedi: {
      t: 'Caviglie e piedi',
      noti: 'Inciampi più spesso o ti senti insicuro sui terreni irregolari.',
      fare: 'Piedi e caviglie sono i sensori dell’equilibrio: li risvegliamo camminando su erba e sabbia.',
      oggi: 'Tenendoti a un tavolo, sali sulle punte e scendi piano. Dieci volte.'
    },
    equilibrio: {
      t: 'Equilibrio',
      noti: 'Ti tieni ai muri o hai paura di cadere.',
      fare: 'L’equilibrio si allena a ogni età. Partiamo vicino a un appoggio e lo togliamo solo quando ti senti sicuro.',
      oggi: 'Vicino a un muro, metti un piede davanti all’altro, come su una linea, e conta fino a dieci.'
    }
  };
  var scheda = document.querySelector('.zona-scheda');
  if (!scheda) return;
  var bottoni = [].slice.call(document.querySelectorAll('#corpo [data-z]'));
  var figura = document.querySelector('.figura');

  function apri(z) {
    var d = Z[z]; if (!d) return;
    bottoni.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.z === z ? 'true' : 'false'); });
    figura.classList.toggle('tutto', z === 'equilibrio');
    scheda.innerHTML =
      '<h3>' + d.t + '</h3>' +
      '<dl><dt>Cosa noti</dt><dd>' + d.noti + '</dd>' +
      '<dt>Cosa possiamo fare</dt><dd>' + d.fare + '</dd>' +
      '<dt>Un gesto da provare oggi</dt><dd>' + d.oggi + '</dd></dl>' +
      '<p class="medico">Se hai un dolore forte o recente, senti prima il tuo medico.</p>' +
      '<a class="pill oro" href="#prenota">Parliamone al primo incontro</a>';
    scheda.classList.remove('entra'); void scheda.offsetWidth; scheda.classList.add('entra');
  }
  bottoni.forEach(function (b) { b.addEventListener('click', function () { apri(b.dataset.z); }); });
})();
