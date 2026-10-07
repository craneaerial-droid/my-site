/* ==========================================================================
   CRANE AERIAL & 3D IMAGING — SITE BEHAVIOUR
   --------------------------------------------------------------------------
   Small on purpose. Five things:

     1  fill in whatever config.js actually provides, hide what it doesn't
     2  build the services list
     3  the single reveal system
     4  the footage: lazy, size-aware, paused when nobody is looking
     5  the one submission path every form on the site uses

   No framework, no dependencies, nothing loaded from a CDN but the typeface.
   ========================================================================== */
(function () {
  'use strict';

  var C  = window.CRANE;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* a value is a placeholder if it is empty or starts with '[' */
  function blank(v) { return !v || (typeof v === 'string' && v.trim().charAt(0) === '['); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------ 1. facts */
  function facts() {
    var y = $('[data-site="year"]');
    if (y) y.textContent = new Date().getFullYear();

    $$('[data-site="name"]').forEach(function (e) { e.textContent = C.SITE.name; });
    $$('[data-site="legalName"]').forEach(function (e) { e.textContent = C.SITE.legalName; });
    /* Service area is wording, not a fixed place — it lives in config so the
       travel terms are changed in one spot rather than hunted through markup. */
    $$('[data-site="areaShort"]').forEach(function (e) { e.textContent = C.SITE.areaShort; });
    $$('[data-site="areaLong"]').forEach(function (e) { e.textContent = C.SITE.areaLong; });

    if (!blank(C.SITE.phone)) {
      var p = $('[data-site="phoneLink"]');
      if (p) {
        p.textContent = C.SITE.phone;
        p.href = 'tel:' + (blank(C.SITE.phoneHref) ? C.SITE.phone : C.SITE.phoneHref).replace(/[^0-9+]/g, '');
        $('[data-fact="phone"]').hidden = false;
      }
    }
    if (!blank(C.SITE.email)) {
      var e = $('[data-site="emailLink"]');
      if (e) {
        e.textContent = C.SITE.email;
        e.href = 'mailto:' + C.SITE.email;
        $('[data-fact="email"]').hidden = false;
      }
    }

    /* the contact form's project-type list comes from the same service data */
    var sel = $('#c-type');
    if (sel) {
      sel.innerHTML = '<option value="">Select one</option>' +
        C.SERVICES.map(function (s) {
          return '<option value="' + esc(s.name) + '">' + esc(s.name) + '</option>';
        }).join('') +
        '<option value="Custom project">Custom project</option>' +
        '<option value="Not sure yet">Not sure yet</option>';
    }
  }

  /* --------------------------------------------------------- 2. services */
  function services() {
    var list = $('#svc-list');
    if (!list) return;

    list.innerHTML = C.SERVICES.map(function (s, i) {
      var n = String(i + 1);
      var items = (s.items || []).map(function (x) {
        return '<li>' + esc(x) + '</li>';
      }).join('');
      return '<div class="svc__row" data-r>' +
               '<span class="num svc__n">' + (n.length < 2 ? '0' + n : n) + '</span>' +
               '<h3 class="svc__name">' + esc(s.name) + '</h3>' +
               '<div>' +
                 '<p class="svc__line">' + esc(s.line) + '</p>' +
                 (items ? '<ul class="svc__list">' + items + '</ul>' : '') +
               '</div>' +
             '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------- 3. reveals */
  /* Opacity and a small rise. That is the entire animation vocabulary.

     The order below matters: the hidden state is applied by [data-armed],
     and that attribute is only set AFTER both the observer and the failsafe
     timer exist. If the observer never fires — inside an unusual iframe,
     say — the timer reveals everything anyway. Content cannot get stuck
     invisible, which is the one failure mode worth engineering against.   */
  function reveals() {
    var items = $$('[data-r]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) return;   /* unarmed = visible */

    $$('.stagger').forEach(function (g) {
      $$(':scope > *', g).forEach(function (c, i) { c.style.setProperty('--i', i); });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    var timer = setTimeout(function () {
      items.forEach(function (el) { el.classList.add('on'); });
    }, 2600);

    items.forEach(function (el) {
      el.setAttribute('data-armed', '');
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) el.classList.add('on');
      else io.observe(el);
    });

    window.addEventListener('pagehide', function () { clearTimeout(timer); });
  }

  /* -------------------------------------------------------------- 4. film */
  /* The footage is load-bearing, so it has to behave.

     Nothing downloads until the section is near the viewport, the small
     encode is used on small viewports, and a clip that is not on screen
     (or in a hidden tab) is paused rather than burning battery. Under
     prefers-reduced-motion nothing loads at all — the poster still is the
     section's ground instead, which is why every <video> carries one.    */
  function film() {
    var vids = $$('video[data-clip]');
    if (!vids.length) return;

    var small = window.matchMedia('(max-width: 900px)').matches;

    /* THE HERO RESOLUTION LADDER.

       The hero is full-bleed with object-fit:cover over a 2.418:1 clip, so the
       source width it actually needs is not the viewport width — it is
         max(viewport width, viewport height x 2.418) x devicePixelRatio
       which on a 1440x900 window is 2176, and on the same window at 2x is
       4353. A single 1920 encode is therefore scaled UP on nearly every
       desktop, which is what soft footage looks like.

       So: laptops and up take 2560, and the same screens at 2x or better take
       4352. Phones take a different encode entirely — a PORTRAIT crop of the
       skyline, because cover-fitting a 2.418:1 clip into a phone-shaped box
       both upscales it four times over and lands the crop on the emptiest
       part of the sky. Measured by /tmp/build/media.py.                      */
    var wide   = window.matchMedia('(min-width: 1000px)').matches;
    var retina = window.matchMedia('(min-width: 1000px) and (min-resolution: 2dppx)').matches;

    /* The phone encode is a different SHAPE, so the landscape poster would show
       the wrong framing. Swapped here rather than inside load(), because under
       prefers-reduced-motion nothing loads and the poster IS the hero. */
    if (small) vids.forEach(function (v) {
      if (v.dataset.clipSm && v.dataset.posterSm) v.poster = v.dataset.posterSm;
    });

    /* Two encodes of every clip. WebM/VP9 is smaller and is what Chrome,
       Firefox, Edge and Android take; MP4/H.264 is there for Safari and iOS,
       which do not decode VP9 reliably. The browser picks — we never sniff. */
    function load(v) {
      if (v.dataset.loaded) return;
      /* Some clips are decorative rather than structural. On a phone those
         stay as the poster still: same picture, none of the bytes. */
      if (small && v.hasAttribute('data-still-sm')) { v.dataset.loaded = 'still'; return; }
      v.dataset.loaded = '1';
      var name = v.dataset.clip;
      if (small && v.dataset.clipSm)         name = v.dataset.clipSm;
      else if (retina && v.dataset.clipXl)   name = v.dataset.clipXl;
      else if (wide && v.dataset.clipLg)     name = v.dataset.clipLg;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (t) {
        var s = document.createElement('source');
        s.src  = name + '.' + t[0];
        s.type = t[1];
        v.appendChild(s);
      });
      v.load();
    }

    if (reduced) return;                    /* posters only — nothing fetched */

    if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }

    /* load a little before it is needed, then play only while it is seen */
    var loader = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { load(e.target); loader.unobserve(e.target); }
      });
    }, { rootMargin: '400px 0px' });

    var player = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !document.hidden) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});   /* autoplay refused: poster stays */
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.01 });

    vids.forEach(function (v) { loader.observe(v); player.observe(v); });

    document.addEventListener('visibilitychange', function () {
      vids.forEach(function (v) {
        if (document.hidden) v.pause();
        else if (v.dataset.loaded && v.getBoundingClientRect().bottom > 0 &&
                 v.getBoundingClientRect().top < window.innerHeight) {
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        }
      });
    });
  }

  /* -------------------------------------------------------------- 5. nav */
  function nav() {
    var bar = $('#nav'), hero = $('#top');
    if (!bar || !hero) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        bar.setAttribute('data-solid', es[0].isIntersecting ? 'false' : 'true');
      }, { rootMargin: '-88px 0px 0px 0px', threshold: 0 }).observe(hero);
    } else {
      bar.setAttribute('data-solid', 'true');
    }
  }

  /* ------------------------------------------------- the submission path */
  /* One rule: the site never says a message was sent unless it was.

     With no endpoint configured, or if the request fails, the visitor is
     told plainly and handed their own details back — copyable, and mailable
     if an address has been filled in. Nothing is silently dropped.        */
  function outcome(host, state, data, err) {
    var lines = Object.keys(data).map(function (k) {
      return k.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }) +
             ': ' + data[k];
    }).join('\n');

    if (state === 'sent') {
      host.innerHTML =
        '<div class="notice" role="status">' +
          '<h3 class="notice__h">Request sent.</h3>' +
          '<p class="dim">Thank you &mdash; we have your details and will be in touch. ' +
          'Nothing further is needed from you right now.</p>' +
        '</div>';
      return;
    }

    var why = state === 'unconfigured'
      ? 'This site does not have a form address connected yet, so <strong>nothing was sent</strong>.'
      : 'The message could not be delivered, so <strong>nothing was sent</strong>.' +
        (err ? ' <span class="dim">(' + esc(err) + ')</span>' : '');

    var mail = '';
    if (!blank(C.SITE.email)) {
      mail = '<a class="btn" href="mailto:' + esc(C.SITE.email) +
             '?subject=' + encodeURIComponent(C.SITE.name + ' — enquiry') +
             '&body=' + encodeURIComponent(lines) + '"><span>Email it instead</span></a>';
    }

    host.innerHTML =
      '<div class="notice" role="alert">' +
        '<h3 class="notice__h">Not sent</h3>' +
        '<p class="dim">' + why + ' Your details are below &mdash; copy them, or send them across another way.</p>' +
        '<pre>' + esc(lines) + '</pre>' +
        '<div class="btn-row">' +
          '<button class="btn" type="button" data-copy><span>Copy details</span></button>' + mail +
        '</div>' +
      '</div>';

    var btn = host.querySelector('[data-copy]');
    if (btn) btn.addEventListener('click', function () {
      var done = function () { btn.querySelector('span').textContent = 'Copied'; };
      if (navigator.clipboard) navigator.clipboard.writeText(lines).then(done, function () {});
      else {
        var t = document.createElement('textarea');
        t.value = lines; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(t);
      }
    });
  }

  function submit(form, host, extra, label) {
    var data = {};
    $$('input, select, textarea', form).forEach(function (f) {
      if (f.name && f.value) data[f.name] = f.value.trim();
    });
    if (extra) Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });

    if (blank(C.FORMS.endpoint)) { outcome(host, 'unconfigured', data); return; }

    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Sending'; }

    fetch(C.FORMS.endpoint, {
      method: C.FORMS.method || 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('server responded ' + r.status);
      outcome(host, 'sent', data);
      form.reset();
    }).catch(function (e) {
      outcome(host, 'failed', data, e.message);
    }).then(function () {
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = label || 'Request a quote'; }
    });
  }

  /* validation — visible, announced, and never blocking silently */
  function validate(form) {
    var bad = null;
    $$('[required]', form).forEach(function (f) {
      var wrap = f.closest('.field') || f.closest('label') || f.parentNode;
      var old = wrap && wrap.querySelector && wrap.querySelector('.err');
      if (old) old.remove();
      f.removeAttribute('aria-invalid');

      /* A checkbox reports value "on" whether or not it is ticked, so the
         plain empty-value test passes it every time. The scope agreement is
         a checkbox, and it has to actually be agreed to. */
      var isCheck = f.type === 'checkbox';
      var empty = isCheck ? !f.checked : !f.value.trim();
      var badEmail = !isCheck && f.type === 'email' && f.value &&
                     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value);
      if (!empty && !badEmail) return;

      f.setAttribute('aria-invalid', 'true');
      var host = wrap || f.closest('label') || f.parentNode;
      if (host) {
        var old2 = host.querySelector && host.querySelector('.err');
        if (old2) old2.remove();
        var m = document.createElement('p');
        m.className = 'err';
        m.textContent = empty
          ? (isCheck ? 'Please confirm you agree to the scope above.' : 'This one is needed.')
          : 'That email address does not look right.';
        host.appendChild(m);
      }
      if (!bad) bad = f;
    });
    if (bad) bad.focus();
    return !bad;
  }

  function contactForm() {
    var form = $('#contact-form'), host = $('#contact-out');
    if (!form || !host) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      host.innerHTML = '';
      if (!validate(form)) return;
      submit(form, host);
    });
  }

  /* shared with quote.js */
  window.CRANE_UTIL = {
    $: $, $$: $$, esc: esc, blank: blank,
    submit: submit, validate: validate, outcome: outcome, reduced: reduced
  };

  function boot() { facts(); services(); film(); nav(); reveals(); contactForm(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

