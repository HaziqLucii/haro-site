(function () {
  'use strict';

  var REL = 'https://github.com/HaziqLucii/haro-oss/releases/download/v0.11.0/';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Glyph units: x 0..56, y 0..51. kind: d dots, c cells, g gate, b bar.
  var MARK = [
    [0, 0, 6, 6, 'd', 0], [12, 0, 6, 6, 'd', 1], [24, 0, 6, 6, 'd', 2], [36, 0, 6, 6, 'd', 3], [48, 0, 6, 6, 'd', 4],
    [0, 16, 9, 9, 'c', 0], [18, 16, 9, 9, 'c', 1], [36, 16, 9, 9, 'c', 2],
    [9, 25, 9, 9, 'c', 3], [27, 25, 9, 9, 'c', 4], [45, 25, 9, 9, 'c', 5],
    [0, 40, 11, 11, 'g', 0], [14, 40, 42, 11, 'b', 0]
  ];
  var NEED = { d: 0, c: 1, g: 2, b: 3 };

  var SHOTS = [
    ['MANUAL WORKSPACE', 'shot-manual', 'A manual workspace on the code step, with the plan checklist in the rail.'],
    ['SEARCH', 'shot-search', 'The Search tab: a short answer with its sources, grouped by repo, git and docs.'],
    ['THE SCOPE BOX', 'shot-fence', 'The agent step with a task typed in and the Scope box holding two files.'],
    ['REVIEW OVERVIEW', 'shot-review', 'The review Overview: intent, fence, size with the reading pace, and the list of things that need your review.'],
    ['SHIP', 'shot-ship', 'The ship step with the receipt and the merge panel.'],
    ['REVIEW · GREEN', 'shot-verify', 'The review step with a green verdict and the start of the Overview.'],
    ['REVIEW · RED', 'shot-red', 'The review step with a red verdict: the tamper alarm reports a weakened suite and the merge is blocked.'],
    ['AGENT STEP', 'shot-agent', 'The agent step after a run: the summary, the Restore files to before this run button and the Scope box.'],
    ['DASHBOARD', 'shot-dashboard', 'The dashboard: workspaces grouped by what they need, each with its next step.'],
    ['HOW XP WORKS', 'shot-xp', 'The How XP works popover above the sidebar footer.']
  ];

  var INSTALLS = [
    ['AppImage', 'curl -LO ' + REL + 'haro-0.11.0-x86_64.AppImage && chmod +x haro-0.11.0-x86_64.AppImage && ./haro-0.11.0-x86_64.AppImage', REL + 'haro-0.11.0-x86_64.AppImage'],
    ['Tarball', 'curl -L ' + REL + 'haro-0.11.0-linux-x86_64.tar.gz | tar xz && ./haro-0.11.0-linux-x86_64/install.sh', REL + 'haro-0.11.0-linux-x86_64.tar.gz']
  ];

  var FAQ = [
    ['Is this anti-AI?', 'No. haro is against unchecked code, not against AI. Agent mode is right there, behind the same gate. Use it when you want the work done for you, and Manual mode when you want to write it yourself.'],
    ['Can the AI write code in Manual mode?', 'No. It cannot edit files or run commands, and haro compares your files before and after every answer. If an answer includes code, haro strips it out.'],
    ['How does the scope fence work?', 'Before an agent run starts, haro remembers your worktree. When the run ends it puts back anything the agent changed outside the files you named, and keeps what it wrote there under a git ref. It checks the result, not the agent’s tools, because an agent with a shell can write anywhere. The fence is opt-in: leave Scope empty and the agent can edit anything.'],
    ['Can the receipt prove no AI wrote my code?', 'No. It describes what happened inside haro: what the agent and the assistant did, and which files you edited yourself. It cannot see a chat window open next to it, and it does not try to.'],
    ['Can the agent still do damage with a shell command?', 'The fence is about files, so it does not stop a command from using the network. A short block-list refuses the worst commands (a hard reset, a force push, reading .env files) and lists them on the receipt, but it is a quick check on the text, not a guarantee. That is why every run keeps a restore point: one button puts your files back to before it started.'],
    ['What stops me farming XP?', 'Small daily rewards pay once a day. The big ones only pay when a workspace merges green, once per workspace, and never for an empty change. And it is a personal score on your own machine, so the only person you would be fooling is you.'],
    ['What happens if I switch to Agent halfway?', 'haro asks first and saves your work. The XP you already earned stays yours. The merge then pays agent rates, and that task will not count toward your streak.'],
    ['Does it work on Windows?', 'Not yet. Linux comes first.'],
    ['Is it free and open source?', 'Yes. It is MIT licensed, the source is on GitHub, and it all runs on your machine.']
  ];

  var MODES = {
    manual: {
      line: 'You write every line. Three steps.',
      steps: [
        ['code', 'You write it. The assistant only plans and points you to sources.'],
        ['review', 'Your tests run. You read the overview, then the files.'],
        ['ship', 'Merge on green. The receipt says who wrote it.']
      ]
    },
    agent: {
      line: 'The agent writes, you review. Four steps.',
      steps: [
        ['agent', 'Describe the task and fence it to the files you name.'],
        ['code', 'Read the diff. Lines the tests ran are marked.'],
        ['review', 'The overview first, then the tests. You decide.'],
        ['ship', 'Merge on green, with a receipt.']
      ]
    }
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function drawMark(host) {
    MARK.forEach(function (p) {
      var i = document.createElement('i');
      i.style.left = (p[0] / 56 * 100) + '%';
      i.style.top = (p[1] / 51 * 100) + '%';
      i.style.width = (p[2] / 56 * 100) + '%';
      i.style.height = (p[3] / 51 * 100) + '%';
      if (p[4] === 'g') i.className = 'g';
      i.dataset.kind = p[4];
      host.appendChild(i);
    });
  }
  $$('[data-mark]').forEach(drawMark);

  var heroMark = $('.mark-hero');
  var labels = $$('.ml');
  var phase = 4;

  function paintHero(p) {
    $$('i', heroMark).forEach(function (i) {
      i.style.opacity = p >= NEED[i.dataset.kind] ? 1 : 0.12;
    });
    labels.forEach(function (l) { l.classList.toggle('on', p >= +l.dataset.need); });
    $('#ml-gate').textContent = p >= 3 ? '3 · GATE · GREEN → 4 · MERGED' : '3 · GATE · GREEN';
  }

  var modeKey = 'manual', stepOn = 0, ticks = 0;
  var stepsHost = $('#steps');

  function paintSteps() {
    var m = MODES[modeKey];
    stepsHost.innerHTML = '';
    stepsHost.style.setProperty('--n', m.steps.length);
    m.steps.forEach(function (s, k) {
      var d = el('div', 'step' + (k === stepOn ? ' on' : '') + (s[0] === 'review' ? ' v' : ''));
      var h = el('div', 'step-h');
      h.appendChild(el('span', 'step-n', '0' + (k + 1)));
      h.appendChild(el('span', 'step-dot'));
      h.appendChild(el('span', 'step-name', s[0]));
      d.appendChild(h);
      d.appendChild(el('div', 'step-d', s[1]));
      stepsHost.appendChild(d);
    });
    $('#mode-line').textContent = m.line;
    $$('.seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === modeKey)); });
  }
  $$('.seg button').forEach(function (b) {
    b.addEventListener('click', function () { modeKey = b.dataset.mode; stepOn = 0; paintSteps(); });
  });

  if (reduce) {
    paintHero(4);
    paintSteps();
  } else {
    paintHero(0);
    paintSteps();
    setInterval(function () {
      ticks += 1;
      phase = Math.min(ticks % 6, 4);
      paintHero(phase);
      if (phase === 0 || ticks % 6 === 0) {
        stepOn = (stepOn + 1) % MODES[modeKey].steps.length;
        paintSteps();
      }
    }, 900);
  }

  // reveal on scroll
  var reveals = $$('.reveal');
  function showAll() { reveals.forEach(function (e) { e.classList.add('in'); }); }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (e) { io.observe(e); });
    setTimeout(showAll, 4000);
  } else {
    showAll();
  }

  // nav highlight
  var links = $$('#nav-links a');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { so.observe(s); });
  }

  // gate demo
  var gate = $('#gate-demo'), gN = 0, gTimer = null, gRan = false;
  function paintGate(done, run) {
    gate.dataset.state = done ? 'done' : run ? 'run' : 'idle';
    $('#g-key').textContent = done ? 'GREEN' : run ? 'RUNNING' : 'NOT RUN';
    $('#g-when').textContent = done ? 'illustration · 3.2s' : run ? 'illustration · running…' : 'illustration · waiting';
    $('#g-head').textContent = done ? 'All 18 tests pass' : run ? gN + ' of 18 tests done' : 'Scroll here to run it';
    $('#g-bar').style.width = Math.round(gN / 18 * 100) + '%';
    $('#g-tests').textContent = gN + ' / 18';
    $('#g-cov').textContent = done ? '91.2%' : '…';
    $('#g-merge').textContent = done ? 'open' : 'blocked';
  }
  function runGate() {
    clearInterval(gTimer);
    gN = 0;
    if (reduce) { gN = 18; paintGate(true, false); return; }
    paintGate(false, true);
    gTimer = setInterval(function () {
      gN += 1;
      if (gN >= 18) { clearInterval(gTimer); gN = 18; paintGate(true, false); } else paintGate(false, true);
    }, 110);
  }
  $('#g-rerun').addEventListener('click', runGate);

  // xp
  var xpCard = $('#xp-card'), xpOn = false;
  var RANKS = ['NOVICE', 'JOURNEYMAN', 'CRAFTSMAN', 'MASTER'];
  var rankHost = $('#xp-ranks');
  RANKS.forEach(function (r) { rankHost.appendChild(el('span', '', r)); });
  var tickHost = $('#xp-ticks');
  for (var k = 0; k < 14; k++) tickHost.appendChild(el('i', k === 3 || k === 8 ? 'o' : ''));
  function paintXp(on) {
    xpCard.classList.toggle('xp-on', on);
    $('#xp-lvl').textContent = on ? 8 : 7;
    $('#xp-rank').textContent = on ? 'Craftsman' : 'Journeyman';
    $('#xp-txt').textContent = on ? '2,120 / 4,000 XP' : '1,240 / 2,000 XP';
    $('#xp-bar').style.width = on ? '6%' : '62%';
    $$('span', rankHost).forEach(function (s, i) { s.classList.toggle('lit', i <= (on ? 2 : 1)); });
  }
  paintXp(false);

  function inView(e) {
    var r = e.getBoundingClientRect();
    return r.top < innerHeight * 0.85 && r.bottom > 0;
  }
  function demos() {
    if (!gRan && inView(gate)) { gRan = true; runGate(); }
    if (!xpOn && inView(xpCard)) { xpOn = true; paintXp(true); }
  }
  window.addEventListener('scroll', demos, { passive: true });
  setInterval(demos, 500);
  demos();

  // downloads
  var toast = $('#toast'), toastT = null;
  function say(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.hidden = true; }, 1600);
  }
  INSTALLS.forEach(function (it) {
    var box = el('div', 'inst');
    var h = el('div', 'inst-h');
    h.appendChild(el('h3', '', it[0]));
    var a = el('a', '', 'Download the file');
    a.href = it[2];
    h.appendChild(a);
    box.appendChild(h);
    var cmd = el('div', 'cmd');
    var sp = el('span');
    sp.appendChild(el('span', 'p', '$ '));
    sp.appendChild(document.createTextNode(it[1]));
    cmd.appendChild(sp);
    var b = el('button', '', 'COPY');
    b.type = 'button';
    b.addEventListener('click', function () {
      try { navigator.clipboard.writeText(it[1]); } catch (e) { /* the command stays selectable */ }
      b.textContent = 'COPIED';
      say('Copied. Paste it into your terminal.');
      setTimeout(function () { b.textContent = 'COPY'; }, 1600);
    });
    cmd.appendChild(b);
    box.appendChild(cmd);
    $('#installs').appendChild(box);
  });

  // faq
  FAQ.forEach(function (f) {
    var d = el('details');
    var s = el('summary');
    s.appendChild(el('span', '', f[0]));
    s.appendChild(el('i', '', '+'));
    d.appendChild(s);
    d.appendChild(el('div', 'ans', f[1]));
    $('#faq-list').appendChild(d);
  });

  // lightbox
  var lb = $('#lb'), lbI = null;
  function lbPaint() {
    var s = SHOTS[lbI];
    $('#lb-label').textContent = s[0];
    $('#lb-pos').textContent = String(lbI + 1).padStart(2, '0') + ' / ' + String(SHOTS.length).padStart(2, '0');
    var img = $('#lb-img');
    img.style.opacity = 0;
    img.onload = function () { img.style.opacity = 1; };
    img.src = 'shots/' + s[1] + '.jpg';
    img.alt = s[2];
    $('#lb-alt').textContent = s[2];
  }
  function lbOpen(i) {
    lbI = i;
    lb.hidden = false;
    lbPaint();
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('show'); });
  }
  function lbClose() {
    lb.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbI = null; }, 250);
  }
  function lbGo(d) { lbI = (lbI + d + SHOTS.length) % SHOTS.length; lbPaint(); }
  $$('.shot').forEach(function (b) { b.addEventListener('click', function () { lbOpen(+b.dataset.shot); }); });
  lb.addEventListener('click', lbClose);
  $('.lb-win').addEventListener('click', function (e) { e.stopPropagation(); });
  $('#lb-close').addEventListener('click', lbClose);
  $('#lb-prev').addEventListener('click', function () { lbGo(-1); });
  $('#lb-next').addEventListener('click', function () { lbGo(1); });
  window.addEventListener('keydown', function (e) {
    if (lbI === null) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbGo(1);
    else if (e.key === 'ArrowLeft') lbGo(-1);
  });
})();
