/** Patient-app copy for both languages. The `Dict` type keeps keys identical. */
export type Lang = 'en' | 'es';

const en = {
  meta: { title: 'Start your visit · NoteForWork' },
  header: { back: 'Back', home: 'NoteForWork home' },
  steps: ['Location', 'Consent', 'Questions', 'Details', 'Dates', 'Payment'],
  location: {
    title: 'Where are you right now?',
    body: 'Physicians can only care for you in states where they are licensed, so we need your current physical location.',
    stateLabel: 'State you are in today',
    placeholder: 'Select your state…',
    unavailableSuffix: ' (not available yet)',
    unavailable: (name: string) => `We are not yet available in ${name}. Please check back soon.`,
    available: (name: string) => `Good news — we provide care in ${name}.`,
    attest: 'I confirm I am physically located in the state selected above right now.',
    submit: 'Continue →',
    submitting: 'Starting…',
    loadError: 'Could not load states. Please refresh.',
  },
  consent: {
    title: 'Telehealth consent',
    goToBottom: 'Go to bottom ↓',
    atEnd: 'At the end',
    agree: 'Agree & continue',
    readFirst: 'Read to the end to continue',
    saving: 'Saving…',
    version: (v: string, ref: string) => `Consent version ${v} · Request ${ref}`,
    doc: {
      heading: 'Before you begin',
      intro:
        'You are about to request a medical absence note through an asynchronous telehealth service. A licensed physician will review your information remotely.',
      agreeIntro: 'By continuing, you acknowledge and agree that:',
      points: [
        'You will not speak with a physician in real time.',
        'A licensed physician will review your written responses and determine whether an absence note is appropriate. This is not a diagnosis or treatment of your condition.',
        'This service is appropriate only for minor, self-limited illnesses. If you are experiencing a medical emergency, call 911.',
        'You have the right to withdraw from this service at any time.',
      ],
      law: 'This service is provided in accordance with California Business and Professions Code §2290.5 governing telehealth informed consent.',
      end: 'End of document',
      courtesy: null as string | null,
    },
  },
  questions: {
    eyebrow: 'Eligibility check',
    counter: (n: number, total: number) => `Question ${n} of ${total}`,
    followUp: 'Follow-up question',
    review: 'Review',
    onTrack: 'Looking good — you are on track to be eligible for a signed note.',
    risk: 'Some risk factors noted. You may still be eligible depending on your remaining answers.',
    reviewTitle: 'Review your answers',
    none: 'None',
    back: '← Back',
    continue: 'Continue →',
    submit: 'Check my eligibility',
    checking: 'Checking…',
    checkingAnswers: 'Checking your answers…',
  },
  result: {
    eligibleTitle: "You're eligible",
    eligibleBody: "A licensed physician can review your request. Next we'll collect your details and the dates you need covered.",
    notCharged: "You won't be charged unless a physician can help you.",
    nextPhase: 'Patient details, dates and payment arrive in Phase 2.',
    blockedTitle: 'Please get in-person care',
    blockedFallback: 'Your answers indicate you should be seen in person.',
    emergency: 'If this is an emergency, call 911 or go to the nearest emergency room.',
    notChargedBlocked: 'You have not been charged.',
    request: (ref: string) => `Request ${ref}`,
    backHome: '← Back to NoteForWork',
    block: {
      AGE_UNDER_7: 'Children 6 and under need to be seen in person by a pediatrician.',
      HIGH_FEVER_WITH_RISK_FACTOR: 'A high fever together with your other risk factors needs an in-person evaluation.',
      DURATION_OVER_7_DAYS: 'Symptoms lasting more than 7 days should be evaluated in person.',
      SYMPTOMS_WORSENING: 'Because your symptoms are getting worse, please see a clinician in person.',
      RED_FLAG_SYMPTOM: 'One or more of your symptoms needs prompt in-person care.',
      CANNOT_KEEP_FLUIDS_DOWN: 'Not being able to keep fluids down can lead to dehydration and needs in-person care.',
    } as Record<string, string>,
  },
  tags: { conditional: 'Conditional', high_risk: 'High risk' },
  errors: {
    STATE_UNAVAILABLE: 'We are not yet available in that state.',
    CONSENT_VERSION_MISMATCH: 'The consent document was updated. Please review it again.',
    CONSENT_REQUIRED: 'Please accept the telehealth consent first.',
    SCREENING_ALREADY_SUBMITTED: 'Your answers were already submitted for this request.',
    SCREENING_INCOMPLETE: 'Please answer all the questions.',
    INTAKE_EXPIRED: 'This request expired. Please start again.',
    NO_INTAKE: 'Your session ended. Please start again.',
    generic: 'Something went wrong. Please try again.',
  } as Record<string, string>,
};

export type Dict = typeof en;

const es: Dict = {
  meta: { title: 'Inicia tu consulta · NoteForWork' },
  header: { back: 'Atrás', home: 'Inicio de NoteForWork' },
  steps: ['Ubicación', 'Consentimiento', 'Preguntas', 'Datos', 'Fechas', 'Pago'],
  location: {
    title: '¿Dónde estás ahora mismo?',
    body: 'Los médicos solo pueden atenderte en los estados donde tienen licencia, por eso necesitamos saber tu ubicación física actual.',
    stateLabel: 'Estado en el que te encuentras hoy',
    placeholder: 'Selecciona tu estado…',
    unavailableSuffix: ' (aún no disponible)',
    unavailable: (name: string) => `Todavía no estamos disponibles en ${name}. Vuelve a consultar pronto.`,
    available: (name: string) => `Buenas noticias: ofrecemos atención en ${name}.`,
    attest: 'Confirmo que en este momento me encuentro físicamente en el estado seleccionado.',
    submit: 'Continuar →',
    submitting: 'Iniciando…',
    loadError: 'No se pudieron cargar los estados. Actualiza la página.',
  },
  consent: {
    title: 'Consentimiento para telemedicina',
    goToBottom: 'Ir al final ↓',
    atEnd: 'Llegaste al final',
    agree: 'Aceptar y continuar',
    readFirst: 'Lee hasta el final para continuar',
    saving: 'Guardando…',
    version: (v: string, ref: string) => `Versión del consentimiento ${v} · Solicitud ${ref}`,
    doc: {
      heading: 'Antes de comenzar',
      intro:
        'Estás a punto de solicitar una nota médica de ausencia a través de un servicio de telemedicina asíncrona. Un médico con licencia revisará tu información a distancia.',
      agreeIntro: 'Al continuar, reconoces y aceptas que:',
      points: [
        'No hablarás con un médico en tiempo real.',
        'Un médico con licencia revisará tus respuestas por escrito y determinará si corresponde emitir una nota de ausencia. Esto no es un diagnóstico ni un tratamiento de tu condición.',
        'Este servicio es apropiado solo para enfermedades leves y pasajeras. Si tienes una emergencia médica, llama al 911.',
        'Tienes derecho a retirarte de este servicio en cualquier momento.',
      ],
      law: 'Este servicio se presta de conformidad con el Código de Negocios y Profesiones de California §2290.5, que regula el consentimiento informado para telemedicina.',
      end: 'Fin del documento',
      courtesy: 'Traducción de cortesía. En caso de discrepancia, prevalece la versión en inglés.',
    },
  },
  questions: {
    eyebrow: 'Verificación de elegibilidad',
    counter: (n: number, total: number) => `Pregunta ${n} de ${total}`,
    followUp: 'Pregunta adicional',
    review: 'Revisión',
    onTrack: 'Todo va bien: vas en camino a ser elegible para una nota firmada.',
    risk: 'Notamos algunos factores de riesgo. Aún podrías ser elegible según tus demás respuestas.',
    reviewTitle: 'Revisa tus respuestas',
    none: 'Ninguno',
    back: '← Atrás',
    continue: 'Continuar →',
    submit: 'Verificar mi elegibilidad',
    checking: 'Verificando…',
    checkingAnswers: 'Verificando tus respuestas…',
  },
  result: {
    eligibleTitle: 'Eres elegible',
    eligibleBody: 'Un médico con licencia puede revisar tu solicitud. A continuación pediremos tus datos y las fechas que necesitas justificar.',
    notCharged: 'No se te cobrará a menos que un médico pueda ayudarte.',
    nextPhase: 'Los datos del paciente, las fechas y el pago llegan en la Fase 2.',
    blockedTitle: 'Por favor, busca atención en persona',
    blockedFallback: 'Tus respuestas indican que debes recibir atención en persona.',
    emergency: 'Si es una emergencia, llama al 911 o acude a la sala de emergencias más cercana.',
    notChargedBlocked: 'No se te ha cobrado nada.',
    request: (ref: string) => `Solicitud ${ref}`,
    backHome: '← Volver a NoteForWork',
    block: {
      AGE_UNDER_7: 'Los niños de 6 años o menos deben ser atendidos en persona por un pediatra.',
      HIGH_FEVER_WITH_RISK_FACTOR: 'Una fiebre alta junto con tus otros factores de riesgo requiere una evaluación en persona.',
      DURATION_OVER_7_DAYS: 'Los síntomas que duran más de 7 días deben evaluarse en persona.',
      SYMPTOMS_WORSENING: 'Como tus síntomas están empeorando, consulta a un profesional de salud en persona.',
      RED_FLAG_SYMPTOM: 'Uno o más de tus síntomas requieren atención en persona sin demora.',
      CANNOT_KEEP_FLUIDS_DOWN: 'No poder retener líquidos puede causar deshidratación y requiere atención en persona.',
    },
  },
  tags: { conditional: 'Condicional', high_risk: 'Riesgo alto' },
  errors: {
    STATE_UNAVAILABLE: 'Todavía no estamos disponibles en ese estado.',
    CONSENT_VERSION_MISMATCH: 'El documento de consentimiento se actualizó. Revísalo de nuevo.',
    CONSENT_REQUIRED: 'Primero acepta el consentimiento para telemedicina.',
    SCREENING_ALREADY_SUBMITTED: 'Tus respuestas ya se enviaron para esta solicitud.',
    SCREENING_INCOMPLETE: 'Responde todas las preguntas.',
    INTAKE_EXPIRED: 'Esta solicitud venció. Comienza de nuevo.',
    NO_INTAKE: 'Tu sesión terminó. Comienza de nuevo.',
    generic: 'Algo salió mal. Inténtalo de nuevo.',
  },
};

export const DICTS: Record<Lang, Dict> = { en, es };
export const t = (lang: Lang) => DICTS[lang];

/** In-app paths per language. */
export const startBase = (lang: Lang) => (lang === 'es' ? '/es/start' : '/start');

export const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'http://localhost:3000';
export const marketingHome = (lang: Lang) => `${MARKETING_URL}${lang === 'es' ? '/es' : '/'}`;

/** Localized message for an API error (by code), never the raw server text. */
export function errorMessage(lang: Lang, err: unknown): string {
  const code = (err as { body?: { code?: string } })?.body?.code;
  const d = t(lang).errors;
  return (code && d[code]) || d.generic!;
}
