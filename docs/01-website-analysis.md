# NoteForWork — Current Website Analysis

_Analyzed 2026-10-05 · Sources: https://www.noteforwork.com (marketing) and https://app.noteforwork.com (patient app)_

---

## 1. What the product is

An **asynchronous telehealth service** that issues physician-signed work/school absence notes for minor illnesses.

| Item | Value |
|---|---|
| Price | **$29 flat**, one-time, charged *after* passing a pre-screen |
| SLA | Signed note within **60 minutes or free**, 24/7/365 |
| Clinical entity | Noteforwork PC (California professional corporation). Fictitious Name Permits: NoteForWork #FNP562159, **Anyday Medical Clinic** #FNP561853 (some notes are issued under this second name) |
| Coverage | ~37 states + DC (driven by a `state_list` collection) |
| Physicians | 3 shown: Dr. Sidhu (founder, EM, CA), Dr. Olivero (day shift, 4 AM–4 PM PT), Dr. Yuan (night shift, 5 PM–3 AM PT). **Gap: 3 AM–4 AM PT has no named coverage** even though the site claims 24/7 |
| Physician pay (careers page) | $10 per review + $20/hr availability, 1099, Net-15 |
| Differentiators | Pre-payment screening, QR/Note-ID employer verification portal, Employer Acceptance Guarantee (refund within 14 days), Employer Information Sheet PDF, Spanish content |
| Contacts | help@, verify@, privacy@, ceo@ noteforwork.com |

---

## 2. Site inventory

### 2a. Marketing site: `www.noteforwork.com` (static HTML on tiiny.host)

| Page | Purpose | Notes |
|---|---|---|
| `/` (index) | Landing page | Sections: nav, hero, doctors, process (3 steps), why-us (3), pricing, testimonials (3), guarantee + refund steps, FAQ (8), final CTA, footer, sticky mobile CTA |
| `/resources.html` | Blog index | Sortable (newest/oldest/category/A–Z), category tags |
| `/do-i-need-doctors-note-one-day-off-work.html` | SEO article | |
| `/can-you-get-fired-for-calling-in-sick.html` | SEO article | |
| `/how-to-get-doctors-note-at-night-weekend.html` | SEO article | Has its own FAQ + related articles |
| `/can-employer-call-doctor-about-work-note.html` | SEO article | |
| `/can-employer-deny-doctors-note.html` | SEO article | |
| `/telehealth-doctors-note-valid-for-work.html` | SEO article | ⚠ **Duplicate topic** of the next one |
| `/is-telehealth-doctors-note-valid-for-work.html` | SEO article | ⚠ Duplicate (cannibalization) |
| `/staying-home-sick-public-health.html` | SEO article | ⚠ **Duplicate topic** of the next one |
| `/why-staying-home-sick-is-good-for-public-health.html` | SEO article | ⚠ Duplicate |
| `/what-makes-work-excuse-note-valid.html` | SEO article (physician-authored) | |
| `/employer-guide-telehealth-work-notes.html` | HR guide ("For HR") | Cites the Cures Act, CCHP, AMA, and EEOC; links to the verification portal |
| `/nota-medica-para-el-trabajo.html` | Spanish landing/article | ⚠ CTA says **"Obtener Mi Nota Gratis"** (free) but the service costs $29 |
| `/careers.html` | Physician recruiting | ⚠ Says "ahead of our **July 2026** launch", which is out of date |
| `/employment.html` | Gated physician application + 7-case clinical assessment | ⚠ Access code is **hardcoded in client JS**; all case content is in the HTML |
| `/privacy.html` | Privacy policy (Apr 18 2026) | Mentions MailerLite and Google Analytics |
| `/terms.html` | Terms of Service (May 1 2026) | Location attestation, refund policy |
| `/hipaa-notice.html` | Notice of Privacy Practices | Stripe and BAAs mentioned |
| `/patient-consent.html` | Async telehealth informed consent | Lists the decline criteria |
| `/employer-information-sheet.pdf` | HR PDF (62 KB) | ⚠ A **different** PDF (`noteforwork-employer-information-sheet.pdf`, 6 KB) is linked from the HR guide |
| `/sitemap.xml`, `/robots.txt` | SEO | 20 URLs. Careers, employment, and both PDFs are not listed |

### 2b. Patient app: `app.noteforwork.com` (DrapCode no-code platform)

| Route | Purpose |
|---|---|
| `/work-excuse-intake` | Geo-check, consent modal, then a 7-question eligibility screener |
| `/service-not-available?state=X` | Shown for unsupported states; lets the user re-pick a state |
| `/fill-your-details` | First/last name, email, phone, DOB, state of residence |
| *(Review, Note Details steps)* | Shown in the progress bar: **Questions → Your Info → Review → Note Details → Payment → Done** |
| `/payment` | Stripe "Pay Now" |
| `/payment-success`, `/thank-you` | Confirmation, reference ID `NW-XXXXX`, timeline |
| `/verify-note-details` | **Employer verification portal**: enter Note ID (`NW-2026-7K2P-X94M` format) or scan the QR code (html5-qrcode) |
| `/login`, `/signup`, `/forgot-password`, `/dashboard` | Patient accounts: password, email code, and magic link |

Physician and admin back-office routes are not public. They must exist inside DrapCode (case queue, sign, decline, note generation).

---

## 3. Core user flows

### 3a. Patient: get a note
1. Landing page, then **Get My Note**, then `/work-excuse-intake`
2. **IP geolocation** (`get.geojs.io`) is checked against the `state_list` API. Unsupported states go to `/service-not-available`
3. **Telehealth consent modal** (must scroll to the bottom; cites CA B&P §2290.5)
4. **Screener** (auto-advances on each answer):
   1. Age: 18–65 / 7–17 / 65+ *(conditional)* / ≤6 → **blocked**
   2. Pregnant? (Yes = conditional)
   3. Comorbidities: diabetes, heart, lung (asthma/COPD), kidney, liver, then a confirm step
   4. Fever? If yes, range 100.4–102 / 102–104 / >104 / don't know. **Blocked** if conditional-risk and ≥102°F
   5. Duration: more than 7 days → **blocked**
   6. Trend: getting worse → **blocked**
   7. Red flags (10 items, e.g. chest pain, dyspnea, stiff neck, confusion, blood). Any blocking flag → **blocked**. Hydration flags lead to "can you drink fluids?", and No → **blocked**
   - Risk score: 0–1 = **Low**, 2+ or any conditional factor = **Medium**
5. Personal details, then Review, then Note Details (absence dates), then **Stripe payment ($29)**
6. Thank-you page with a reference ID. The physician reviews within 60 minutes
7. A signed **PDF note** is emailed with a QR code and Note ID. It contains name, dates, physician name, license, and NPI, and **no diagnosis**

### 3b. Employer: verify a note
QR scan or Note ID entry on `/verify-note-details`. The portal confirms authenticity and physician licensure, with **no login and no PHI shown**.

### 3c. Refund / Employer Acceptance Guarantee
Employer rejects the note, then the patient forwards the Employer Info Sheet. If it's still rejected, the patient emails help@ within 14 days. The team reviews within 2 business days and refunds within 5. A note not delivered within 60 minutes is also free.

### 3d. Physician (from careers and employment pages)
Async queue, 2–3 minutes per case, approve or decline (paid either way), scheduled availability windows. Onboarding: 7-case assessment, results emailed to ceo@, interview, credentialing.

---

## 4. Current tech stack

| Layer | Marketing site | Patient app |
|---|---|---|
| Hosting | tiiny.host (static) | DrapCode (`noteforwork5259.api.drapcode.io`) |
| Frontend | Hand-written HTML/CSS, inline JS | DrapCode-generated pages, jQuery, jQuery UI, Bootstrap, LemonadeJS, moment, math.js |
| Fonts | DM Sans (body), Instrument Serif (display) | same |
| Payments | n/a | Stripe.js v3 |
| Analytics | GA4 (`G-MSRMTV3RXF`), Google Ads conversion, Plausible (tiiny) | **Microsoft Clarity** (session recording) |
| Email | MailerLite (leftover waitlist form code) | DrapCode / transactional |
| Geo | n/a | geojs.io (client-side) |

**Design tokens** (from `:root`):
```css
--green:#1a7a4a; --green-mid:#2da863; --green-light:#e8f5ee;
--ink:#0f1a14;   --cream:#f8faf8;    --muted:#5f7269; --border:#dde8e2;
```

**SEO assets in place:** JSON-LD `MedicalBusiness` and `FAQPage`, OG and Twitter cards, `hreflang` (es_US), sitemap, canonical-style URLs. These are worth preserving 1:1 in the rebuild because the `.html` URLs have ranking equity, so set up 301s or keep the paths.

---

## 5. Problems found

### 🔴 Security / compliance (fix in the rebuild, and some fix now)
1. **DrapCode developer API key is exposed in client JS** (`x-api-key` header used to read `state_list`). Rotate it. Server-side keys must never ship to the browser.
2. **Eligibility screening is 100% client-side.** Risk is computed in JS and stored in `sessionStorage`. Unless the backend re-validates, a user can skip "blocked" outcomes. The safety logic has to be authoritative on the server.
3. **Microsoft Clarity session recording on PHI pages** (symptom intake, personal details), with **zero `data-clarity-mask` elements**. Clarity won't sign a BAA, so this is a likely HIPAA exposure. GA4 and Google Ads on the marketing site are fine, but conversion events must not carry health data.
4. **`employment.html` access code is hardcoded in JS**, and the assessment content is already in the HTML. The gate is cosmetic.
5. `/thank-you` and `/payment-success` can be opened directly and show "Payment confirmed $29.00" with no payment. That's cosmetic, but misleading.
6. The verification portal needs rate limiting and high-entropy IDs to prevent Note ID enumeration. It can't be confirmed from outside, so this is a requirement for the rebuild.
7. Location is enforced by IP on the client only, while the Terms rely on self-attestation. The rebuild should capture an explicit attestation with timestamp and IP server-side for the audit trail.

### 🟠 Functional / data bugs
- The state picker includes **"United States"** as a state, and DC appears twice ("District of Columbia" and "Washington D.C.").
- `/fill-your-details` state-of-residence offers **all 50 states** while service availability is ~37, which is inconsistent with the intake gate.
- Email validation message says "**Only lowercase letters are allowed**". It should normalize to lowercase, not reject.
- Date formats are inconsistent: the signup placeholder is `dd-mm-yyyy` while the app meta is `MM-DD-YYYY` (US audience).
- Debug text leaks into the page: "US/Pacific MM-DD-YYYY login 840" appears at the top of every app page.
- `/payment-success` still has template copy: "please email **orders@example.com**".
- The Login/Signup header CTA still says "**Join Waitlist →**", and the payment footer mentions a waitlist. These are pre-launch leftovers.
- Unknown routes return **HTTP 200** "page not found" (soft 404s).
- The homepage "Current average turnaround: **6 minutes · updated Oct 5**": the number is hardcoded and the date is set to *today* by JS. That's misleading and should be computed from real data.

### 🟡 Content / marketing inconsistencies
- The Spanish CTA says "Gratis" (free) while the price is $29.
- The FAQ on the page has 8 questions but the `FAQPage` schema has 6, with different wording. Google expects them to match.
- The Terms' 60-minute refund clock starts "from physician approval", while the homepage says 60 minutes from submission.
- Two different Employer Information Sheet PDFs exist.
- Duplicate articles split ranking (2× telehealth validity, 2× staying home sick). Consolidate them and 301 the duplicates.
- Careers copy references a July 2026 launch that has already passed.
- Physician shift coverage shows a 3–4 AM PT gap against the "24/7" claim.
- The privacy policy says "marketing website does not collect health information", but GA, Ads, and Clarity on the app make that statement fragile.

---

## 5b. Live patient-app walkthrough (2026-10-05)

I walked through the flow in a browser as a California patient, using fake data (Test Patient, test@example.com, DOB 01-01-1990), and stopped before **Proceed to Payment**.

### What actually happens at each step

| # | Page | What the user sees | What the code does | Server write? |
|---|---|---|---|---|
| 0 | `/work-excuse-intake` | IP geo-check; outside a served state → `/service-not-available` | `get.geojs.io` + `state_list` API (with exposed `x-api-key`) | No |
| 1 | Consent popup | Must scroll to the bottom; **"Go to Bottom" button does nothing** | Stores a `userConsent` **cookie only** | **No (no consent audit record)** |
| 2 | Screener (8 cards) | Auto-advance, live "eligibility" banner (green, then amber) | `computeRiskFromState()` in JS → `sessionStorage.nfw_session` | No |
| 3 | Review answers | Answer summary, confirm checkbox, **"Submit Request"** | Only navigates to `fill-your-details`. Nothing is submitted, so the label is misleading | No |
| 4 | `/fill-your-details` | Name, email, phone (+1 picker), DOB (flatpickr), state | Saved to `sessionStorage` only | No |
| 5 | `/fill-note-details` | Start/end date (window: **yesterday to +2 days**), "Please select 1–2 Days" | Generates `refId` (`NFW-2026-XXXXXXXX###`) and `requestId` (`REQ-2026-XXXXXX`) with **`Math.random()` in the browser** | No |
| 6 | `/payment-review/product/<id>` | Summary (name, dates, $29), physician cards, "Encrypting your data…" animation | **On page load**, DrapCode external API "Patient Submit Submission Before Payment" POSTs the **entire `nfw_session` + IP** to an **AWS Lambda function URL (us-west-2), with no auth configured** | **Yes: creates a "pending submission"** |
| 7 | Proceed to Payment ($29) | Stripe checkout | `stripeConnectCheckout()`; creates Stripe customer (`PatientInfoWithStripeId`) | Yes (not tested) |
| 8 | `/thank-you` | Timeline, reference ID | Static | n/a |

> ⚠ The walkthrough created one pending (unpaid) test submission in production: `submission_id 3127f624-9baf-43ae-91d2-7100b4d5a094`, `request_id REQ-2026-L0CZGH`, patient "Test Patient / test@example.com". Ask the owner to delete it.

### Screener as built
1. Age: 18–65 · 7–17 · 65+ *(conditional)* · 6 and under → blocked
2. Pregnant? (asked of everyone, regardless of age)
3. Conditions: None, or diabetes / heart / lung / kidney / liver (+ confirm step)
4. Fever? → if Yes, temperature: 100.4–102 · 102–104 · >104 · don't know
5. Duration: 1–3 · 4–7 · >7 days (blocked)
6. Trend (24 h): better · same · worse (blocked)
7. Red flags (10). Any one blocks, except the 2 hydration flags, which ask "can you drink fluids hourly?" (No blocks)

Banners: "👍 Looking good" → "✅ Everything looks promising" → "⚠️ Elevated risk factors noted" → "⚠️ medium risk factors are present". Total question count changes from **"of 7" to "of 8"** when fever = Yes.

### New issues found during the walkthrough
**🔴 Security / integrity**
- **The server receives the client-computed `riskLevel`/`riskScore`** inside `nfw_session`. Unless the Lambda recomputes them, anyone can forge a "Low risk" submission.
- **Unauthenticated Lambda URL.** Anyone can POST arbitrary pending submissions. The integration config, including the URL and body template, is readable from public `GET /api/v1/external-api/id/<uuid>`.
- **The Note/Ref ID is generated in the browser** with `Math.random()` (not cryptographically secure, no uniqueness check, client-controlled). The payment page has a *second* `generateRefId()` with a different length. Three ID formats are in use: `NFW-2026-XXXXXXXX###` (code), `NW-2026-7K2P-X94M` (verify placeholder), `NW-XXXXX` (thank-you).
- **The pending submission is created on page view, not on user intent.** Every visit to payment-review writes PHI to the backend, so abandoned carts leave PHI behind.
- **The "4 days in any 30-day period" rule** is stated in the UI but isn't checked anywhere in the client. It's unverified whether the server checks it.
- Clarity (`n.clarity.ms/collect`) fires on every PHI page, including the summary showing the patient name and dates.

**🟠 Functional bugs**
- **The DOB picker is hardcoded to 1961-01-01 … 2008-12-31.** Patients aged **65+ and 7–17, whom the screener accepts, cannot enter a DOB**. The bounds also go stale every year.
- The absence date window uses the **browser's timezone**, not the patient's state.
- The state dropdown displays "Select your state…" while its value is California, and the "Great news! We currently provide care in your state" message shows on an apparently empty field.
- The "notes for physician" textarea exists in the DOM but is hidden, so patients can't add context.
- Buttons show fake progress text ("Securing your information…", "Encrypting your data…").
- The progress bar order (Questions → Your Info → **Review → Note Details** → Payment) doesn't match the real order (Note Details comes before review/payment). `/review-details` is an orphaned legacy page linking to deleted routes (`tell-us-about-your-symptoms`, `note-info`).
- The payment page physician cards show **"Dr. Chihui Yu, MD" twice**. The correct name is **Yuan, DO**. The cards also say "Licensed Nationwide", which contradicts per-state licensing.

**🟡 Clinical review items (for the medical director, not engineering)**
- A healthy adult with fever **over 104°F** is only "conditional", not blocked.
- 7–17-year-olds pass the screener, but the Terms require a parent/guardian. No guardian info is collected.

---

## 6. Domain model (inferred, the basis for the new backend)

```
Patient ──< IntakeRequest >── Screening(answers, riskLevel, riskScore, outcome)
   │             │
   │             ├── ConsentRecord(version, acceptedAt, ip, userAgent)
   │             ├── LocationAttestation(state, ipGeoState, at)
   │             ├── AbsenceDetails(startDate, endDate, returnDate, workOrSchool)
   │             ├── Payment(stripePaymentIntent, amount, status, refund)
   │             └── Review(physicianId, decision, declineReason, signedAt, slaDeadline)
   │                       │
   │                       └── Note(noteId/publicRef, pdfKey, qrToken, issuingEntity[NoteForWork|Anyday], status[valid|revoked|corrected])
   │                                  └──< VerificationEvent(at, ipHash)  // employer lookups
Physician(npi, licenses[state, number, expiry], boardCerts, shifts[]) 
State(code, name, enabled)
RefundRequest(noteId, reason, status, employerRejection)
Article(slug, lang, category, author/reviewer, publishedAt, updatedAt)  // CMS
AuditLog(actor, action, entity, at)  // HIPAA
```

---

## 7. Proposed rebuild direction (for discussion; not final)

**Recommendation:** TypeScript monorepo (Turborepo + pnpm).

| App | Tech | Why |
|---|---|---|
| `apps/web` | **Next.js 15 (App Router, React 19)** | One codebase for marketing (SSG/ISR for SEO, preserving the `.html` URLs via rewrites or 301s) and the patient intake flow |
| `apps/portal` | Next.js (or the same app under `/portal`, role-gated) | Physician queue, signing, and admin (states, physicians, refunds, metrics) |
| `apps/api` | **NestJS** (or Fastify) + **PostgreSQL** + **Prisma** | Authoritative screening engine, payments, notes, verification, audit log |
| Workers | **BullMQ + Redis** | SLA timers (60-minute guarantee and auto-refund), PDF generation, email, physician paging |
| Shared | `packages/ui` (shadcn/ui + Tailwind with current tokens), `packages/screening` (rules as pure TS, shared FE preview and BE enforcement), `packages/types` (zod schemas) | |
| Integrations | Stripe (PaymentIntents, capture only after screen pass), Postmark/SES (BAA), S3 (encrypted PDFs), PDF via React-PDF or Puppeteer, signed QR tokens | |
| Hosting | **AWS with BAA** (ECS/Fargate or App Runner, RDS, S3, KMS) or Aptible/Render-HIPAA. Marketing can sit on Vercel *only if* no PHI touches it | |
| Analytics | PostHog self-hosted, or GA only on marketing pages. **No session replay on PHI pages** | |

Decisions to confirm before the architecture doc:
1. Keep one Next.js app for marketing and patient flow, or split them?
2. Backend: NestJS (structured, good for HIPAA audit modules) or Next.js route handlers only?
3. Hosting and BAA vendor (AWS vs. a managed HIPAA PaaS)?
4. Do we need to migrate existing data and notes from DrapCode (Note IDs must keep verifying)?
5. CMS for the articles (MDX in repo vs. headless CMS such as Sanity or Payload)?
6. Should the physician portal be in scope for v1?
