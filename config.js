/* ==========================================================================
   CRANE AERIAL & 3D IMAGING — SITE CONFIGURATION
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NORMALLY EDIT.

   Contact details, service area, the services, and every number the quote
   calculator uses. Nothing is hard-coded anywhere else in the site.

   Anything still written in [square brackets] has not been filled in. The
   site hides those rather than showing a placeholder or inventing a value.
   ========================================================================== */
window.CRANE = (function () {
  'use strict';

  /* ---------------------------------------------------------------- brand */
  var SITE = {
    /* the customer-facing brand — used everywhere on the site */
    name:      'Crane Aerial & 3D Imaging',
    short:     'Crane Aerial',
    /* the registered entity — used only where a legal name belongs */
    legalName: 'Crane Aerial Production LLC',

    /* WHERE THE BUSINESS FLIES.
        `city`/`state` are where Crane is BASED — they belong in the address and
        in search results. They are deliberately NOT a service boundary: the
        aircraft travels, and `areaShort`/`areaLong` are the wording customers
        read. Travel is charged on top of the estimate and is never folded into
        a package price, so nobody is quoted a number that quietly assumes a
        short drive. */
    city:      'Kansas City',
    state:     'Missouri',
    areaShort: 'Wherever the site is',
    areaLong:  'Based in Kansas City, Missouri, and travelling for work. Beyond a short drive from home base, a travel charge is added to the estimate and quoted with the job \u2014 it is not built into the package prices.',

    /* Fill these in and they appear everywhere. Leave them and they stay hidden. */
    phone:     '(816) 560-2380',
    phoneHref: '8165602380',
    email:     '[YOUR EMAIL ADDRESS]',
    domain:    'craneaerial.com',

    social: {
      instagram: '[INSTAGRAM URL]',
      facebook:  '[FACEBOOK URL]'
    }
  };

  /* ------------------------------------------------------------- booking */
  /* CONNECTING YOUR GOOGLE CALENDAR.

     A website made of files cannot write into your calendar on its own —
     that needs a server holding a Google login, which is not something this
     site should be doing. What DOES work, and takes about five minutes, is
     Google's own booking page:

       1. Open Google Calendar → Create → "Appointment schedule"
       2. Set your working hours, how long a flight takes, and how much
          notice you need
       3. Google gives you a public booking link
       4. Paste that link into `schedulerUrl` below

     From then on the Book step shows your real calendar. Customers see only
     the times you are actually free, picking one writes the event straight
     into your Google Calendar, and both of you get the confirmation from
     Google. Nothing is faked and nothing is stored here.

     Leave it as a placeholder and the Book step falls back to the request
     form, which is honest about being a request rather than a confirmed
     appointment.

     TWO SHAPES OF LINK — AND THE ONE THAT EMBEDS RELIABLY.

     The Share dialog gives you a short link that looks like
     `calendar.app.google/XXXXXXXX`. That link always works when someone
     clicks it. Whether Google will let it be displayed *inside* another
     website is Google's decision, not ours — so the site tries, and if the
     frame does not come up it says so in plain words and offers the button
     instead. Nobody is left staring at an empty box.

     For a guaranteed inline calendar, use the LONG url. In the same Share
     dialog choose "Embed", and copy the address out of the embed code:

       https://calendar.google.com/calendar/appointments/schedules/AcZss...

     Paste that here instead of the short link and the calendar is framed
     directly in the page, every time.                                     */
  var BOOKING = {
    /* Carsten's live appointment schedule */
    schedulerUrl: 'https://calendar.app.google/PeJVwzspV9UuZLFFA',

    /* Try to show the calendar inside the page. If Google refuses to be
       framed through your link, the block says so plainly and the button
       below it opens the real calendar in a new tab. */
    embed: true,
    embedHeight: 700
  };

  /* --------------------------------------------------------------- forms */
  var FORMS = {
    /* Paste a form endpoint here (Formspree, Basin, Netlify Forms, your own
       handler — anything that accepts a POST). Until you do, every form on
       the site tells the visitor plainly that nothing was sent and hands the
       details back to them. Nothing ever pretends to have been delivered. */
    endpoint: '[YOUR FORM ENDPOINT URL]',
    method:   'POST'
  };

  /* ------------------------------------------------------------ services */
  var SERVICES = [
    { id: 'realestate',
      name: 'Real Estate',
      line: 'Exterior photography and video for listings, so a buyer knows the lot, the street and the neighbours before they ever drive out.',
      items: ['Exterior photography', 'Listing video', 'Lot and surroundings'] },

    { id: 'inspections',
      name: 'Inspections',
      line: 'Close exterior documentation of roofs, structures and sites, flown so nobody has to go up a ladder to get the picture.',
      items: ['Roofing', 'Construction', 'Property documentation'] },

    { id: 'commercial',
      name: 'Commercial',
      line: 'Developments, portfolios and facilities recorded as they actually stand, for marketing or for the record.',
      items: ['Development', 'Marketing', 'Documentation'] },

    { id: 'mapping',
      name: 'Mapping & 3D',
      line: 'Gridded flights over a whole site, processed into an overhead map, a 3D model, and a walkthrough you can move around inside on a link.',
      items: ['Aerial mapping', 'Overhead site maps', '3D walkthroughs'] }
  ];

  /* ------------------------------------------------------------- pricing */
  /* How the estimate is built — deliberately ADDITIVE, so that changing one
     answer moves the number by a sensible amount rather than multiplying it:

       price = service base
             + size step
             + project-type step
             + delivery
             + each add-on

     The result is shown as a STARTING price, because a drone job cannot be
     priced exactly without knowing the site. Every figure below is a plain
     dollar amount you can edit directly.                                   */
  var PRICING = {
    symbol:  '$',
    STEP:    5,          /* displayed figures round to this */
    MINIMUM: 150,        /* no job is quoted below this     */

    /* ---- STEP 1: what kind of project ---------------------------------- */
    /* `add` is what this type adds to the base, for the extra planning,
       coverage or coordination it genuinely takes.                        */
    types: [
      { id: 'realestate',  name: 'Real Estate',         add: 0 },
      { id: 'roofing',     name: 'Roofing',             add: 25 },
      { id: 'inspection',  name: 'Inspection',          add: 50 },
      { id: 'construction',name: 'Construction',        add: 75 },
      { id: 'commercial',  name: 'Commercial Property', add: 75 },
      { id: 'event',       name: 'Event',               add: 50 },
      { id: 'marketing',   name: 'Marketing',           add: 25 },
      { id: 'imaging3d',   name: '3D Imaging',          add: 0 },
      { id: 'walkthrough', name: '3D Walkthrough',      add: 0 },
      { id: 'other',       name: 'Other',               add: 0 }
    ],

    /* ---- STEP 2: what they actually get -------------------------------- */
    services: [
      { id: 'photo',      name: 'Aerial Photography',   base: 150,
        includes: ['A single flight of the property',
                   'A set of edited exterior stills',
                   'Full-resolution files, delivered online'] },

      { id: 'video',      name: 'Aerial Video',         base: 200,
        includes: ['A single flight of the property',
                   'One edited aerial video',
                   'Full-resolution files, delivered online'] },

      { id: 'photovideo', name: 'Photo + Video',        base: 275,
        includes: ['A single flight covering both',
                   'A set of edited exterior stills',
                   'One edited aerial video',
                   'Full-resolution files, delivered online'] },

      { id: 'imaging3d',  name: '3D Imaging',           base: 250, has3d: true,
        includes: ['A gridded mapping flight over the site',
                   'A 3D visual model and an overhead map of the area flown',
                   'Source imagery included'] },

      { id: 'walkthrough', name: '3D Walkthrough',      base: 375, has3d: true, hasWalk: true,
        includes: ['A gridded mapping flight over the site',
                   'A 3D model built from that flight',
                   'An interactive walkthrough on a link you can send',
                   'An overhead map of the area flown'] },

      { id: 'photo3d',    name: 'Photography + 3D',     base: 400, has3d: true,
        includes: ['A photography flight and a gridded mapping flight',
                   'A set of edited exterior stills',
                   'A 3D visual model and an overhead map of the area flown',
                   'Full-resolution files, delivered online'] },

      { id: 'full',       name: 'Full Aerial Package',  base: 550, has3d: true, hasWalk: true,
        includes: ['Photography, video and mapping in one visit',
                   'A set of edited exterior stills',
                   'One edited aerial video',
                   'A 3D visual model, an overhead map, and a walkthrough link',
                   'Full-resolution files, delivered online'] }
    ],

    /* which services make sense for which project type — this is what stops
       a customer building a combination we would have to walk back        */
    servicesFor: {
      realestate:   ['photo', 'video', 'photovideo', 'photo3d', 'walkthrough', 'full'],
      roofing:      ['photo', 'imaging3d', 'photo3d'],
      inspection:   ['photo', 'imaging3d', 'photo3d'],
      construction: ['photo', 'video', 'photovideo', 'imaging3d', 'photo3d', 'walkthrough', 'full'],
      commercial:   ['photo', 'video', 'photovideo', 'imaging3d', 'photo3d', 'walkthrough', 'full'],
      event:        ['photo', 'video', 'photovideo'],
      marketing:    ['photo', 'video', 'photovideo', 'photo3d', 'full'],
      imaging3d:    ['imaging3d', 'photo3d', 'walkthrough', 'full'],
      walkthrough:  ['walkthrough', 'full'],
      other:        ['photo', 'video', 'photovideo', 'imaging3d', 'photo3d', 'walkthrough', 'full']
    },

    /* ---- STEP 3: how big ----------------------------------------------- */
    sizes: [
      { id: 'small',   name: 'Small',   add: 0,
        line: 'A house, a small lot, or one structure.' },
      { id: 'medium',  name: 'Medium',  add: 75,
        line: 'A larger property, a small commercial building, or a modest site.' },
      { id: 'large',   name: 'Large',   add: 175,
        line: 'An estate, a large commercial property, or an active site.' },
      { id: 'complex', name: 'Complex / Multi-property', add: 325,
        line: 'Several buildings, difficult access, or more than one address.' }
    ],

    /* ---- STEP 4: add-ons ----------------------------------------------- */
    /* `needs` limits an add-on to services it actually applies to.
       `hideIf3d` drops the 3D add-on when 3D is already in the package.   */
    addons: [
      { id: 'extraphotos', name: 'Additional edited photos', add: 50,
        line: 'A larger edited set than the standard delivery.',
        needs: ['photo', 'photovideo', 'photo3d', 'full'] },

      { id: 'flighttime',  name: 'Additional flight time',   add: 75,
        line: 'More time on site for extra angles or a second pass.' },

      { id: 'add3d',       name: 'Add 3D imaging',           add: 200,
        line: 'A gridded mapping flight added to a photography or video booking.',
        hideIf3d: true },

      /* Raw capture is not the same thing as something you can post. This is
         the edit that turns one into the other. */
      { id: 'addwalk',     name: 'Add a 3D walkthrough',     add: 150,
        line: 'The mapping flight built out into a walkthrough on a link you can send.',
        needs3d: true, hideIfWalk: true },

      { id: 'adready',     name: 'Ad-ready content package',  add: 175,
        line: 'The footage cut for where it is going: vertical cuts for Reels, TikTok and Shorts, a square cut for the feed, and a longer edit for YouTube or a listing page. Titles and colour included.' },

      { id: 'location',    name: 'Additional property or location', add: 125,
        line: 'A second address flown on the same day.' },

      { id: 'rawfiles',    name: 'Raw / unedited files',     add: 40,
        line: 'Every usable frame from the flight, exactly as captured.' }
    ],

    /* ---- STEP 5: delivery ---------------------------------------------- */
    /* No turnaround promise is made here that cannot be kept. */
    delivery: [
      { id: 'standard', name: 'Standard delivery', add: 0,
        line: 'The usual turnaround. We confirm the delivery date in writing when the flight is booked.' },
      { id: 'rush',     name: 'Rush delivery',     add: 75,
        line: 'Moved to the front of the queue. We confirm what is achievable before you commit.' }
    ],

    timeframes: [
      'As soon as possible',
      'Within two weeks',
      'Within a month',
      'Flexible — no fixed date'
    ],

    /* Booking time windows offered on the request form. The start and end
       times are used only to build the "add to your calendar" link a
       customer can save for themselves — edit them to match how you work. */
    windows: [
      { label: 'Morning (8am – 11am)',    start: '08:00', end: '11:00' },
      { label: 'Midday (11am – 2pm)',     start: '11:00', end: '14:00' },
      { label: 'Afternoon (2pm – 5pm)',   start: '14:00', end: '17:00' },
      { label: 'Late afternoon (4pm – 7pm)', start: '16:00', end: '19:00' }
    ],

    /* how far ahead the date picker will accept a request */
    leadDays: 3,
    horizonDays: 120
  };

  return { SITE: SITE, FORMS: FORMS, BOOKING: BOOKING, SERVICES: SERVICES, PRICING: PRICING };
})();

