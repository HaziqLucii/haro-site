(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return RM.matches; };
  var $ = function (id) { return document.getElementById(id); };
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function store(key, val) {
    try {
      if (val === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, val);
    } catch (e) {}
    return null;
  }

  var root = $('root');

  /* ---------- scroll reveal + quest triggers ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var quests = Array.prototype.slice.call(document.querySelectorAll('[data-quest]'));
  var pending = reveals.slice();
  var fired = {};
  var raf = 0;

  function fire(el) {
    var q = el.dataset.quest;
    if (fired[q]) return;
    fired[q] = true;
    if (q === 'XP') xpSeen();
    if (el.dataset.levelup) levelUp(); else toast('QUEST DISCOVERED', q);
    if (q === 'The gate') gateDemo();
    if (q === 'The assistant') countAi();
  }

  function check() {
    raf = 0;
    var vh = window.innerHeight || 800;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { el.classList.add('in'); return false; }
      return true;
    });
    quests.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.6 && r.bottom > vh * 0.2) fire(el);
    });
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(check); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  requestAnimationFrame(check);
  later(function () { pending.forEach(function (el) { el.classList.add('in'); }); pending = []; }, 2500);

  /* ---------- toasts ---------- */
  var toastBox = $('toasts');
  var tid = 0;
  function toast(k, t) {
    var id = ++tid;
    toastBox.textContent = '';
    var el = document.createElement('div');
    el.className = 'toast';
    var a = document.createElement('div'); a.className = 'tk'; a.textContent = '[ SYSTEM ] ' + k;
    var b = document.createElement('div'); b.className = 'tt'; b.textContent = t;
    el.appendChild(a); el.appendChild(b);
    toastBox.appendChild(el);
    later(function () { if (id === tid) el.classList.add('on'); }, 30);
    later(function () { if (id === tid) el.classList.remove('on'); }, 2600);
    later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3100);
  }

  /* ---------- level up ---------- */
  var lvl = $('lvl'), lvlOpen = false, lvlTimer = 0, lvlHide = 0;
  function levelUp() {
    if (reduced() || store('haroLvl')) { toast('QUEST DISCOVERED', 'XP'); return; }
    store('haroLvl', '1');
    lvlOpen = true;
    lvl.hidden = false;
    lvl.classList.remove('on');
    later(function () { lvl.classList.add('on'); }, 30);
    lvlTimer = later(closeLvl, 3200);
  }
  function closeLvl() {
    if (!lvlOpen) return;
    lvlOpen = false;
    lvl.classList.remove('on');
    clearTimeout(lvlTimer);
    if (lvl.contains(document.activeElement)) document.activeElement.blur();
    lvlHide = setTimeout(function () { if (!lvlOpen) lvl.hidden = true; }, 500);
  }
  lvl.addEventListener('click', closeLvl);

  /* ---------- xp section state ---------- */
  function xpSeen() {
    var cells = document.querySelectorAll('#ranks .rank-cell');
    cells[2].classList.add('lit', 'cur');
    $('rewards').classList.add('on');
  }

  /* ---------- gate clearing ---------- */
  var cellsBox = $('gateCells'), gi = 0, gateCells = [];
  for (var c = 0; c < 72; c++) { var s = document.createElement('span'); cellsBox.appendChild(s); gateCells.push(s); }
  function renderGate(n) {
    for (var i = 0; i < 72; i++) {
      gateCells[i].style.background = i < n ? 'rgba(65,209,131,.8)' : (i === n ? '#d8d0c5' : '');
    }
    var key = $('gateKey');
    key.textContent = n >= 72 ? 'GREEN' : n ? 'RUNNING' : 'WAITING';
    key.classList.toggle('done', n >= 72);
    $('gateCount').textContent = Math.min(18, Math.round(n / 4)) + ' / 18 passed';
    $('gateMut').textContent = n >= 72 ? '100%' : '…';
  }
  renderGate(0);
  function gateDemo() {
    clearInterval(gi);
    if (reduced()) { renderGate(72); return; }
    var n = 0;
    renderGate(0);
    gi = setInterval(function () {
      n++;
      if (n >= 72) clearInterval(gi);
      renderGate(n);
    }, 45);
  }

  /* ---------- AI edits counter ---------- */
  var ai = 0, aiN = 3;
  function countAi() {
    clearInterval(ai);
    if (reduced()) { $('aiEdits').textContent = '0'; return; }
    aiN = 3;
    $('aiEdits').textContent = aiN;
    ai = setInterval(function () {
      if (aiN <= 0) { clearInterval(ai); return; }
      aiN--;
      $('aiEdits').textContent = aiN;
    }, 450);
  }

  /* ---------- hero system window ---------- */
  var LINES = [
    ['> You have been chosen as a Developer.', '', 0],
    ['Daily quest', 'ship one change on green', 0],
    ['Tests', '18 / 18', 1],
    ['Tamper alarm', 'clean', 0],
    ['Reward', '+120 XP', 2]
  ];
  var sw = { line: 0, chars: 0, hold: false, xp: false };
  var sysLines = $('sysLines');
  var lineEls = [];
  function renderSys() {
    var shown = LINES.slice(0, sw.line + 1);
    while (lineEls.length < shown.length) {
      var d = document.createElement('div'); d.className = 'sw-line';
      var a = document.createElement('span'), b = document.createElement('span');
      d.appendChild(a); d.appendChild(b);
      sysLines.appendChild(d);
      lineEls.push({ d: d, a: a, b: b });
    }
    while (lineEls.length > shown.length) { sysLines.removeChild(lineEls.pop().d); }
    shown.forEach(function (l, i) {
      var full = l[0] + (l[1] ? '  ' + l[1] : '');
      var n = i < sw.line ? full.length : sw.chars;
      var e = lineEls[i];
      e.d.style.color = i === 0 ? '#d8d0c5' : 'rgba(216,208,197,.62)';
      e.b.style.color = l[2] === 1 ? '#41d183' : l[2] === 2 ? '#6fb2ff' : '#d8d0c5';
      e.a.textContent = l[0].slice(0, n);
      e.b.textContent = n > l[0].length + 2 ? l[1].slice(0, n - l[0].length - 2) : '';
    });
    $('sysLv').textContent = sw.xp ? 'LV. 8' : 'LV. 7';
    $('sysXp').style.width = sw.xp ? '100%' : '62%';
    $('sysRank').textContent = sw.xp ? 'RANK  Novice → Journeyman' : 'RANK  Novice';
    $('sysAccept').classList.toggle('on', sw.hold);
  }
  function typeStep() {
    if (sw.hold) return;
    var cur = LINES[sw.line];
    var full = cur[0] + (cur[1] ? '  ' + cur[1] : '');
    if (sw.chars < full.length) sw.chars++;
    else if (sw.line < LINES.length - 1) { sw.line++; sw.chars = 0; }
    else {
      sw.hold = true;
      later(function () { sw.xp = true; renderSys(); }, 200);
      later(function () { sw.line = 0; sw.chars = 0; sw.hold = false; sw.xp = false; renderSys(); }, 7000);
    }
    renderSys();
  }
  var typeTimer = 0;
  function startTyping() {
    clearInterval(typeTimer);
    if (reduced()) {
      sw.line = LINES.length - 1; sw.chars = 999; sw.hold = true; sw.xp = true;
      renderSys();
      return;
    }
    sw = { line: 0, chars: 0, hold: false, xp: false };
    renderSys();
    typeTimer = setInterval(typeStep, 38);
  }
  startTyping();

  /* ---------- particles ---------- */
  (function () {
    var cv = $('particles');
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, dpr = window.devicePixelRatio || 1, running = false, visible = true, id = 0;
    function rs() {
      var r = cv.getBoundingClientRect();
      W = cv.width = Math.max(1, r.width * dpr);
      H = cv.height = Math.max(1, r.height * dpr);
      if (reduced()) draw(0);
    }
    var P = [];
    for (var i = 0; i < 70; i++) P.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.8 + 0.6, v: Math.random() * 0.0009 + 0.0003, f: Math.random() * 6 });
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var motion = !reduced();
      P.forEach(function (p) {
        if (motion) { p.y -= p.v; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); } }
        var a = 0.25 + 0.35 * Math.sin(t / 700 + p.f);
        ctx.fillStyle = 'rgba(111,178,255,' + Math.max(0, a) + ')';
        var s = p.s * dpr;
        ctx.fillRect(p.x * W, p.y * H, s, s);
      });
    }
    function loop(t) { draw(t); id = requestAnimationFrame(loop); }
    function sync() {
      var want = visible && !document.hidden && !reduced();
      if (want && !running) { running = true; id = requestAnimationFrame(loop); }
      else if (!want && running) { running = false; cancelAnimationFrame(id); }
    }
    rs();
    window.addEventListener('resize', rs);
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }).observe(cv);
    }
    if (RM.addEventListener) RM.addEventListener('change', function () { sync(); rs(); });
    sync();
    if (reduced()) draw(0);
  })();

  /* ---------- copy buttons ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var cmd = btn.closest('.cmd').querySelector('[data-cmd]').textContent;
      copyText(cmd);
      btn.textContent = 'COPIED';
      later(function () { btn.textContent = 'COPY'; }, 1400);
      toast('COPIED', 'Paste it into your terminal.');
    });
  });

  /* ---------- lightbox ---------- */
  var lb = $('lb'), lbImg = $('lbImg'), lbIdx = null, lbFrom = null, lbHide = 0;
  var shots = Array.prototype.map.call(document.querySelectorAll('figure a img'), function (img) {
    var fig = img.closest('figure');
    var lab = fig && fig.firstElementChild;
    return {
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      label: lab ? lab.textContent.replace(/\s+/g, ' ').replace(/\[|\]/g, '').trim() : '',
      link: img.closest('a')
    };
  });
  function lbRender() {
    var s = shots[lbIdx];
    lbImg.classList.remove('on');
    lbImg.src = s.src;
    lbImg.alt = s.alt;
    $('lbLabel').textContent = s.label;
    $('lbAlt').textContent = s.alt;
    $('lbPos').textContent = String(lbIdx + 1).padStart(2, '0') + ' / ' + String(shots.length).padStart(2, '0');
  }
  function lbOpen(i, from) {
    clearTimeout(lbHide);
    lbIdx = i;
    lbFrom = from || document.activeElement;
    lb.hidden = false;
    lb.classList.remove('on');
    lbRender();
    document.body.style.overflow = 'hidden';
    later(function () { lb.classList.add('on'); }, 20);
    later(function () { lbImg.classList.add('on'); }, 120);
    $('lbClose').focus();
  }
  function lbClose() {
    if (lbIdx === null) return;
    lbIdx = null;
    lb.classList.remove('on');
    document.body.style.overflow = '';
    lbHide = setTimeout(function () { if (lbIdx === null) lb.hidden = true; }, 350);
    if (lbFrom && lbFrom.focus) lbFrom.focus({ preventScroll: true });
    lbFrom = null;
  }
  function lbGo(d) {
    if (lbIdx === null) return;
    var n = shots.length;
    lbIdx = (lbIdx + d + n) % n;
    lbRender();
    later(function () { lbImg.classList.add('on'); }, 60);
  }
  root.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var a = e.target.closest && e.target.closest('figure a');
    if (!a || !a.querySelector('img')) return;
    e.preventDefault();
    var src = a.querySelector('img').getAttribute('src');
    var i = shots.findIndex(function (s) { return s.src === src; });
    lbOpen(i < 0 ? 0 : i, a);
  });
  lb.addEventListener('click', lbClose);
  $('lbClose').addEventListener('click', lbClose);
  $('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); lbGo(-1); });
  $('lbNext').addEventListener('click', function (e) { e.stopPropagation(); lbGo(1); });
  $('lbClose').addEventListener('click', function (e) { e.stopPropagation(); });
  document.querySelector('.lb-panel').addEventListener('click', function (e) { e.stopPropagation(); });

  window.addEventListener('keydown', function (e) {
    if (lbIdx !== null) {
      if (e.key === 'Escape') { e.preventDefault(); lbClose(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(-1); }
      else if (e.key === 'Tab') {
        var f = [$('lbClose'), $('lbPrev'), $('lbNext')];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
      return;
    }
    if (e.key === 'Escape') closeLvl();
  });

  if (RM.addEventListener) RM.addEventListener('change', function () { startTyping(); });
})();
