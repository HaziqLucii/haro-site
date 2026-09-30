(function () {
  var live = document.getElementById('live');
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var idle = btn.textContent;
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.getAttribute('data-copy')).textContent.trim();
      copy(text).then(function (ok) {
        var msg = ok ? 'Copied' : 'Copy failed, select the command and copy it by hand';
        btn.textContent = ok ? 'Copied' : 'Copy failed';
        live.textContent = '';
        setTimeout(function () { live.textContent = msg; }, 30);
        setTimeout(function () { btn.textContent = idle; live.textContent = ''; }, 2200);
      });
    });
  });
})();
