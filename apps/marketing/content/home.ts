/**
 * Home-page content (EN/ES). Copy matches the live site design (2026-10-05).
 * Everything here is rendered as real HTML (no client-only text) so search engines index it,
 * and the FAQ / physician JSON-LD is generated from the same objects so it always matches.
 */
import type { Lang } from './i18n';

/**
 * Turnaround shown in the hero. The live site displayed a fixed "6 minutes" with *today's* date;
 * we show the figure with the date it was actually measured.
 * TODO(phase 4): replace with GET /v1/public/stats (median over the last 7 days) at build time.
 */
export const TURNAROUND = { minutes: 6, asOf: '2026-10-05' };

export interface Physician {
  id: string;
  name: string;
  degree: string; // shown after the name, e.g. "MD, MBA"
  photo: string;
  npi: string;
  languages: string[];
  specialty: string; // schema.org medicalSpecialty
}

export const PHYSICIANS: Physician[] = [
  { id: 'sidhu', name: 'Manavjeet Sidhu', degree: 'MD, MBA', photo: '/sidhu.jpg', npi: '1861849101', languages: ['English', 'Hindi'], specialty: 'Emergency' },
  { id: 'olivero', name: 'Daniel Olivero', degree: 'MD', photo: '/olivero.jpg', npi: '1902144512', languages: ['English', 'Spanish'], specialty: 'Pediatric' },
  { id: 'yuan', name: 'Chihui Yuan', degree: 'DO', photo: '/yuan.jpg', npi: '1922494848', languages: ['English', 'Mandarin', 'Japanese'], specialty: 'InternalMedicine' },
];

const en = {
  meta: {
    title: "Doctor's Note for Work Online | Get a Sick Note in 60 Minutes — NoteForWork",
    description:
      "Need a doctor's note for work or school? Get a legitimate signed sick note online in 60 minutes. No appointment, no video call. Board-certified physicians available 24/7.",
  },
  hero: {
    badge: ['Available 24/7', 'Board-certified physicians', '60-minute guarantee'],
    titleA: "The doctor's note that works",
    titleB: 'at 2am on a Sunday',
    bodyA: "Most services go dark in the evening. We don't. A licensed physician on our panel evaluates your intake and delivers your signed note in",
    bodyStrong: "60 minutes or it's free",
    bodyB: '— 24 hours a day, every day of the year.',
    reviewed: 'Reviewed by our board-certified physicians',
    turnaround: (m: number) => ['Current average turnaround:', `${m} minutes`],
    updated: 'updated',
    cta: 'Get My Note',
    chipQr: 'QR employer verification',
    chips: ['No appointment', 'No video call', 'No insurance needed'],
  },
  trust: ['SSL Secured', 'HIPAA-Compliant Infrastructure', 'SOC 2 Certified Infrastructure'],
  doctors: {
    eyebrow: 'Our medical team',
    titleA: 'Real doctors.',
    titleB: 'Real credentials. Real notes.',
    languages: 'Languages',
    npi: 'NPI',
    scrollHint: 'Scroll to see all physicians →',
    people: {
      sidhu: {
        cert: 'Board Certified — Emergency Medicine',
        role: 'Founder & Medical Director',
        bio: "Dr. Sidhu completed his undergraduate education at UCLA and earned his M.D. from NYU School of Medicine alongside an M.B.A. from NYU Stern School of Business. He completed his Emergency Medicine residency at UC San Francisco and currently serves as an Emergency and Inpatient Care Director in Loma Linda, California. A Milken Scholar and one of MedTech's Rising Stars of 2017, he founded NoteForWork to bring his emergency medicine expertise to accessible, physician-reviewed telehealth documentation.",
        langs: 'English, Hindi',
        tags: ['Board Certified MD', 'Emergency Medicine', 'Physician Founder', 'CA Licensed'],
      },
      olivero: {
        cert: 'Board Certified — Pediatrics & Addiction Medicine',
        role: 'Day Shift · 4 AM – 4 PM Pacific',
        bio: 'Dr. Olivero completed his medical degree at Universidad Iberoamericana (UNIBE) and his residency in Pediatrics at Lincoln Medical and Mental Health Center in the South Bronx — the same hospital where he was born. Throughout his career he has served as Medical Director for more than 10 practices across the United States.',
        langs: 'English, Spanish',
        tags: ['Board Certified MD', 'Pediatrics', 'Addiction Medicine', 'Physicians licensed nationwide · Service available in 35+ states + DC'],
      },
      yuan: {
        cert: 'Board Certified — Internal Medicine',
        role: 'Night Shift · 5 PM – 3 AM Pacific',
        bio: 'Dr. Yuan completed her medical degree at Touro University California College of Osteopathic Medicine and her residency in Internal Medicine at Manatee Memorial Hospital in Bradenton, Florida. Her fluency in Mandarin and Japanese allows her to connect with a wider range of patients. Outside of medicine she enjoys mystery novels, true crime podcasts, and documentaries.',
        langs: 'English, Mandarin, Japanese',
        tags: ['Board Certified DO', 'Internal Medicine', 'Physicians licensed nationwide · Service available in 35+ states + DC'],
      },
    } as Record<string, { cert: string; role: string; bio: string; langs: string; tags: string[] }>,
  },
  process: {
    eyebrow: 'The process',
    titleA: 'From symptom to signed note',
    titleB: 'in under an hour.',
    steps: [
      { icon: 'form', title: 'Fill out a short form', body: 'Answer a few questions about your symptoms online. Takes under 5 minutes, anytime.' },
      { icon: 'doctor', title: 'Physician review & sign-off', body: 'A licensed physician evaluates your intake and signs your documentation — clinically and legally valid in your state.' },
      { icon: 'inbox', title: 'Get your verified note', body: 'Your signed note arrives by email, ready to send to your employer or school.' },
    ],
  },
  why: {
    eyebrow: 'Why NoteForWork',
    titleA: 'Why patients choose',
    titleB: 'NoteForWork.',
    items: [
      { title: 'Your employer never sees your health details', body: 'Your symptoms stay between you and the physician, protected under HIPAA. Your note states only that you were evaluated and excused — and the employer verification portal confirms authenticity without revealing any health information.' },
      { title: 'Instant QR employer verification', body: 'Every note includes a QR code and unique Note ID linked to our secure verification portal. Your employer scans it and instantly confirms the note is authentic and the physician is licensed — no phone call, no hold music, no business hours required.' },
      { title: '100% accuracy — or we fix it free', body: 'Right name, right dates, right physician credentials, every time. If there is any error on your note for any reason, we correct it immediately at no charge. No back-and-forth, no delay.' },
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    titleA: 'Simple, flat pricing.',
    titleB: 'No surprises.',
    sub: 'One price. One note. Guaranteed correct and delivered fast.',
    badge: 'Launch price',
    oneTime: 'One-time payment · No subscription',
    included: [
      "Ready in 60 minutes — guaranteed or it's free",
      'Screened before payment — only pay if we can help',
      'Reviewed & signed by a board-certified physician',
      '100% accurate or we fix it immediately, no charge',
      'Available 24/7 — including weekends & holidays',
    ],
    cta: 'Get My Note',
  },
  testimonials: {
    eyebrow: 'What people say',
    titleA: 'Real patients.',
    titleB: 'Real turnaround.',
    submitted: 'Submitted',
    signed: 'Signed',
    turnaround: (m: number) => `${m} minute turnaround`,
    cta: 'Get My Note',
  },
  guarantee: {
    eyebrow: 'Our guarantee',
    titleA: 'You only pay when',
    titleB: 'we can help you.',
    intro:
      "Most services take your money first, then decide whether they can help. We don't. Our intake screener evaluates your symptoms before checkout — if your situation requires in-person care, you're told immediately and never charged. No waiting. No refund request. No frustration.",
    before: {
      label: 'Before you pay',
      title: 'Screened before checkout',
      body: "Our intake system evaluates your symptoms before you ever reach payment. If your presentation requires in-person care, you're directed there immediately — no charge, no wait, no refund needed.",
    },
    after: {
      label: 'After issuance',
      title: 'Employer Acceptance Guarantee',
      bodyA: 'If your employer refuses to accept your note, email',
      bodyB: 'within 14 days. We review within 2 business days and refund in full — no questions asked.',
    },
    highlightA: 'Unlike services that charge you first and decide later —',
    highlightB: 'you only pay when a physician can actually help you.',
    hrTitle: 'Most rejections are resolved before a refund is needed.',
    hrBodyA: "The majority of employer pushback isn't about the physician's credentials — it's an HR department that isn't familiar with telehealth documentation. We provide an",
    hrBodyStrong: 'Employer Information Sheet',
    hrBodyB:
      "you can forward directly to your HR department. It explains what NoteForWork is, confirms the signing physician's board certification and license number, answers common legal questions, and includes instructions for verifying the note's authenticity. Most cases resolve at that point.",
    steps: [
      { title: 'Forward the Employer Information Sheet to HR', body: 'Download it below and email it to your HR department or manager. It answers the most common questions employers have about telehealth documentation.' },
      { title: 'Still rejected? Email us.', bodyA: 'If your employer still refuses after reviewing the information sheet, email', bodyB: 'within 14 days with a brief description of what happened.' },
      { title: 'Refund processed within 5 business days.', body: 'We review your request within 2 business days and issue a full refund to your original payment method within 5 business days.' },
    ],
    download: 'Download Employer Information Sheet',
    fine:
      'Pre-payment screening: if your symptoms require in-person care, you are never charged. Employer Acceptance Guarantee: applies to employer rejections after note issuance. It does not apply if you changed your mind, or your employer accepted the note but took action for an unrelated reason.',
  },
  faq: {
    eyebrow: 'Common questions',
    title: 'Everything you need to know',
    items: [
      ['Will my employer actually accept this note?', "Yes — in the vast majority of cases. A note from a licensed telehealth physician is legally equivalent to one from an in-person visit. What HR cares about is whether the note comes from a real licensed provider with a verifiable license number — not whether you sat in a waiting room. Every note we issue includes the physician's name, license number, and NPI, all of which can be independently verified. If your employer has questions, we provide an Employer Information Sheet you can forward directly to HR. And if they still refuse, our Employer Acceptance Guarantee means you get a full refund."],
      ['Who reviews and signs my note?', "Every note is personally reviewed and signed by a licensed physician — never auto-generated, never delegated to non-physician staff. NoteForWork was founded by Dr. Manavjeet Sidhu, MD, a board-certified Emergency Medicine physician. Every physician on our platform is individually credentialed and holds an active unrestricted license in your state. The signing physician's name, license number, and NPI appear on every note."],
      ['How does the process actually work?', 'Complete a short intake form describing your symptoms — takes under 5 minutes on your phone or computer. A licensed physician on our panel receives your case, makes an independent clinical determination, and signs your note. If approved, it arrives in your email as a PDF within 60 minutes. No video call, no phone call, no waiting room.'],
      ['What if I need the note right now — at 2am or on a Sunday?', "That's exactly what we're built for. Most services close in the evening and process overnight requests \"first thing next business day\" — which means your note arrives after you were already supposed to be at work. NoteForWork has board-certified physicians available around the clock, every day of the year including weekends and holidays. The 60-minute guarantee applies at any hour."],
      ['What if my request is declined?', "You are screened before you ever pay. Our intake form evaluates your symptoms before checkout — if your presentation requires in-person evaluation or doesn't meet criteria for documentation, you're told immediately and directed to appropriate care. You will never be charged for a note that can't be issued. This is different from services that take payment first and issue a refund later."],
      ['What does the 60-minute guarantee mean exactly?', 'Your signed note is delivered to your email within 60 minutes of submitting your intake — guaranteed. If we miss that window for reasons within our control, your note is free. Once a physician approves your note, it is generated and sent almost instantly, so the 60-minute promise covers the entire process from submission to delivery, at any hour of the day.'],
      ['Can my employer verify the note is real?', "Yes — every note includes a QR code and unique Note ID linked to our employer verification portal at app.noteforwork.com/verify-note-details. An HR professional can scan the QR code or enter the Note ID and instantly see the note's authenticity, the physician's name and license number, and the dates covered — without any login required and without seeing any of your health information."],
      ['Is my health information protected?', "Yes. All health information you provide is protected under HIPAA and stored on HIPAA-compliant infrastructure. We will never share your health information with your employer, sell your data, or use it for marketing purposes. Our employer verification portal shows only the note's validity status — never any health information. Read our full HIPAA Notice of Privacy Practices for complete details."],
    ] as [string, string][],
  },
  finalCta: {
    titleA: 'Feeling unwell?',
    titleB: 'Get your note in the next 60 minutes.',
    body: 'Complete a short intake, and a licensed physician will review it and deliver your signed note — day or night.',
    cta: 'Get My Note',
  },
};

export type HomeContent = typeof en;

/** Patient reviews from the live site, verbatim (not translated — they are real quotes). */
export const TESTIMONIALS = [
  { quote: "Just wanted to say thanks. I wasnt feeling good but I didnt wanna sit at urgent care forever just to get a note for work. Your site made it super easy and I got my note way faster then I thought.", name: 'Julian H.', place: 'California', submitted: '4:22 PM', signed: '4:26 PM', minutes: 4 },
  { quote: 'Super quick. Got my note in 4 minutes.', name: 'Chance F.', place: null, submitted: '1:21 AM', signed: '1:26 AM', minutes: 5 },
  { quote: 'No issues from my boss.', name: 'Rob K.', place: null, submitted: '8:59 AM', signed: '9:12 AM', minutes: 13 },
];

const es: HomeContent = {
  meta: {
    title: 'Nota médica para el trabajo en línea | Obtén tu justificante en 60 minutos — NoteForWork',
    description:
      '¿Necesitas una nota médica para el trabajo o la escuela? Obtén un justificante médico legítimo y firmado en línea en 60 minutos. Sin cita ni videollamada. Médicos certificados disponibles 24/7.',
  },
  hero: {
    badge: ['Disponible 24/7', 'Médicos certificados', 'Garantía de 60 minutos'],
    titleA: 'La nota médica que funciona',
    titleB: 'a las 2 a. m. de un domingo',
    bodyA: 'La mayoría de los servicios cierran por la noche. Nosotros no. Un médico con licencia de nuestro equipo evalúa tu cuestionario y te entrega tu nota firmada en',
    bodyStrong: '60 minutos o es gratis',
    bodyB: '— las 24 horas, todos los días del año.',
    reviewed: 'Revisado por nuestros médicos certificados',
    turnaround: (m: number) => ['Tiempo promedio de entrega actual:', `${m} minutos`],
    updated: 'actualizado',
    cta: 'Obtener mi nota',
    chipQr: 'Verificación QR para el empleador',
    chips: ['Sin cita', 'Sin videollamada', 'Sin seguro médico'],
  },
  trust: ['Conexión SSL segura', 'Infraestructura conforme a HIPAA', 'Infraestructura con certificación SOC 2'],
  doctors: {
    eyebrow: 'Nuestro equipo médico',
    titleA: 'Médicos reales.',
    titleB: 'Credenciales reales. Notas reales.',
    languages: 'Idiomas',
    npi: 'NPI',
    scrollHint: 'Desliza para ver a todos los médicos →',
    people: {
      sidhu: {
        cert: 'Certificado — Medicina de Emergencias',
        role: 'Fundador y Director Médico',
        bio: 'El Dr. Sidhu cursó sus estudios universitarios en UCLA y obtuvo su título de médico (M.D.) en la Facultad de Medicina de NYU, junto con un M.B.A. de la Escuela de Negocios Stern de NYU. Realizó su residencia en Medicina de Emergencias en UC San Francisco y actualmente es Director de Atención de Emergencias y Hospitalización en Loma Linda, California. Becario Milken y una de las Estrellas Emergentes de MedTech de 2017, fundó NoteForWork para llevar su experiencia en medicina de emergencias a una documentación de telemedicina accesible y revisada por médicos.',
        langs: 'Inglés, hindi',
        tags: ['Médico certificado (MD)', 'Medicina de Emergencias', 'Médico fundador', 'Licencia en California'],
      },
      olivero: {
        cert: 'Certificado — Pediatría y Medicina de Adicciones',
        role: 'Turno de día · 4 a. m. – 4 p. m. (hora del Pacífico)',
        bio: 'El Dr. Olivero obtuvo su título de médico en la Universidad Iberoamericana (UNIBE) y realizó su residencia en Pediatría en el Lincoln Medical and Mental Health Center del sur del Bronx, el mismo hospital donde nació. A lo largo de su carrera ha sido Director Médico de más de 10 consultorios en todo Estados Unidos.',
        langs: 'Inglés, español',
        tags: ['Médico certificado (MD)', 'Pediatría', 'Medicina de Adicciones', 'Médicos con licencia en todo el país · Servicio en más de 35 estados + DC'],
      },
      yuan: {
        cert: 'Certificada — Medicina Interna',
        role: 'Turno de noche · 5 p. m. – 3 a. m. (hora del Pacífico)',
        bio: 'La Dra. Yuan obtuvo su título de médica en el Touro University California College of Osteopathic Medicine y realizó su residencia en Medicina Interna en el Manatee Memorial Hospital de Bradenton, Florida. Habla con fluidez mandarín y japonés, lo que le permite conectar con más pacientes. Fuera de la medicina, disfruta de las novelas de misterio, los pódcasts de crímenes reales y los documentales.',
        langs: 'Inglés, mandarín, japonés',
        tags: ['Médica certificada (DO)', 'Medicina Interna', 'Médicos con licencia en todo el país · Servicio en más de 35 estados + DC'],
      },
    },
  },
  process: {
    eyebrow: 'El proceso',
    titleA: 'De los síntomas a la nota firmada',
    titleB: 'en menos de una hora.',
    steps: [
      { icon: 'form', title: 'Completa un formulario breve', body: 'Responde unas preguntas sobre tus síntomas en línea. Toma menos de 5 minutos, a cualquier hora.' },
      { icon: 'doctor', title: 'Revisión y firma del médico', body: 'Un médico con licencia evalúa tu cuestionario y firma tu documentación, con validez clínica y legal en tu estado.' },
      { icon: 'inbox', title: 'Recibe tu nota verificada', body: 'Tu nota firmada llega por correo electrónico, lista para enviar a tu empleador o escuela.' },
    ],
  },
  why: {
    eyebrow: 'Por qué NoteForWork',
    titleA: 'Por qué los pacientes eligen',
    titleB: 'NoteForWork.',
    items: [
      { title: 'Tu empleador nunca ve tu información de salud', body: 'Tus síntomas quedan entre tú y el médico, protegidos por HIPAA. Tu nota solo indica que fuiste evaluado y justificado, y el portal de verificación confirma su autenticidad sin revelar ninguna información de salud.' },
      { title: 'Verificación QR inmediata para el empleador', body: 'Cada nota incluye un código QR y un ID de nota único vinculados a nuestro portal de verificación seguro. Tu empleador lo escanea y confirma al instante que la nota es auténtica y que el médico tiene licencia, sin llamadas, sin esperas y sin depender del horario de oficina.' },
      { title: '100% precisa, o la corregimos gratis', body: 'El nombre correcto, las fechas correctas y las credenciales correctas del médico, siempre. Si hay cualquier error en tu nota, lo corregimos de inmediato sin costo. Sin idas y vueltas, sin demoras.' },
    ],
  },
  pricing: {
    eyebrow: 'Precio',
    titleA: 'Precio único y sencillo.',
    titleB: 'Sin sorpresas.',
    sub: 'Un precio. Una nota. Correcta y entregada rápido, garantizado.',
    badge: 'Precio de lanzamiento',
    oneTime: 'Pago único · Sin suscripción',
    included: [
      'Lista en 60 minutos, garantizado, o es gratis',
      'Evaluación antes del pago: solo pagas si podemos ayudarte',
      'Revisada y firmada por un médico certificado',
      '100% precisa o la corregimos de inmediato, sin costo',
      'Disponible 24/7, incluso fines de semana y días festivos',
    ],
    cta: 'Obtener mi nota',
  },
  testimonials: {
    eyebrow: 'Lo que dicen',
    titleA: 'Pacientes reales.',
    titleB: 'Entregas reales.',
    submitted: 'Enviado',
    signed: 'Firmado',
    turnaround: (m: number) => `entrega en ${m} minutos`,
    cta: 'Obtener mi nota',
  },
  guarantee: {
    eyebrow: 'Nuestra garantía',
    titleA: 'Solo pagas cuando',
    titleB: 'podemos ayudarte.',
    intro:
      'La mayoría de los servicios cobran primero y después deciden si pueden ayudarte. Nosotros no. Nuestro cuestionario evalúa tus síntomas antes del pago: si tu situación requiere atención en persona, te lo decimos de inmediato y nunca se te cobra. Sin esperas. Sin solicitudes de reembolso. Sin frustraciones.',
    before: {
      label: 'Antes de pagar',
      title: 'Evaluación antes del pago',
      body: 'Nuestro sistema evalúa tus síntomas antes de que llegues al pago. Si tu caso requiere atención en persona, te orientamos de inmediato: sin cargo, sin esperas y sin necesidad de reembolso.',
    },
    after: {
      label: 'Después de la emisión',
      title: 'Garantía de aceptación del empleador',
      bodyA: 'Si tu empleador no acepta tu nota, escribe a',
      bodyB: 'dentro de los 14 días. Revisamos tu caso en 2 días hábiles y te reembolsamos el total, sin preguntas.',
    },
    highlightA: 'A diferencia de los servicios que cobran primero y deciden después,',
    highlightB: 'solo pagas cuando un médico realmente puede ayudarte.',
    hrTitle: 'La mayoría de los rechazos se resuelven antes de necesitar un reembolso.',
    hrBodyA:
      'En la mayoría de los casos, el problema no son las credenciales del médico, sino que el departamento de Recursos Humanos no conoce la documentación de telemedicina. Te ofrecemos una',
    hrBodyStrong: 'Hoja Informativa para Empleadores',
    hrBodyB:
      'que puedes enviar directamente a Recursos Humanos. Explica qué es NoteForWork, confirma la certificación y el número de licencia del médico firmante, responde preguntas legales comunes e incluye instrucciones para verificar la autenticidad de la nota. La mayoría de los casos se resuelven en ese punto.',
    steps: [
      { title: 'Envía la Hoja Informativa para Empleadores a RR. HH.', body: 'Descárgala abajo y envíala por correo a tu departamento de Recursos Humanos o a tu supervisor. Responde las preguntas más comunes de los empleadores sobre la documentación de telemedicina.' },
      { title: '¿Aún la rechazan? Escríbenos.', bodyA: 'Si tu empleador la sigue rechazando después de revisar la hoja informativa, escribe a', bodyB: 'dentro de los 14 días con una breve descripción de lo que pasó.' },
      { title: 'Reembolso en un máximo de 5 días hábiles.', body: 'Revisamos tu solicitud en 2 días hábiles y emitimos un reembolso completo a tu método de pago original en un máximo de 5 días hábiles.' },
    ],
    download: 'Descargar la Hoja Informativa para Empleadores (en inglés)',
    fine:
      'Evaluación previa al pago: si tus síntomas requieren atención en persona, nunca se te cobra. Garantía de aceptación del empleador: aplica a los rechazos del empleador después de emitida la nota. No aplica si cambiaste de opinión, o si tu empleador aceptó la nota pero tomó medidas por un motivo no relacionado.',
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Todo lo que necesitas saber',
    items: [
      ['¿Mi empleador realmente aceptará esta nota?', 'Sí, en la gran mayoría de los casos. Una nota de un médico de telemedicina con licencia tiene la misma validez legal que una de una visita en persona. A Recursos Humanos le importa que la nota provenga de un profesional con licencia real y un número de licencia verificable, no que hayas estado en una sala de espera. Cada nota que emitimos incluye el nombre del médico, su número de licencia y su NPI, todos verificables de forma independiente. Si tu empleador tiene preguntas, te ofrecemos una Hoja Informativa para Empleadores que puedes enviar directamente a RR. HH. Y si aun así la rechaza, nuestra Garantía de aceptación del empleador te reembolsa el total.'],
      ['¿Quién revisa y firma mi nota?', 'Cada nota es revisada y firmada personalmente por un médico con licencia: nunca se genera automáticamente ni se delega a personal no médico. NoteForWork fue fundada por el Dr. Manavjeet Sidhu, MD, médico certificado en Medicina de Emergencias. Cada médico de nuestra plataforma está acreditado individualmente y tiene una licencia activa y sin restricciones en tu estado. El nombre, el número de licencia y el NPI del médico firmante aparecen en cada nota.'],
      ['¿Cómo funciona exactamente el proceso?', 'Completa un breve cuestionario sobre tus síntomas; toma menos de 5 minutos desde tu teléfono o computadora. Un médico con licencia de nuestro equipo recibe tu caso, toma una decisión clínica independiente y firma tu nota. Si se aprueba, llega a tu correo electrónico en PDF en un máximo de 60 minutos. Sin videollamada, sin llamada telefónica, sin sala de espera.'],
      ['¿Y si necesito la nota ahora mismo, a las 2 a. m. o un domingo?', 'Para eso existimos. La mayoría de los servicios cierran por la noche y procesan las solicitudes nocturnas "a primera hora del siguiente día hábil", lo que significa que tu nota llega cuando ya deberías estar en el trabajo. NoteForWork tiene médicos certificados disponibles las 24 horas, todos los días del año, incluidos fines de semana y días festivos. La garantía de 60 minutos aplica a cualquier hora.'],
      ['¿Qué pasa si mi solicitud es rechazada?', 'Se te evalúa antes de pagar. Nuestro cuestionario revisa tus síntomas antes del pago: si tu caso requiere una evaluación en persona o no cumple los criterios para la documentación, te lo decimos de inmediato y te orientamos hacia la atención adecuada. Nunca se te cobrará por una nota que no se pueda emitir. Esto es diferente de los servicios que cobran primero y reembolsan después.'],
      ['¿Qué significa exactamente la garantía de 60 minutos?', 'Tu nota firmada llega a tu correo electrónico en un máximo de 60 minutos desde que envías tu cuestionario, garantizado. Si no cumplimos ese plazo por motivos bajo nuestro control, tu nota es gratis. Una vez que el médico aprueba tu nota, se genera y se envía casi al instante, así que la promesa de 60 minutos cubre todo el proceso, del envío a la entrega, a cualquier hora del día.'],
      ['¿Puede mi empleador verificar que la nota es real?', 'Sí. Cada nota incluye un código QR y un ID de nota único vinculados a nuestro portal de verificación para empleadores en app.noteforwork.com/verify-note-details. Un profesional de Recursos Humanos puede escanear el código QR o ingresar el ID de la nota y ver al instante su autenticidad, el nombre y el número de licencia del médico y las fechas cubiertas, sin iniciar sesión y sin ver nada de tu información de salud.'],
      ['¿Está protegida mi información de salud?', 'Sí. Toda la información de salud que proporcionas está protegida por HIPAA y se almacena en infraestructura conforme a HIPAA. Nunca compartiremos tu información de salud con tu empleador, no venderemos tus datos ni los usaremos con fines de marketing. Nuestro portal de verificación solo muestra si la nota es válida, nunca información de salud. Lee nuestro Aviso de Prácticas de Privacidad de HIPAA para conocer todos los detalles.'],
    ],
  },
  finalCta: {
    titleA: '¿Te sientes mal?',
    titleB: 'Obtén tu nota en los próximos 60 minutos.',
    body: 'Completa un breve cuestionario y un médico con licencia lo revisará y te entregará tu nota firmada, de día o de noche.',
    cta: 'Obtener mi nota',
  },
};

export const HOME: Record<Lang, HomeContent> = { en, es };
