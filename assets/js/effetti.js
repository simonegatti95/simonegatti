/* Effetti della home: la linea oro del percorso, l'apertura viva, il vetro che riflette la luce,
   le parole che si accendono e le tappe che avanzano. Tutto morbido; con "riduci animazioni" resta fermo. */
(function () {
  var html = document.documentElement;
  var fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = document.querySelector('main');
  var NS = 'http://www.w3.org/2000/svg';
  html.classList.add(fermo ? 'fx-fermo' : 'fx');

  /* ---------- 1. La linea oro del percorso ---------- */
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'percorso-linea');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<defs><mask id="disegna" maskUnits="userSpaceOnUse"><path class="m" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/></mask></defs>' +
    '<path class="traccia" fill="none"/>' +
    '<path class="oro" fill="none" mask="url(#disegna)"/>' +
    '<g class="punti"></g>';
  main.prepend(svg);
  var pTraccia = svg.querySelector('.traccia'), pOro = svg.querySelector('.oro'), pMask = svg.querySelector('.m'), gPunti = svg.querySelector('.punti');
  var tappe = [].slice.call(main.querySelectorAll(':scope > section:not(.hero)'));
  var lunghezza = 0, campioni = [], punti = [];

  function costruisci() {
    var w = main.clientWidth, h = main.scrollHeight, tel = w < 700;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.height = h + 'px';
    var hero = document.querySelector('.hero');
    var pts = [[tel ? 14 : w / 2, hero.offsetTop + hero.offsetHeight - 30]];
    tappe.forEach(function (s, i) {
      var x = tel ? 14 : (i % 2 ? w - Math.max(28, w * 0.035) : Math.max(28, w * 0.035));
      pts.push([x, s.offsetTop + (tel ? 40 : 70), true]);
      // scende lungo il bordo della sezione e attraversa solo nel passaggio alla successiva
      if (!tel) pts.push([x, s.offsetTop + s.offsetHeight - 60]);
    });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], my = (b[1] - a[1]) * 0.5;
      d += tel ? ' L' + b[0] + ' ' + b[1] : ' C' + a[0] + ' ' + (a[1] + my) + ' ' + b[0] + ' ' + (b[1] - my) + ' ' + b[0] + ' ' + b[1];
    }
    [pTraccia, pOro, pMask].forEach(function (p) { p.setAttribute('d', d); });
    lunghezza = pMask.getTotalLength();
    pMask.style.strokeDasharray = lunghezza;
    // per sapere quanta linea disegnare a una certa altezza
    campioni = [];
    for (var k = 0; k <= 400; k++) { var l = lunghezza * k / 400; campioni.push([pMask.getPointAtLength(l).y, l]); }
    gPunti.innerHTML = '';
    punti = pts.filter(function (p) { return p[2]; }).map(function (p) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', tel ? 5 : 7);
      gPunti.appendChild(c);
      return { el: c, y: p[1] };
    });
  }
  function lineaA(y) {
    var l = 0;
    for (var k = 0; k < campioni.length; k++) { if (campioni[k][0] <= y) l = Math.max(l, campioni[k][1]); }
    return l;
  }

  /* ---------- 2. Apertura viva: lettere una per una ---------- */
  var parola = document.querySelector('.hero-word');
  if (parola && !fermo) {
    var t = parola.textContent;
    parola.innerHTML = t.split('').map(function (c, i) { return '<span style="animation-delay:' + (300 + i * 70) + 'ms">' + c + '</span>'; }).join('');
  }
  var heroBg = document.querySelector('.hero-bg'), heroTesti = document.querySelectorAll('.hero-left, .hero-right');

  /* ---------- 4a. Parole che si accendono ---------- */
  var quote = document.querySelector('.manifesto blockquote'), parole = [];
  if (quote && !fermo) {
    (function dividi(nodo) {
      [].slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span'); s.className = 'parola'; s.textContent = w; f.appendChild(s); parole.push(s);
          });
          nodo.replaceChild(f, n);
        } else if (n.nodeType === 1) dividi(n);
      });
    })(quote);
  }

  /* ---------- 4b. Le tappe del percorso avanzano scorrendo ---------- */
  var sezPerc = document.getElementById('percorso');
  var tabs = [].slice.call(document.querySelectorAll('.tappe [role=tab]'));
  var barra = document.querySelector('.avanza i');
  var scorrePerc = function () { return !fermo && innerWidth > 700; };
  var attiva = -1;
  function mostra(i) {
    if (i === attiva) return; attiva = i;
    tabs.forEach(function (x, k) { x.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    document.querySelectorAll('.tappa-p').forEach(function (p) { p.hidden = +p.dataset.t !== i; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function (e) {
      if (!scorrePerc()) return;
      e.stopImmediatePropagation();
      var corsa = sezPerc.offsetHeight - innerHeight;
      scrollTo({ top: sezPerc.offsetTop + corsa * (i + 0.5) / 4, behavior: 'smooth' });
    }, true);
  });

  /* ---------- 3. Schede che galleggiano ---------- */
  var floats = [].slice.call(document.querySelectorAll('[data-v]'));

  /* ---------- Un solo ciclo per tutto ciò che segue lo scroll ---------- */
  var richiesto = false;
  function aggiorna() {
    richiesto = false;
    var y = scrollY, vh = innerHeight;
    // linea
    var fino = y + vh * 0.62 - main.offsetTop;
    var l = fermo ? lunghezza : lineaA(fino);
    pMask.style.strokeDashoffset = lunghezza - l;
    punti.forEach(function (p) { p.el.classList.toggle('accesa', fermo || p.y <= fino); });
    if (fermo) return;
    // apertura
    if (y < vh * 1.2) {
      if (parola) {
        parola.style.transform = 'translateY(' + (y * 0.6) + 'px)';
        // svanisce prima di arrivare sotto la barra in alto
        var spazio = Math.max(60, (parola.offsetTop - 75) / 0.4);
        parola.style.opacity = Math.max(0, 1 - y / spazio).toFixed(3);
      }
      if (heroBg) heroBg.style.transform = 'translateY(' + (y * 0.2) + 'px)';
    }
    // schede
    floats.forEach(function (f) {
      var r = f.parentNode.getBoundingClientRect();
      var off = (r.top + r.height / 2 - vh / 2) * (+f.dataset.v);
      f.style.transform = 'translateY(' + Math.max(-40, Math.min(40, off)).toFixed(1) + 'px)';
    });
    // parole
    if (parole.length) {
      var rq = quote.getBoundingClientRect();
      var p = (vh * 0.85 - rq.top) / (vh * 0.6 + rq.height * 0.5);
      var n = Math.round(Math.max(0, Math.min(1, p)) * parole.length);
      parole.forEach(function (w, i) { w.classList.toggle('accesa', i < n); });
    }
    // tappe
    if (scorrePerc()) {
      var r2 = sezPerc.getBoundingClientRect(), corsa = sezPerc.offsetHeight - vh;
      var pr = Math.max(0, Math.min(0.999, -r2.top / corsa));
      mostra(Math.floor(pr * 4));
      if (barra) barra.style.transform = 'scaleX(' + pr.toFixed(3) + ')';
    }
  }
  function chiedi() { if (!richiesto) { richiesto = true; requestAnimationFrame(aggiorna); } }
  function rifai() { sezPerc.classList.toggle('scorre', scorrePerc()); costruisci(); aggiorna(); }
  addEventListener('scroll', chiedi, { passive: true });
  addEventListener('resize', function () { clearTimeout(rifai.t); rifai.t = setTimeout(rifai, 150); });
  addEventListener('load', rifai);
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(rifai.t); rifai.t = setTimeout(rifai, 150); }).observe(main);
  rifai();

  /* ---------- 3. Riflesso di luce che segue il mouse sul vetro ---------- */
  if (!fermo && matchMedia('(hover: hover)').matches) {
    var raf = 0, ev = null;
    document.addEventListener('pointermove', function (e) {
      ev = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var g = ev.target.closest && ev.target.closest('.float, .libra-card, .tappe, .nav, .pill');
        if (!g) return;
        var r = g.getBoundingClientRect();
        g.style.setProperty('--gx', (ev.clientX - r.left) + 'px');
        g.style.setProperty('--gy', (ev.clientY - r.top) + 'px');
      });
    }, { passive: true });
  }
})();
