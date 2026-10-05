/** Every URL from the old tiiny.host site (sitemap + crawl, 2026-10-05) and where it lives now. */
export const LEGACY_URLS: { from: string; to: string; kind: 'rewrite' | 'redirect' }[] = [
  { from: '/index.html', to: '/', kind: 'redirect' },
  { from: '/resources.html', to: '/resources', kind: 'rewrite' },
  { from: '/privacy.html', to: '/legal/privacy', kind: 'rewrite' },
  { from: '/terms.html', to: '/legal/terms', kind: 'rewrite' },
  { from: '/hipaa-notice.html', to: '/legal/hipaa-notice', kind: 'rewrite' },
  { from: '/patient-consent.html', to: '/legal/patient-consent', kind: 'rewrite' },
  { from: '/careers.html', to: '/careers', kind: 'rewrite' },
  { from: '/nota-medica-para-el-trabajo.html', to: '/es/nota-medica-para-el-trabajo', kind: 'rewrite' },
  { from: '/employer-guide-telehealth-work-notes.html', to: '/resources/employer-guide-telehealth-work-notes', kind: 'rewrite' },
  { from: '/do-i-need-doctors-note-one-day-off-work.html', to: '/resources/do-i-need-doctors-note-one-day-off-work', kind: 'rewrite' },
  { from: '/can-you-get-fired-for-calling-in-sick.html', to: '/resources/can-you-get-fired-for-calling-in-sick', kind: 'rewrite' },
  { from: '/how-to-get-doctors-note-at-night-weekend.html', to: '/resources/how-to-get-doctors-note-at-night-weekend', kind: 'rewrite' },
  { from: '/can-employer-call-doctor-about-work-note.html', to: '/resources/can-employer-call-doctor-about-work-note', kind: 'rewrite' },
  { from: '/can-employer-deny-doctors-note.html', to: '/resources/can-employer-deny-doctors-note', kind: 'rewrite' },
  { from: '/what-makes-work-excuse-note-valid.html', to: '/resources/what-makes-work-excuse-note-valid', kind: 'rewrite' },
  // Duplicate topics → one canonical article each.
  { from: '/is-telehealth-doctors-note-valid-for-work.html', to: '/resources/telehealth-doctors-note-valid-for-work', kind: 'rewrite' },
  { from: '/telehealth-doctors-note-valid-for-work.html', to: '/is-telehealth-doctors-note-valid-for-work.html', kind: 'redirect' },
  { from: '/why-staying-home-sick-is-good-for-public-health.html', to: '/resources/staying-home-sick-public-health', kind: 'rewrite' },
  { from: '/staying-home-sick-public-health.html', to: '/why-staying-home-sick-is-good-for-public-health.html', kind: 'redirect' },
  // The invite-only assessment page moves behind real auth in the physician portal.
  { from: '/employment.html', to: '/careers.html', kind: 'redirect' },
];
