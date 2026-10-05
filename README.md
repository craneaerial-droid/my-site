# Crane Aerial & 3D Imaging — craneaerial.com

A single-page static site. No build step, no framework, no dependencies. The only
third-party request is Google Fonts.

```
index.html            the page
assets/css/site.css   one stylesheet, documented by section
assets/js/config.js   ALL copy, pricing, services and contact data — edit this
assets/js/app.js      nav, reveals, the video ladder, the contact form
assets/js/quote.js    six-step calculator, booking, scope agreement
assets/video/         six encodes of two clips, plus posters
assets/img/           the aerial still, favicon, social card
CNAME                 craneaerial.com — GitHub Pages custom domain
```

Deployment is automatic: `.github/workflows/deploy.yml` publishes the repo root to
GitHub Pages on every push to `main`. The domain's A records already point at
GitHub (185.199.108–111.153), DNS stays at Squarespace, and the Google Workspace
MX, SPF and DKIM records are untouched by any of this.

---

## 1. The only file you normally edit

`assets/js/config.js`. Service names, descriptions, every price, the phone number,
the booking link, the service-area wording. Change a number there and it changes
everywhere it appears — the calculator, the estimate, the scope agreement.

Two values are still unset:

| Value | Effect while unset |
|---|---|
| `SITE.email` | The email row stays hidden. It does not render blank. |
| `FORMS.endpoint` | Every form states plainly that nothing was sent, and hands the details back. No form ever fakes a success. |

Fill them in and both behaviours switch on by themselves.

---

## 2. Provenance — read this before trusting a pixel

This tree was **reconstructed**, not restored from the original working copy.

| Part | Source | Fidelity |
|---|---|---|
| `site.css`, `config.js`, `app.js`, `quote.js` | Published artifact, verbatim | Exact |
| `index.html` body | Published artifact | Exact |
| `index.html` head | Rewritten from the project record | Equivalent, not byte-identical |
| `kc-dusk.webp`, `kc-city.webp` posters | Decoded from the artifact | Exact bytes |
| All six video encodes | Re-encoded from the 5224×2160 masters | Exact settings, re-run |
| `work-01.webp` | **Substitute — see below** | **Not the original** |
| `og.jpg`, `favicon.svg` | Newly generated | New |

**The still is a stand-in.** The original `work-01.webp` was a frame of the
Nelson-Atkins Museum of Art that is not recoverable — it was never inlined into
the artifact, and it does not appear in either master clip. What ships here is a
different composition cropped from your own dusk master: the downtown skyline with
the broadcast tower. It is genuinely your footage, the alt text describes what is
actually in the frame, and it is cropped to 1.878:1 so the panel maths still holds.

To put the real frame back, drop both sizes in and fix the alt text and caption:

```
assets/img/work-01.webp      1600 x 852
assets/img/work-01-sm.webp    900 x 478
```

---

## 3. The hero resolution ladder

The hero is `object-fit: cover` over a 2.418:1 clip in a `100svh` box, so the
source width it needs is **not** the viewport width — it is
`max(viewport width, viewport height × 2.418) × DPR`. On a 1440×900 window that is
2176, and 4353 at 2×. One 1920 encode gets scaled **up** on essentially every
desktop, which is what soft footage looks like. Hence four:

| Encode | Size | Served to |
|---|---|---|
| `kc-dusk-sm` | 1200×1860 | Under 1000px — a **portrait crop** of the skyline, at native pixels |
| `kc-dusk` | 1920×794 | 1000px fallback |
| `kc-dusk-lg` | 2560×1058 | 1000px and up |
| `kc-dusk-xl` | 4352×1800 | 1000px and up at 2× or better |

4352 is not a round number by accident: 900px of viewport height at 2×, times
2.418, is 4353px of source width. At 4352 a 1440×900 retina window renders the
hero at a measured **1.00×** — no upscale at all, which is the ceiling.

The phone encode is a different **shape**, not just a smaller file. Cover-fitting a
2.418:1 clip into a phone-shaped box upscales it fourfold *and* lands the crop on
the emptiest part of the sky, so `kc-dusk-sm` is cropped from the skyline region
(`crop=1200:1860:3400:300`) at native pixels and carries its own poster, swapped in
by `app.js` through `data-poster-sm`.

The work panel has its own pair for the same reason. Its box is 1.63:1 against a
2.418:1 clip, so the **height** binds, not the width: a 390px phone at 3× needs
720px of source height, i.e. 1741px of width. `kc-city-sm` is 1920×794 to clear
that; `kc-city` is 2560×1058 for wide retina desktops.

The one case that cannot reach 1.0 is the phone hero, and the footage is the limit:
a full-height hero on a 390×900 screen at 3× wants ~2700px of source height and the
original is 2160px tall. 1.45× is the floor there, not a setting to tune.

Tier selection lives in `film()` in `app.js`.

---

## 4. Things that are deliberately true

No testimonials, no statistics, no client logos, no certifications, no awards —
none of it can be stated truthfully yet, and an invented review is worse than an
empty page.

**Travel is never inside a price.** It is named as an addition in three places: the
estimate note in `quote.js`, clause 2 of the scope agreement, and the contact
block. If a travel figure is ever folded into a package base, those three will be
saying something the price no longer does.

**Service area is wording, not a boundary.** `SITE.city`/`state` say where Crane is
*based*; `SITE.areaShort`/`areaLong` are what customers read.

**The scope agreement is not an e-signature.** It states the built scope, requires a
real tick, and travels with the submission. It is a record of what was agreed, and
it says so.

---

## 5. Masters

`0907/` and `0907(1)/` previously held the two 5224×2160 master clips in this
public repo — roughly 7.4 MB of raw footage, downloadable by anyone and unused by
the site. They have been removed. Keep the masters somewhere private; every encode
the site needs is already in `assets/video/`.
