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

    /* The three metros, from config. One list, one source of truth. */
    var metros = $('#metro-list');
    if (metros && C.SITE.metros) {
      metros.innerHTML = C.SITE.metros.map(function (m) {
        var bits = m.split(',');
        return '<li><b>' + esc(bits[0]) + '</b>' +
               (bits[1] ? '<span>' + esc(bits[1].trim()) + '</span>' : '') + '</li>';
      }).join('');
    }

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
  /* Drawn figures, one per service, keyed by SERVICES[].id.

     These are diagrams, not decoration and not photography. Each one shows
     the thing the sentence next to it is describing — where the camera is,
     and what it is looking at. Line art in currentColor so it inherits the
     section's ink and needs no second colour; no files, so nothing to load
     and nothing to 404. A service id with no entry here simply renders
     without a figure. */
  var SVC_ART = {
    /* Camera above the subject, looking down. */
    aerial:
      '<path d="M82 26h36"/>' +
      '<circle cx="82" cy="26" r="7"/><circle cx="118" cy="26" r="7"/>' +
      '<rect x="92" y="21.5" width="16" height="9" rx="2"/>' +
      '<path d="M96 30.5l-3 5M104 30.5l3 5"/>' +
      '<path d="M100 36L42 94M100 36l58 58" stroke-dasharray="3 4" opacity=".5"/>' +
      '<path d="M16 94h168"/>' +
      '<path d="M78 94V68h30v26M86 94V78h14v16"/>',

    /* The gridded flight itself, seen from above: corner brackets for the
       site, and the boustrophedon the drone actually flies across it.
       Drawn in plan rather than perspective — a first attempt in
       perspective read as a stack of bars, not as lines over an area. */
    imaging:
      '<path d="M24 36V22h16M160 22h16v14M176 84v14h-16M40 98H24V84" opacity=".5"/>' +
      '<path d="M44 40H156V58H44V76H156"/>' +
      '<circle cx="44" cy="40" r="2.6" fill="currentColor" stroke="none"/>' +
      '<circle cx="156" cy="76" r="2.6" fill="currentColor" stroke="none"/>',

    /* The same subject, camera on the ground — the contrast is the point. */
    ground:
      '<path d="M16 94h168"/>' +
      '<rect x="34" y="52" width="26" height="16" rx="2"/>' +
      '<circle cx="47" cy="60" r="5"/>' +
      '<path d="M47 68l-11 26M47 68l11 26M47 68v26"/>' +
      '<path d="M64 60h82" stroke-dasharray="3 4" opacity=".5"/>' +
      '<path d="M150 94V60h26v34M158 94V70h10v24"/>'
  };

  function art(id) {
    var d = SVC_ART[id];
    if (!d) return '';
    return '<svg class="svc__art" viewBox="0 0 200 120" fill="none" ' +
           'stroke="currentColor" stroke-width="1.3" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
           d + '</svg>';
  }

  function services() {
    var list = $('#svc-list');
    if (!list) return;

    /* A primary service gets the full treatment: the line, the chips, and the
       three "who it is for" rows. The secondary one gets the line and chips
       only, which is how the layout keeps ground photography from competing
       with the two services the business actually leads with. */
    list.innerHTML = C.SERVICES.map(function (s, i) {
      var n = String(i + 1);
      var primary = s.rank === 'primary';

      var items = (s.items || []).map(function (x) {
        return '<li>' + esc(x) + '</li>';
      }).join('');

      var who = (s['for'] || []).map(function (f) {
        return '<div class="who__row">' +
                 '<b>' + esc(f[0]) + '</b>' +
                 '<span>' + esc(f[1]) + '</span>' +
               '</div>';
      }).join('');

      return '<article class="svc__row' + (primary ? ' svc__row--primary' : '') +
               '" id="svc-' + esc(s.id) + '" data-r>' +
               '<span class="num svc__n">' + (n.length < 2 ? '0' + n : n) + '</span>' +
               '<div class="svc__head">' +
                 art(s.id) +
                 '<h3 class="svc__name">' + esc(s.name) + '</h3>' +
                 (items ? '<ul class="svc__list">' + items + '</ul>' : '') +
               '</div>' +
               '<div class="svc__body">' +
                 '<p class="svc__line">' + esc(s.line) + '</p>' +
                 (who ? '<div class="who">' + who + '</div>' : '') +
                 (s.caveat ? '<p class="caveat">' + esc(s.caveat) + '</p>' : '') +
                 '<p class="svc__cta"><a href="#quote">Build an estimate</a>' +
                 '<a href="#contact">or just ask</a></p>' +
               '</div>' +
             '</article>';
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

