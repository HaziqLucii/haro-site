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
  }

  var ticks = 0;
  if (reduce) {
    paintHero(4);
  } else {
    paintHero(0);
    setInterval(function () {
      ticks += 1;
      phase = Math.min(ticks % 6, 4);
      paintHero(phase);
    }, 750);
  }

  // Dithered backdrop: one 3px-per-cell canvas inside each [data-dither] zone (hero, gate, footer),
  // absolutely positioned so it scrolls with the page and never responds to scroll. Ordered 4x4 Bayer
  // threshold over a slow warped field. Zones off screen are skipped; under reduced motion the field
  // is drawn once at t=0.
  (function startDither() {
    var S = 3, FADE = 520 / S, REACH = 240, VH = 300;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + .5) / 16; });
    var ON = new Uint32Array(new Uint8Array([216, 208, 197, 255]).buffer)[0];
    var N = 4096, K = N / (2 * Math.PI), LUT = new Float32Array(N);
    for (var q = 0; q < N; q++) LUT[q] = Math.sin(q / K);
    function sn(a) { return LUT[(a * K | 0) & (N - 1)]; }
    function cs(a) { return LUT[((a + 1.5707963267948966) * K | 0) & (N - 1)]; }

    var zones = $$('[data-dither]').map(function (host) {
      var cv = document.createElement('canvas');
      cv.className = 'dither';
      cv.setAttribute('aria-hidden', 'true');
      host.insertBefore(cv, host.firstChild);
      if (!cv.getContext) return null;
      return { host: host, cv: cv, ctx: cv.getContext('2d'), w: 0, h: 0, img: null, px: null, colWy: null, vis: !window.IntersectionObserver, dirty: true };
    }).filter(Boolean);
    if (!zones.length) return;

    function size(z) {
      var w = Math.ceil(z.host.offsetWidth / S), h = Math.ceil((z.host.offsetHeight + 2 * REACH) / S);
      if (w === z.w && h === z.h) return;
      z.w = z.cv.width = w;
      z.h = z.cv.height = h;
      z.img = z.ctx.createImageData(w, h);
      z.px = new Uint32Array(z.img.data.buffer);
      z.colWy = new Float32Array(w);
      z.dirty = true;
    }

    function draw(z, t) {
      var w = z.w, h = z.h, px = z.px, colWy = z.colWy, T = reduce ? 0 : t / 1000;
      var aspect = w / VH * 3.2;
      var x, y;
      for (x = 0; x < w; x++) {
        var ax = x / w * aspect;
        colWy[x] = 1.2 * cs(ax * 1.1 - T * .17) + .5 * sn(ax * 2.7 + T * .09);
      }
      for (y = 0; y < h; y++) {
        var za = Math.min(1, Math.min(y, h - y) / FADE);
        var row = y * w;
        if (za <= 0) { px.fill(0, row, row + w); continue; }
        var ay = y / VH * 3.2;
        var rowWx = 1.4 * sn(ay * 1.3 + T * .21) + .6 * sn(ay * 3.1 - T * .13);
        var nyA = y * .047, nyB = y * .083;
        for (x = 0; x < w; x++) {
          var nz = .5 + .5 * sn(x * .11 + nyA + T * .05) * sn(x * .029 - nyB);
          var ef = Math.max(0, Math.min(1, za * 1.6 - .6 + nz * .6));
          if (ef <= 0) { px[row + x] = 0; continue; }
          ef = ef * ef * (3 - 2 * ef);
          var wx = x / w * aspect + rowWx, wy = ay + colWy[x];
          var v = .5 + .28 * sn(wx * 1.7 + cs(wy * 1.9 + T * .11) * 2.2) + .22 * sn(wy * 2.3 - wx * .8 + T * .07);
          v = Math.max(0, (v - .42) * 1.9);
          v = Math.min(1, v) * ef;
          px[row + x] = v > BAYER[(y & 3) * 4 + (x & 3)] ? ON : 0;
        }
      }
      z.ctx.putImageData(z.img, 0, 0);
      z.dirty = false;
    }

    var now = 0, last = 0, pending = 0;
    function paint(all) {
      zones.forEach(function (z) {
        size(z);
        if (z.vis && (z.dirty || all)) draw(z, now);
      });
    }
    function frame(t) {
      now = t;
      if (t - last >= 80) { last = t; paint(true); }
      requestAnimationFrame(frame);
    }
    function refresh() {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; paint(false); });
    }

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          zones.forEach(function (z) { if (z.cv === e.target) { z.vis = e.isIntersecting; if (z.vis) z.dirty = true; } });
        });
        refresh();
      }, { rootMargin: '300px 0px' });
      zones.forEach(function (z) { io.observe(z.cv); });
    }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(refresh);
      zones.forEach(function (z) { ro.observe(z.host); });
    } else {
      addEventListener('resize', refresh);
    }

    paint(true);
    if (!reduce) requestAnimationFrame(frame);
  })();

  // The two flow diagrams. Node 0..4 sit at fixed spots; the dot rides one edge per tick
  // (script rows are [node on, edge the dot rides, red?]); red sends it back along the loop.
  var NODES = [[89, 58, 92, 44], [194, 138, 92, 44], [299, 58, 92, 44], null, [504, 58, 92, 44]];
  var EDGES = ['M135 102 V160 H194', 'M286 160 H345 V102', 'M391 80 H450 V206', 'M508 240 H550 V102'];
  var FLOWS = {
    agent: {
      lanes: ['YOU', 'AGENT', 'TESTS'],
      edgeLabels: [[165, 152, 'run'], [318, 152, 'diff'], [470, 150, 'review'], [520, 232, 'yes']],
      loop: ['M450 274 V288 H240 V182', 345, 295, 'no \u00b7 red \u2192 agent fixes'],
      nodes: [['Task + scope', 'you name files'], ['Edit worktree', 'fenced to scope'], ['Review', 'mark files viewed'], ['Tests green?', 'your suite'], ['Merge', '+ receipt']],
      back: 'AGENT',
      script: [[0, 0], [1, 1], [2, 2], [3, 'L', 1], [1, 1], [2, 2], [3, 3], [4], [4], [4]]
    },
    manual: {
      lanes: ['YOU', 'AI \u00b7 READ', 'TESTS'],
      edgeLabels: [[165, 152, 'ask'], [318, 152, 'points'], [470, 150, 'tests'], [520, 232, 'yes']],
      loop: ['M450 274 V288 H312 V102', 380, 295, 'no \u00b7 red \u2192 you fix it'],
      nodes: [['Ask a plan', 'what to build'], ['Plan + refs', '0 edits'], ['Write code', 'by hand'], ['Tests green?', 'your suite'], ['Merge', '+ receipt']],
      back: 'YOU',
      script: [[0, 0], [1, 1], [2, 2], [3, 'L', 1], [2, 2], [3, 3], [4], [4], [4], [4]]
    }
  };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function parsePath(d) {
    var pts = [], x = 0, y = 0;
    d.match(/[MVH][^MVH]+/g).forEach(function (t) {
      var c = t[0], v = t.slice(1).trim().split(/\s+/).map(Number);
      if (c === 'M') { x = v[0]; y = v[1]; } else if (c === 'V') y = v[0]; else x = v[0];
      pts.push([x, y]);
    });
    var seg = [], L = 0;
    for (var i = 1; i < pts.length; i++) {
      var l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
      seg.push(l); L += l;
    }
    return { pts: pts, seg: seg, L: L };
  }
  function pointAt(e, p) {
    var d = e.L * p;
    for (var i = 0; i < e.seg.length; i++) {
      if (d <= e.seg[i]) {
        var a = e.pts[i], b = e.pts[i + 1], f = e.seg[i] ? d / e.seg[i] : 0;
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      d -= e.seg[i];
    }
    return e.pts[e.pts.length - 1];
  }
  var edgePaths = EDGES.map(parsePath);

  function buildFlow(key) {
    var f = FLOWS[key], host = $('#flow-' + key), svg = $('svg', host);
    var defs = sv('defs');
    var pat = sv('pattern', { id: 'fg-' + key, width: 10, height: 10, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(sv('circle', { cx: 1, cy: 1, r: .6, fill: 'rgba(216,208,197,.10)' }));
    var mk = sv('marker', { id: 'fa-' + key, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    mk.appendChild(sv('path', { d: 'M0 0 L8 4 L0 8 z', fill: 'rgba(216,208,197,.7)' }));
    defs.appendChild(pat); defs.appendChild(mk); svg.appendChild(defs);
    svg.appendChild(sv('rect', { x: 0, y: 0, width: 600, height: 300, fill: 'url(#fg-' + key + ')' }));
    f.lanes.forEach(function (name, i) {
      svg.appendChild(sv('rect', { x: 0, y: 40 + i * 80, width: 600, height: 80, fill: 'none', stroke: 'rgba(216,208,197,.10)' }));
      svg.appendChild(sv('text', { x: 10, y: 83 + i * 80, 'font-size': 8.5, 'letter-spacing': 1.4, fill: 'rgba(216,208,197,.42)' }, name));
    });
    svg.appendChild(sv('line', { x1: 78, y1: 40, x2: 78, y2: 280, stroke: 'rgba(216,208,197,.10)' }));
    var edges = EDGES.map(function (d) {
      var e = sv('path', { d: d, class: 'fe', 'marker-end': 'url(#fa-' + key + ')' });
      svg.appendChild(e); return e;
    });
    f.edgeLabels.forEach(function (l) {
      svg.appendChild(sv('text', { x: l[0], y: l[1], 'font-size': 8, fill: 'rgba(216,208,197,.5)', 'text-anchor': 'middle' }, l[2]));
    });
    var loop = sv('path', { d: f.loop[0], class: 'fl', 'marker-end': 'url(#fa-' + key + ')' });
    svg.appendChild(loop);
    svg.appendChild(sv('text', { x: f.loop[1], y: f.loop[2], 'font-size': 8, fill: 'rgba(224,104,94,.8)', 'text-anchor': 'middle' }, f.loop[3]));
    var dot = sv('circle', { cx: 135, cy: 102, r: 4, fill: '#d8d0c5', opacity: 0 });
    svg.appendChild(dot);
    var tag = key === 'agent' ? 'A' : 'M';
    var nodes = f.nodes.map(function (n, i) {
      var g = sv('g', { class: 'fn' + (i === 3 ? ' gate' : '') + (i === 4 ? ' ship' : '') });
      var cx, top;
      if (i === 3) {
        g.appendChild(sv('path', { d: 'M450 206 L508 240 L450 274 L392 240 Z' }));
        g.appendChild(sv('text', { x: 450, y: 238, 'font-size': 8.5, 'text-anchor': 'middle', class: 'nt' }, n[0]));
        g.appendChild(sv('text', { x: 450, y: 249, 'font-size': 7.5, 'text-anchor': 'middle', fill: 'rgba(216,208,197,.5)' }, n[1]));
        g.appendChild(sv('text', { x: 392, y: 204, 'font-size': 7, fill: 'rgba(216,208,197,.35)' }, tag + '4'));
      } else {
        var b = NODES[i];
        var r = sv('rect', { x: b[0], y: b[1], width: b[2], height: b[3], rx: 2 });
        if (key === 'manual' && i === 1) r.setAttribute('stroke-dasharray', '3 2');
        g.appendChild(r);
        cx = b[0] + 46; top = b[1];
        g.appendChild(sv('text', { x: cx, y: top + 17, 'font-size': 9, 'text-anchor': 'middle', class: 'nt' }, n[0]));
        g.appendChild(sv('text', { x: cx, y: top + 31, 'font-size': 7.5, 'text-anchor': 'middle', fill: 'rgba(216,208,197,.5)' }, n[1]));
        g.appendChild(sv('text', { x: b[0], y: top - 4, 'font-size': 7, fill: 'rgba(216,208,197,.35)' }, tag + (i + 1)));
      }
      svg.appendChild(g); return g;
    });
    return { key: key, f: f, nodes: nodes, edges: edges, loop: loop, dot: dot, state: $('[data-state]', host), loopPath: parsePath(f.loop[0]) };
  }
  var flows = ['agent', 'manual'].map(buildFlow);

  function paintFlows(ft) {
    flows.forEach(function (fl) {
      var st = fl.f.script[ft] || [4];
      var cur = st[0], red = !!st[2];
      fl.nodes.forEach(function (g, i) {
        var cls = 'fn' + (i === 3 ? ' gate' : '') + (i === 4 ? ' ship' : '');
        if (i === cur) cls += ' on' + (i === 3 ? (red ? ' red' : ' ok') : '');
        else if (i < cur) cls += ' past';
        g.setAttribute('class', cls);
      });
      fl.edges.forEach(function (e, i) { e.setAttribute('class', 'fe' + (i < cur ? ' lit' : '')); });
      fl.loop.setAttribute('class', 'fl' + (red ? ' red' : ''));
      fl.state.textContent = red ? 'TESTS RED \u2192 BACK TO ' + fl.f.back : cur === 4 ? 'MERGED ON GREEN' : cur === 3 ? 'TESTS GREEN' : 'RUNNING\u2026';
      fl.state.style.color = red ? '#e0685e' : cur === 4 ? '#b3a0d6' : cur === 3 ? '#41d183' : 'rgba(216,208,197,.42)';
    });
  }

  var FLOW_TICK = 750, flowT = 0, flowStart = 0;
  if (reduce) {
    paintFlows(7);
  } else {
    paintFlows(0);
    flowStart = performance.now();
    setInterval(function () {
      flowT = (flowT + 1) % 10;
      flowStart = performance.now();
      paintFlows(flowT);
    }, FLOW_TICK);
    (function ride() {
      var p = Math.min(1, (performance.now() - flowStart) / 700);
      flows.forEach(function (fl) {
        var st = fl.f.script[flowT] || [4], e = st[1];
        if (e === undefined) { fl.dot.setAttribute('opacity', 0); return; }
        var path = e === 'L' ? fl.loopPath : edgePaths[e], xy = pointAt(path, p);
        fl.dot.setAttribute('cx', xy[0]);
        fl.dot.setAttribute('cy', xy[1]);
        fl.dot.setAttribute('opacity', p < .08 ? p / .08 : p > .92 ? (1 - p) / .08 : 1);
        fl.dot.setAttribute('fill', e === 'L' ? '#e0685e' : e === 3 ? '#41d183' : '#d8d0c5');
      });
      requestAnimationFrame(ride);
    })();
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

  // themes: tabs recolour the section; auto-cycles only while in view, until the visitor picks one
  (function themes() {
    var sec = $('#themes');
    if (!sec) return;
    var tabs = $$('.t-tab', sec), panels = $$('.t-panel', sec);
    var picked = false, inView = false, cur = 0, timer = null;
    var blobs = [
      { el: $('#blob-a path'), seg: 2200, off: 0 },
      { el: $('#blob-b path'), seg: 1700, off: 3400 },
      { el: $('#blob-c path'), seg: 2600, off: 5200 },
      { el: $('#blob-d path'), seg: 1400, off: 2100 }
    ];
    var t0 = 0, raf = 0, elapsed = 0;

    // same shapes and easing as the haro agent loader: circle, 4-lobe flower, squircle star,
    // rounded triangle, superellipse, each morphing into the next with a quarter turn
    var N = 96, TAU = Math.PI * 2;
    var SHAPES = [
      function () { return 1; },
      function (th) { return 1.08 * (0.6 + 0.4 * Math.pow((1 + Math.cos(4 * th)) / 2, 2.6)); },
      function (th) { return 0.84 - 0.16 * Math.cos(4 * th); },
      function (th) { return 0.86 + 0.14 * Math.cos(3 * th - Math.PI / 2); },
      function (th) { return 0.94 * Math.pow(Math.pow(Math.abs(Math.cos(th)), 4) + Math.pow(Math.abs(Math.sin(th)), 4), -0.25); }
    ];
    var RADII = SHAPES.map(function (f) {
      var r = [];
      for (var i = 0; i < N; i++) r.push(f(i / N * TAU));
      return r;
    });
    function bez(x1, y1, x2, y2) {
      return function (x) {
        var lo = 0, hi = 1, t = x;
        for (var k = 0; k < 22; k++) {
          t = (lo + hi) / 2;
          var cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
          if (cx < x) lo = t; else hi = t;
        }
        return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
      };
    }
    var EMPH = bez(0.2, 0, 0, 1), HOLD = 0.22;
    function f4(n) { return n.toFixed(4); }
    function shapeAt(ms, SEG) {
      var n = SHAPES.length, seg = Math.floor(ms / SEG), f = (ms % SEG) / SEG;
      var i = seg % n, j = (i + 1) % n;
      var m = f < HOLD ? 0 : (f - HOLD) / (1 - HOLD), e = EMPH(m);
      var rot = (seg + e) * Math.PI / 2, sc = 1 - 0.1 * Math.sin(Math.PI * Math.min(1, m * 1.15));
      var p = [];
      for (var k = 0; k < N; k++) {
        var r = RADII[i][k] + (RADII[j][k] - RADII[i][k]) * e, th = k / N * TAU + rot;
        p.push([Math.cos(th) * r * sc, Math.sin(th) * r * sc]);
      }
      var d = 'M' + f4(p[0][0]) + ' ' + f4(p[0][1]);
      for (var q = 0; q < N; q++) {
        var p0 = p[(q - 1 + N) % N], p1 = p[q], p2 = p[(q + 1) % N], p3 = p[(q + 2) % N];
        d += 'C' + f4(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f4(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
          f4(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f4(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f4(p2[0]) + ' ' + f4(p2[1]);
      }
      return d + 'Z';
    }
    function tick(now) {
      var t = now - t0;
      blobs.forEach(function (b) { b.el.setAttribute('d', shapeAt(b.off + t, b.seg)); });
      raf = requestAnimationFrame(tick);
    }

    function select(i, focus) {
      cur = i;
      sec.dataset.theme = tabs[i].dataset.theme;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      if (focus) tabs[i].focus();
      morph();
    }

    function morph() {
      var run = !reduce && inView && cur === 1;
      if (run && !raf) {
        t0 = performance.now() - elapsed;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        elapsed = performance.now() - t0;
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { picked = true; select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + n - 1) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to < 0) return;
        e.preventDefault();
        picked = true;
        select(to, true);
      });
    });

    blobs.forEach(function (b) { b.el.setAttribute('d', shapeAt(b.off, b.seg)); });

    if (!reduce) {
      timer = setInterval(function () {
        if (picked || !inView || sec.contains(document.activeElement)) return;
        select((cur + 1) % tabs.length);
      }, 5200);
    }

    // hidden panels do not trigger their web fonts, and a late font would re-wrap their text
    function loadFonts() {
      if (!document.fonts || !document.fonts.load) return;
      ['500 16px "Roboto Flex"', '800 16px "Roboto Flex"', '400 12px "Roboto Mono"', '500 16px Geist', '600 16px Geist', '400 12px "Geist Mono"'].forEach(function (f) { document.fonts.load(f); });
    }
    if ('IntersectionObserver' in window) {
      var pre = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        loadFonts();
        pre.disconnect();
      }, { rootMargin: '1500px 0px' });
      pre.observe(sec);
    } else {
      loadFonts();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        morph();
      }, { threshold: 0.3 }).observe(sec);
    }
  })();

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
