/* ==========================================================================
   CRANE AERIAL & 3D IMAGING — QUOTE CALCULATOR AND BOOKING
   --------------------------------------------------------------------------
   Six steps: project type, service, size, add-ons, delivery, estimate.

   Every figure comes from PRICING in config.js. The maths is additive, so
   each answer moves the number by an amount a customer can follow, and the
   running total updates the moment anything is selected.

   The calculator refuses combinations we would have to walk back — the
   services offered in step 2 depend on the project type chosen in step 1,
   and the add-ons in step 4 depend on the service. Changing an earlier
   answer clears any later answer it invalidates.

   From the estimate there are two ways forward — request the quote, or
   schedule a project — and every selection carries into whichever is
   chosen. Both post through the site's one honest submission path: if
   there is no endpoint configured, the visitor is told plainly that
   nothing was sent. No form on this site ever fakes a success.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CRANE, U = window.CRANE_UTIL;
  var host = document.getElementById('calc');
  if (!host || !C || !U) return;

  var P = C.PRICING, esc = U.esc;

  var state = {
    step: 0, type: null, service: null, size: null,
    addons: [], delivery: 'standard', mode: null   /* mode: 'quote' | 'book' */
  };

  var TOTAL_STEPS = 6;

  /* ------------------------------------------------------------ lookups */
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function nameOf(list, id) { var f = find(list, id); return f ? f.name : ''; }

  function servicesFor(typeId) {
    var allow = P.servicesFor[typeId] || P.servicesFor.other;
    return P.services.filter(function (s) { return allow.indexOf(s.id) > -1; });
  }

  /* An add-on is only offered when it genuinely applies: never something the
     chosen package already contains, and never something it cannot support.
     This is what stops a customer paying twice for the same thing.        */
  function addonsFor(serviceId) {
    var svc = find(P.services, serviceId);
    return P.addons.filter(function (a) {
      if (a.hideIf3d   && svc && svc.has3d)   return false;  /* mapping already in */
      if (a.hideIfWalk && svc && svc.hasWalk) return false;  /* walkthrough already in */
      if (a.needs3d    && !(svc && svc.has3d)) return false; /* needs a mapping flight */
      if (a.needs && a.needs.indexOf(serviceId) === -1) return false;
      return true;
    });
  }

  function money(n) { return P.symbol + Math.round(n).toLocaleString('en-US'); }

  /* ---------------------------------------------------------- the maths */
  function total() {
    var svc = find(P.services, state.service);
    if (!svc) return null;

    var p = svc.base;
    var t = find(P.types, state.type);   if (t) p += t.add;
    var z = find(P.sizes, state.size);   if (z) p += z.add;
    var d = find(P.delivery, state.delivery); if (d) p += d.add;

    state.addons.forEach(function (id) {
      var a = find(P.addons, id);
      if (a) p += a.add;
    });

    p = Math.max(P.MINIMUM, p);
    return Math.round(p / P.STEP) * P.STEP;
  }

  /* what the customer receives, including anything an add-on adds */
  function included() {
    var svc = find(P.services, state.service);
    var list = svc ? svc.includes.slice() : [];
    state.addons.forEach(function (id) {
      var a = find(P.addons, id);
      if (!a) return;
      if (a.id === 'add3d') list.push('A 3D visual model and an overhead map of the area flown');
      if (a.id === 'extraphotos') list.push('An expanded set of edited photographs');
      if (a.id === 'rawfiles') list.push('Every usable frame from the flight, unedited');
      if (a.id === 'location') list.push('A second property or location flown the same day');
      if (a.id === 'flighttime') list.push('Additional time on site');
    });
    return list;
  }

  /* clearing later answers that an earlier change has invalidated */
  function reconcile() {
    if (state.type && state.service) {
      var allowed = servicesFor(state.type).map(function (s) { return s.id; });
      if (allowed.indexOf(state.service) === -1) state.service = null;
    }
    if (state.service) {
      var ok = addonsFor(state.service).map(function (a) { return a.id; });
      state.addons = state.addons.filter(function (id) { return ok.indexOf(id) > -1; });
    } else {
      state.addons = [];
    }
  }

  /* ------------------------------------------------------------- steps */
  var STEPS = [
    { legend: 'Project type', title: 'What kind of project is it?',
      body: function () {
        return opts(P.types.map(function (t) {
          return { id: t.id, name: t.name, on: state.type === t.id };
        }), 'type');
      },
      ready: function () { return !!state.type; } },

    { legend: 'Service', title: 'What do you need us to capture?',
      hint: 'Only the options that suit this kind of project are shown.',
      body: function () {
        return opts(servicesFor(state.type).map(function (s) {
          return { id: s.id, name: s.name, on: state.service === s.id,
                   line: 'From ' + money(s.base) };
        }), 'service');
      },
      ready: function () { return !!state.service; } },

    { legend: 'Project size', title: 'Roughly how big is it?',
      body: function () {
        return opts(P.sizes.map(function (z) {
          return { id: z.id, name: z.name, line: z.line, on: state.size === z.id };
        }), 'size');
      },
      ready: function () { return !!state.size; } },

    { legend: 'Add-ons', title: 'Anything to add?',
      hint: 'Optional. Only extras that apply to your chosen service are listed.',
      body: function () {
        var list = addonsFor(state.service);
        if (!list.length) return '<p class="dim">Nothing to add for this package — everything is already included.</p>';
        return opts(list.map(function (a) {
          return { id: a.id, name: a.name, line: a.line + '  ·  +' + money(a.add),
                   on: state.addons.indexOf(a.id) > -1 };
        }), 'addons', true);
      },
      ready: function () { return true; } },

    { legend: 'Delivery', title: 'How soon do you need the files?',
      body: function () {
        return opts(P.delivery.map(function (d) {
          return { id: d.id, name: d.name, line: d.line + (d.add ? '  ·  +' + money(d.add) : ''),
                   on: state.delivery === d.id };
        }), 'delivery');
      },
      ready: function () { return !!state.delivery; } }
  ];

  function opts(items, key, multi) {
    return '<div class="opts" role="group">' + items.map(function (o) {
      return '<button type="button" class="opt" data-key="' + key + '"' +
             ' data-id="' + esc(o.id) + '" data-multi="' + (multi ? 'true' : 'false') + '"' +
             ' aria-pressed="' + (o.on ? 'true' : 'false') + '">' +
               '<b>' + esc(o.name) + '</b>' +
               (o.line ? '<small>' + esc(o.line) + '</small>' : '') +
             '</button>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------ render */
  function bar() {
    var out = '<div class="calc__bar" aria-hidden="true">';
    for (var i = 0; i < TOTAL_STEPS; i++) {
      out += '<i data-done="' + (i <= state.step ? 'true' : 'false') + '"></i>';
    }
    return out + '</div>';
  }

  /* the running total, shown from the moment a service is chosen */
  function ticker() {
    var t = total();
    if (t === null) return '';
    return '<div class="calc__run" aria-live="polite">' +
             '<span class="label">Estimate so far</span>' +
             '<span class="calc__run-fig">' + money(t) + '</span>' +
           '</div>';
  }

  function render(focus) {
    reconcile();

    if (state.step >= STEPS.length) { renderEstimate(focus); return; }

    var s = STEPS[state.step];
    host.innerHTML =
      '<div class="calc">' + bar() +
        '<fieldset class="calc__step">' +
          '<legend class="sr">' + esc(s.legend) + '</legend>' +
          '<div class="calc__q">' +
            '<p class="label">Step ' + (state.step + 1) + ' of ' + TOTAL_STEPS + '</p>' +
            '<h3 class="h3" id="calc-title" tabindex="-1">' + esc(s.title) + '</h3>' +
            (s.hint ? '<p class="dim" style="font-size:.92rem">' + esc(s.hint) + '</p>' : '') +
          '</div>' +
          s.body() +
          ticker() +
          '<div class="calc__nav">' +
            '<button type="button" class="btn" data-back' + (state.step === 0 ? ' disabled' : '') + '><span>Back</span></button>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn btn--solid" data-next' + (s.ready() ? '' : ' disabled') + '>' +
              '<span>' + (state.step === STEPS.length - 1 ? 'See estimate' : 'Continue') + '</span></button>' +
          '</div>' +
        '</fieldset>' +
      '</div>';

    wireSteps();
    if (focus) focusTitle();
  }

  function focusTitle() {
    var t = document.getElementById('calc-title');
    if (t) t.focus({ preventScroll: true });
  }

  function summaryRows() {
    var addonNames = state.addons.map(function (id) { return nameOf(P.addons, id); }).filter(Boolean);
    return [
      ['Service',      nameOf(P.services, state.service)],
      ['Project type', nameOf(P.types, state.type)],
      ['Project size', nameOf(P.sizes, state.size)],
      ['Add-ons',      addonNames.length ? addonNames.join(', ') : 'None'],
      ['Delivery',     nameOf(P.delivery, state.delivery)]
    ];
  }

  function renderEstimate(focus) {
    var t = total();

    host.innerHTML =
      '<div class="calc">' + bar() +
        '<div class="est">' +
          '<p class="label">Estimated project price</p>' +
          '<p class="est__fig" id="calc-title" tabindex="-1">' + money(t) +
            ' <span class="est__from">starting</span></p>' +

          '<div class="est__grid">' +
            '<div class="est__recap">' +
              summaryRows().map(function (r) {
                return '<div><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>';
              }).join('') +
            '</div>' +
            '<div class="est__inc">' +
              '<p class="label">What is included</p>' +
              '<ul>' + included().map(function (i) {
                return '<li>' + esc(i) + '</li>';
              }).join('') + '</ul>' +
            '</div>' +
          '</div>' +

          /* Travel is named here rather than buried, and named as an ADDITION.
             A figure that quietly assumed a short drive would be the kind of
             surprise this whole calculator exists to avoid. */
          '<p class="est__note">This is a starting estimate, not a final quote. ' +
            'It covers the flying and the files, and <strong>does not include travel</strong> — ' +
            'past a short drive from our base that is charged on top, and quoted with the job. ' +
            'Airspace restrictions, weather, site complexity and whatever else turns up ' +
            'once we know the property can move it too. Nothing is scheduled until the ' +
            'price is confirmed in writing.</p>' +

          '<div class="calc__nav">' +
            '<button type="button" class="btn" data-back><span>Back</span></button>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn" data-mode="book"><span>Schedule a project</span></button>' +
            '<button type="button" class="btn btn--solid" data-mode="quote"><span>Request this quote</span></button>' +
          '</div>' +

          '<div id="calc-form"></div>' +
        '</div>' +
      '</div>';

    wireSteps();
    var back = host.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () { state.step--; render(true); });

    U.$$('[data-mode]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        state.mode = b.getAttribute('data-mode');
        renderForm();
      });
    });

    if (state.mode) renderForm();
    if (focus) focusTitle();
  }

  /* ------------------------------------------------- quote / booking form */
  function field(id, name, label, type, ac, req, ph) {
    return '<div class="field">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" name="' + name + '" type="' + type + '"' +
        (ac ? ' autocomplete="' + ac + '"' : '') +
        (ph ? ' placeholder="' + esc(ph) + '"' : '') +
        (req ? ' required' : '') + '>' +
    '</div>';
  }

  function select(id, name, label, options, req) {
    return '<div class="field">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<select id="' + id + '" name="' + name + '"' + (req ? ' required' : '') + '>' +
        '<option value="">Select one</option>' +
        options.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('') +
      '</select></div>';
  }

  /* ------------------------------------------- the Google Calendar path */
  /* If a Google Calendar appointment-schedule link is configured, the Book
     step shows the real thing: the customer sees the times actually free in
     that calendar, and picking one writes the event into it. Nothing here
     touches the calendar itself — Google does the whole exchange.

     With no link configured we do NOT pretend. The step falls back to the
     request form and says plainly that it is a request, not a confirmed
     appointment.                                                          */
  function schedulerReady() {
    return C.BOOKING && !U.blank(C.BOOKING.schedulerUrl);
  }

  /* EMBEDDING, AND THE ONE THING THAT CAN GO WRONG.

     The long appointment-schedule URL frames cleanly. A short
     calendar.app.google link is a redirect, and Google may refuse to be
     framed through it — in which case the customer would be looking at an
     empty box with no idea why.

     So: we attempt the embed either way, and we WATCH it. If the frame has
     not reported itself loaded shortly after it should have, the block
     replaces it with a plain explanation and the button. Nothing is left
     silently broken, and nothing pretends a calendar is there when it is
     not. The button is present the whole time regardless.               */
  function longForm(url) {
    return /calendar\.google\.com\/calendar\/appointments\/schedules\//.test(url);
  }

  function frameUrl(url) {
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'gv=true';
  }

  function schedulerBlock() {
    if (!schedulerReady()) return '';
    var url  = C.BOOKING.schedulerUrl;
    var h    = parseInt(C.BOOKING.embedHeight, 10) || 700;
    var inline = !!C.BOOKING.embed;

    var frame = inline
      ? '<div class="sched__frame" id="sched-frame" data-state="loading">' +
          '<iframe id="sched-iframe" src="' + esc(frameUrl(url)) + '" ' +
            'title="Choose a time in our calendar" ' +
            'style="height:' + h + 'px" loading="lazy" frameborder="0"></iframe>' +
          '<p class="sched__wait dim">Loading the calendar…</p>' +
        '</div>'
      : '';

    return '<div class="sched">' +
             '<p class="label">Book a time</p>' +
             '<h3 class="h3">Pick a slot from our calendar</h3>' +
             '<p class="dim" style="font-size:.94rem;max-width:56ch">' +
               'These are the times we are actually free. Choosing one books it ' +
               'straight away and Google sends you the confirmation.</p>' +
             frame +
             '<div class="btn-row" style="margin-top:var(--s3)">' +
               '<a class="btn btn--solid" href="' + esc(url) + '" target="_blank" rel="noopener">' +
                 '<span>' + (inline ? 'Open the calendar in a new tab'
                                    : 'Open the booking calendar') + '</span></a>' +
             '</div>' +
           '</div>';
  }

  /* Watch the frame. A cross-origin iframe fires `load` even when the page
     inside it refused to render, so `load` alone proves nothing — what we
     can do is give it a fair window and then check whether it ever reported
     loading at all. If it did not, say so plainly instead of leaving a
     silent empty box on the page.                                         */
  function watchScheduler() {
    var box = document.getElementById('sched-frame');
    var fr  = document.getElementById('sched-iframe');
    if (!box || !fr) return;

    var settled = false;
    function ok() {
      if (settled) return;
      settled = true;
      box.setAttribute('data-state', 'ready');
    }
    fr.addEventListener('load', ok);

    setTimeout(function () {
      if (settled) return;
      settled = true;
      box.setAttribute('data-state', 'blocked');
      box.innerHTML =
        '<p class="sched__note">The calendar could not be shown inside this ' +
        'page &mdash; Google does not allow every booking link to be embedded. ' +
        'Use the button below and it opens in a new tab, which works the same ' +
        'way.</p>';
    }, 6000);
  }

  /* An "add this to your calendar" link for the CUSTOMER — it puts a
     provisional hold in their own calendar. It is labelled as provisional,
     because a request is not a confirmed booking.                         */
  function holdLink(data) {
    var win = null;
    for (var i = 0; i < P.windows.length; i++) {
      if (P.windows[i].label === data.preferredTime) { win = P.windows[i]; break; }
    }
    if (!win || !data.preferredDate) return '';

    var d = data.preferredDate.replace(/-/g, '');
    var st = d + 'T' + win.start.replace(':', '') + '00';
    var en = d + 'T' + win.end.replace(':', '') + '00';

    var text = C.SITE.name + ' — ' + (data.service || 'aerial imaging') + ' (requested)';
    var body = 'This is a provisional hold for a booking you requested. It is not ' +
               'confirmed until we come back to you in writing.\n\n' +
               Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');

    var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
              '&text=' + encodeURIComponent(text) +
              '&dates=' + st + '/' + en +
              '&details=' + encodeURIComponent(body) +
              (data.projectAddress ? '&location=' + encodeURIComponent(data.projectAddress) : '');

    return '<div class="btn-row" style="margin-top:var(--s3)">' +
             '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">' +
               '<span>Add a provisional hold to your calendar</span></a>' +
           '</div>' +
           '<p class="dim" style="font-size:.82rem;margin-top:8px">' +
             'A reminder for you only &mdash; it does not confirm the booking.</p>';
  }

  /* ------------------------------------------- the scope agreement -------
     WHAT THIS IS, AND WHAT IT IS NOT.

     It is a real agreement: the scope the customer just built, written out
     in plain terms, which they read and explicitly tick before the request
     is sent. The tick, the exact wording they agreed to, and the timestamp
     all travel with the submission, so there is a record of what was agreed
     and when.

     It is NOT a countersigned e-signature. Nothing here is witnessed, and
     nothing is legally executed by a checkbox on a static page. The wording
     on screen says exactly that, because a customer should never think they
     have signed something they have not. If a countersigned document is
     needed, that is a service like DocuSign, and the README says so.     */
  function agreementTerms() {
    return [
      'The price shown is a starting estimate. The final price is confirmed ' +
        'in writing before any flight is scheduled, and nothing is charged before then.',
      'Travel is not included in the estimate. Sites beyond a short drive from ' +
        'our base carry a travel charge, which is quoted with the job and agreed ' +
        'before anything is booked.',
      'Flights depend on weather, daylight and airspace. If a flight cannot be ' +
        'flown safely or legally on the day, it is rescheduled at no cost.',
      'Access to the property is arranged by you. If we arrive and cannot get ' +
        'access, the visit may need to be rescheduled.',
      'Delivery dates are confirmed in writing when the flight is booked.',
      'You receive the finished files for your own use. We may show the work ' +
        'in our own portfolio unless you ask us in writing not to.',
      'Either of us can cancel before the flight. Anything already paid is refunded.'
    ];
  }

  function agreementBlock() {
    var t = total();
    if (t === null) return '';
    var rows = summaryRows().map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('');

    return '<div class="agree">' +
      '<p class="label label--sig">Scope agreement</p>' +
      '<div class="agree__doc" id="agree-doc" tabindex="0" role="region" ' +
           'aria-label="Scope agreement terms">' +
        '<h4>' + esc(C.SITE.legalName) + ' &mdash; project scope</h4>' +
        '<dl>' + rows +
          '<div><dt>Starting estimate</dt><dd>' + money(t) + '</dd></div>' +
        '</dl>' +
        '<ol>' + agreementTerms().map(function (x) {
          return '<li>' + esc(x) + '</li>';
        }).join('') + '</ol>' +
      '</div>' +
      '<label class="agree__check">' +
        '<input type="checkbox" id="f-agree" name="scopeAgreed" required>' +
        '<span>I have read the scope above and agree to it as the basis for this ' +
        'request. I understand this is not a signed contract and that the price ' +
        'and dates are confirmed in writing before anything is scheduled.</span>' +
      '</label>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn" data-print-agree><span>Print or save a copy</span></button>' +
      '</div>' +
    '</div>';
  }

  /* the earliest date we will accept a request for, and the latest */
  function isoOffset(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function renderForm() {
    var wrap = document.getElementById('calc-form');
    if (!wrap) return;
    var booking = state.mode === 'book';

    wrap.innerHTML =
      '<div class="calc__form">' +
        '<h3 class="h3" id="form-title" tabindex="-1">' +
          (booking ? 'Schedule a project' : 'Request this quote') + '</h3>' +

        (booking ? schedulerBlock() : '') +

        '<p class="dim' + (booking && schedulerReady() ? ' sched__sep' : '') +
          '" style="font-size:.94rem">' +
          (booking
            ? (schedulerReady()
                ? 'Prefer to send the details first? Use the form below instead &mdash; that is a request, not a confirmed appointment.'
                : 'Pick a date and a window that suit you. This sends a request, not a confirmed appointment &mdash; we come back in writing to lock it in.')
            : 'Send your estimate across and we will come back with a firm quote.') +
        '</p>' +

        '<form class="form" id="q-form" novalidate>' +
          '<div class="row2">' +
            field('f-name', 'name', 'Name', 'text', 'name', true) +
            field('f-email', 'email', 'Email', 'email', 'email', true) +
          '</div>' +
          '<div class="row2">' +
            field('f-phone', 'phone', 'Phone', 'tel', 'tel', booking) +
            field('f-addr', 'projectAddress', 'Project address', 'text', 'street-address', booking,
                  'Address, neighbourhood, or city') +
          '</div>' +

          (booking
            ? '<div class="row2">' +
                '<div class="field">' +
                  '<label for="f-date">Preferred date</label>' +
                  '<input id="f-date" name="preferredDate" type="date" required ' +
                    'min="' + isoOffset(P.leadDays) + '" max="' + isoOffset(P.horizonDays) + '">' +
                  '<p class="dim" style="font-size:.82rem">Earliest is ' + P.leadDays +
                    ' days out, so there is time to confirm and to watch the weather.</p>' +
                '</div>' +
                select('f-window', 'preferredTime', 'Preferred time', P.windows.map(function (w) { return w.label; }), true) +
              '</div>'
            : '<div class="row2">' +
                select('f-when', 'timeframe', 'Preferred timeframe', P.timeframes, false) +
                '<div></div>' +
              '</div>') +

          '<div class="field">' +
            '<label for="f-notes">Additional notes</label>' +
            '<textarea id="f-notes" name="notes" style="min-height:110px" ' +
              'placeholder="Anything that would help us plan the flight."></textarea>' +
          '</div>' +

          agreementBlock() +

          '<div class="calc__nav">' +
            '<button type="button" class="btn" data-cancel><span>Back to estimate</span></button>' +
            '<span class="spacer"></span>' +
            '<button type="submit" class="btn btn--solid"><span>' +
              (booking ? 'Send booking request' : 'Send quote request') + '</span></button>' +
          '</div>' +
          '<div id="q-out" aria-live="polite"></div>' +
        '</form>' +
      '</div>';

    if (booking) watchScheduler();

    var t = document.getElementById('form-title');
    if (t) t.focus({ preventScroll: true });

    var cancel = wrap.querySelector('[data-cancel]');
    if (cancel) cancel.addEventListener('click', function () {
      state.mode = null;
      renderEstimate(true);
    });

    /* the print stylesheet opens the agreement out of its scroll box, so
       printing the page gives a readable copy of the scope */
    var pr = wrap.querySelector('[data-print-agree]');
    if (pr) pr.addEventListener('click', function () { window.print(); });

    var form = document.getElementById('q-form');
    var out = document.getElementById('q-out');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      out.innerHTML = '';
      if (!U.validate(form)) return;

      /* every selection travels with the request */
      var addonNames = state.addons.map(function (id) { return nameOf(P.addons, id); });
      var extra = {
        requestType:   booking ? 'Booking request' : 'Quote request',
        service:       nameOf(P.services, state.service),
        projectType:   nameOf(P.types, state.type),
        projectSize:   nameOf(P.sizes, state.size),
        addOns:        addonNames.length ? addonNames.join(', ') : 'None',
        delivery:      nameOf(P.delivery, state.delivery),
        startingPrice: money(total()) + ' (starting estimate, not a final quote)'
      };

      /* The record of what was agreed: the exact terms, and when. Sent with
         the request so there is a copy on both sides, not just a tick that
         vanished with the page. */
      var agreed = document.getElementById('f-agree');
      if (agreed && agreed.checked) {
        extra.scopeAgreed   = 'Yes — agreed on ' + new Date().toLocaleString();
        extra.scopeAgreedTo = agreementTerms().map(function (x, i) {
          return (i + 1) + '. ' + x;
        }).join('  ');
      }

      U.submit(form, out, extra, booking ? 'Send booking request' : 'Send quote request');

      /* once a booking request is away, offer the customer a hold for their
         own calendar. Their date and window are already in the form.      */
      if (booking) {
        var fields = {};
        U.$$('input, select, textarea', form).forEach(function (f) {
          if (f.name && f.value) fields[f.name] = f.value.trim();
        });
        Object.keys(extra).forEach(function (k) { fields[k] = extra[k]; });
        var link = holdLink(fields);
        if (link) out.insertAdjacentHTML('beforeend', link);
      }
    });
  }

  /* -------------------------------------------------------------- wiring */
  function wireSteps() {
    U.$$('.opt', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key'), id = b.getAttribute('data-id');

        if (b.getAttribute('data-multi') === 'true') {
          var i = state.addons.indexOf(id);
          if (i > -1) state.addons.splice(i, 1); else state.addons.push(id);
          b.setAttribute('aria-pressed', state.addons.indexOf(id) > -1 ? 'true' : 'false');
          updateTicker();
          return;
        }

        state[key] = id;
        reconcile();
        U.$$('.opt[data-key="' + key + '"]', host).forEach(function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        var next = host.querySelector('[data-next]');
        if (next) next.disabled = false;
        updateTicker();
      });
    });

    var back = host.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () {
      if (state.step > 0) { state.step--; render(true); }
    });

    var next = host.querySelector('[data-next]');
    if (next) next.addEventListener('click', function () {
      if (state.step < STEPS.length && !STEPS[state.step].ready()) return;
      state.step++;
      render(true);
    });
  }

  /* the total updates in place rather than redrawing the step */
  function updateTicker() {
    var t = total();
    var run = host.querySelector('.calc__run');
    if (t === null) { if (run) run.remove(); return; }
    if (!run) {
      var nav = host.querySelector('.calc__nav');
      if (nav) nav.insertAdjacentHTML('beforebegin', ticker());
      return;
    }
    run.querySelector('.calc__run-fig').textContent = money(t);
  }

  render(false);
})();

