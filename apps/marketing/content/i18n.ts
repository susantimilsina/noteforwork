/**
 * UI and home-page copy for both languages. Article/legal bodies live in content/pages{,-es}.
 * Keep keys identical in `en` and `es` — the `Dict` type enforces it.
 */
export type Lang = 'en' | 'es';

const en = {
  langName: 'English',
  nav: { resources: 'Resources', faq: 'FAQ', cta: 'Get My Note →', switchTo: 'Español' },
  footer: {
    links: { resources: 'Resources', hr: 'For HR', careers: 'Careers', privacy: 'Privacy Policy', terms: 'Terms of Service', hipaa: 'HIPAA Notice', consent: 'Patient Consent' },
    operator:
      'NoteForWork is operated by Noteforwork PC, a California Professional Corporation. California Medical Board Fictitious Name Permits: NoteForWork #FNP562159, Anyday Medical Clinic #FNP561853.',
    emergency:
      'This service is intended for minor illnesses only and does not replace emergency medical care. If you are experiencing a medical emergency, call 911.',
  },
  cta: {
    title: 'Feeling unwell? Get your note in the next 60 minutes.',
    body: 'Complete a short intake and a licensed physician will review it and deliver your signed note, day or night.',
    button: (price: number) => `Get my note — $${price} →`,
  },
  resources: {
    label: 'Resources',
    title: "Your guide to doctor's notes, workplace rights, and sick days",
    subtitle: 'Practical, physician-reviewed information for employees, HR professionals, and employers.',
    read: 'Read article →',
    metaTitle: 'Patient Resources & Work Note Guide | NoteForWork',
    metaDescription: 'Physician-reviewed guides on doctor’s notes, sick days and workplace rights for employees and HR.',
  },
  careers: { label: "We're hiring", interestedA: 'Interested? Email', interestedB: '.' },
  legal: { courtesy: null as string | null },
  notFound: { title: 'Page not found', body: "That page doesn't exist or has moved.", back: 'Back to home' },
  dateLocale: 'en-US',
};

export type Dict = typeof en;

const es: Dict = {
  langName: 'Español',
  nav: { resources: 'Recursos', faq: 'Preguntas', cta: 'Obtener mi nota →', switchTo: 'English' },
  footer: {
    links: { resources: 'Recursos', hr: 'Para RR. HH.', careers: 'Empleo', privacy: 'Política de privacidad', terms: 'Términos del servicio', hipaa: 'Aviso HIPAA', consent: 'Consentimiento del paciente' },
    operator:
      'NoteForWork es operado por Noteforwork PC, una corporación profesional de California. Permisos de nombre ficticio de la Junta Médica de California: NoteForWork #FNP562159, Anyday Medical Clinic #FNP561853.',
    emergency:
      'Este servicio es solo para enfermedades leves y no sustituye la atención médica de emergencia. Si tienes una emergencia médica, llama al 911.',
  },
  cta: {
    title: '¿Te sientes mal? Obtén tu nota en los próximos 60 minutos.',
    body: 'Completa un breve cuestionario y un médico con licencia lo revisará y te entregará tu nota firmada, de día o de noche.',
    button: (price: number) => `Obtener mi nota — $${price} →`,
  },
  resources: {
    label: 'Recursos',
    title: 'Tu guía sobre notas médicas, derechos laborales y días de enfermedad',
    subtitle: 'Información práctica y revisada por médicos para empleados, profesionales de Recursos Humanos y empleadores.',
    read: 'Leer artículo →',
    metaTitle: 'Recursos para pacientes y guía de notas médicas | NoteForWork',
    metaDescription: 'Guías revisadas por médicos sobre notas médicas, días de enfermedad y derechos laborales para empleados y RR. HH.',
  },
  careers: { label: 'Estamos contratando', interestedA: '¿Le interesa? Escriba a', interestedB: '.' },
  legal: {
    courtesy:
      'Esta traducción se ofrece por cortesía. En caso de discrepancia, prevalece la versión en inglés.',
  },
  notFound: { title: 'Página no encontrada', body: 'Esta página no existe o se ha movido.', back: 'Volver al inicio' },
  dateLocale: 'es-US',
};

export const DICTS: Record<Lang, Dict> = { en, es };
export const t = (lang: Lang) => DICTS[lang];
