import type { OptionTag, QuestionId } from './ruleset.js';

/**
 * Display copy for the questionnaire. Kept separate from the rules so wording/translation
 * changes never touch clinical logic. Option `tag` is a UI hint only; it does not affect scoring.
 */
export interface QuestionContent {
  id: QuestionId;
  kind: 'single' | 'multi';
  title: string;
  hint?: string;
  noneLabel?: string;
  options: { value: string; label: string; tag?: OptionTag }[];
}

export const QUESTIONS_EN: Record<QuestionId, QuestionContent> = {
  ageGroup: {
    id: 'ageGroup',
    kind: 'single',
    title: 'How old are you?',
    options: [
      { value: 'age_18_65', label: '18–65' },
      { value: 'age_7_17', label: '7–17' },
      { value: 'age_65_plus', label: '65+', tag: 'conditional' },
      { value: 'age_under_7', label: '6 and under', tag: 'high_risk' },
    ],
  },
  pregnant: {
    id: 'pregnant',
    kind: 'single',
    title: 'Are you pregnant or could you be pregnant?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes', tag: 'conditional' },
    ],
  },
  conditions: {
    id: 'conditions',
    kind: 'multi',
    title: 'Do you have any of the following conditions?',
    hint: 'Select all that apply, then continue (or choose None)',
    noneLabel: 'None of the following',
    options: [
      { value: 'diabetes', label: 'Diabetes', tag: 'conditional' },
      { value: 'heart_disease', label: 'Heart disease', tag: 'conditional' },
      { value: 'lung_disease', label: 'Lung disease (asthma/COPD)', tag: 'conditional' },
      { value: 'kidney_disease', label: 'Kidney disease', tag: 'conditional' },
      { value: 'liver_disease', label: 'Liver disease', tag: 'conditional' },
    ],
  },
  hasFever: {
    id: 'hasFever',
    kind: 'single',
    title: 'Do you have a fever?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes', tag: 'conditional' },
    ],
  },
  feverRange: {
    id: 'feverRange',
    kind: 'single',
    title: 'What is your current temperature?',
    options: [
      { value: 'f_100_102', label: '100.4–102°F' },
      { value: 'f_102_104', label: '102–104°F', tag: 'conditional' },
      { value: 'f_over_104', label: 'Over 104°F', tag: 'conditional' },
      { value: 'f_unknown', label: "Don't know" },
    ],
  },
  duration: {
    id: 'duration',
    kind: 'single',
    title: 'How many days have you had symptoms?',
    options: [
      { value: 'd_1_3', label: '1–3 days' },
      { value: 'd_4_7', label: '4–7 days' },
      { value: 'd_over_7', label: 'More than 7 days', tag: 'high_risk' },
    ],
  },
  trend: {
    id: 'trend',
    kind: 'single',
    title: 'How are your symptoms trending?',
    hint: 'Over the last 24 hours',
    options: [
      { value: 'better', label: 'Getting better' },
      { value: 'same', label: 'Staying the same' },
      { value: 'worse', label: 'Getting worse', tag: 'high_risk' },
    ],
  },
  redFlags: {
    id: 'redFlags',
    kind: 'multi',
    title: 'Red-flag screening',
    hint: 'Check any that apply, then continue (or choose None)',
    noneLabel: 'None of the following',
    options: [
      { value: 'severe_abdominal_pelvic_testicular_pain', label: 'Severe lower abdominal or pelvic pain, or testicular pain', tag: 'high_risk' },
      { value: 'recent_surgery_or_hospitalization', label: 'Surgery or hospitalization in the past 30 days', tag: 'high_risk' },
      { value: 'immunocompromised', label: 'Active cancer or chemotherapy, organ transplant recipient, or HIV/AIDS or other immunocompromising condition', tag: 'high_risk' },
      { value: 'shortness_of_breath_at_rest', label: 'Difficulty breathing or shortness of breath at rest (e.g., feeling winded while sitting still or walking short distances around your home)', tag: 'high_risk' },
      { value: 'chest_pain', label: 'Chest pain or pressure', tag: 'high_risk' },
      { value: 'repeated_vomiting', label: 'Repeated vomiting / unable to keep fluids down', tag: 'high_risk' },
      { value: 'decreased_urination', label: 'Significantly decreased urination or very dark urine', tag: 'high_risk' },
      { value: 'stiff_neck_headache', label: 'Stiff neck with severe headache and/or sensitivity to light', tag: 'high_risk' },
      { value: 'confusion_drowsiness', label: 'Confusion, unusual drowsiness, or difficulty staying awake', tag: 'high_risk' },
      { value: 'blood_cough_vomit_stool', label: 'Coughed up blood or blood in vomit or stool', tag: 'high_risk' },
    ],
  },
  canDrink: {
    id: 'canDrink',
    kind: 'single',
    title: 'Are you able to drink at least small amounts of fluid every hour?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No', tag: 'high_risk' },
    ],
  },
};

/** Spanish display copy. Same option values as QUESTIONS_EN — only labels differ. */
export const QUESTIONS_ES: Record<QuestionId, QuestionContent> = {
  ageGroup: {
    id: 'ageGroup',
    kind: 'single',
    title: '¿Cuántos años tienes?',
    options: [
      { value: 'age_18_65', label: '18–65' },
      { value: 'age_7_17', label: '7–17' },
      { value: 'age_65_plus', label: '65 o más', tag: 'conditional' },
      { value: 'age_under_7', label: '6 o menos', tag: 'high_risk' },
    ],
  },
  pregnant: {
    id: 'pregnant',
    kind: 'single',
    title: '¿Estás embarazada o podrías estarlo?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Sí', tag: 'conditional' },
    ],
  },
  conditions: {
    id: 'conditions',
    kind: 'multi',
    title: '¿Tienes alguna de las siguientes condiciones?',
    hint: 'Selecciona todas las que apliquen y continúa (o elige Ninguna)',
    noneLabel: 'Ninguna de las anteriores',
    options: [
      { value: 'diabetes', label: 'Diabetes', tag: 'conditional' },
      { value: 'heart_disease', label: 'Enfermedad del corazón', tag: 'conditional' },
      { value: 'lung_disease', label: 'Enfermedad pulmonar (asma/EPOC)', tag: 'conditional' },
      { value: 'kidney_disease', label: 'Enfermedad renal', tag: 'conditional' },
      { value: 'liver_disease', label: 'Enfermedad del hígado', tag: 'conditional' },
    ],
  },
  hasFever: {
    id: 'hasFever',
    kind: 'single',
    title: '¿Tienes fiebre?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Sí', tag: 'conditional' },
    ],
  },
  feverRange: {
    id: 'feverRange',
    kind: 'single',
    title: '¿Cuál es tu temperatura actual?',
    options: [
      { value: 'f_100_102', label: '100.4–102 °F (38–38.9 °C)' },
      { value: 'f_102_104', label: '102–104 °F (38.9–40 °C)', tag: 'conditional' },
      { value: 'f_over_104', label: 'Más de 104 °F (40 °C)', tag: 'conditional' },
      { value: 'f_unknown', label: 'No sé' },
    ],
  },
  duration: {
    id: 'duration',
    kind: 'single',
    title: '¿Cuántos días llevas con síntomas?',
    options: [
      { value: 'd_1_3', label: '1–3 días' },
      { value: 'd_4_7', label: '4–7 días' },
      { value: 'd_over_7', label: 'Más de 7 días', tag: 'high_risk' },
    ],
  },
  trend: {
    id: 'trend',
    kind: 'single',
    title: '¿Cómo han evolucionado tus síntomas?',
    hint: 'En las últimas 24 horas',
    options: [
      { value: 'better', label: 'Están mejorando' },
      { value: 'same', label: 'Siguen igual' },
      { value: 'worse', label: 'Están empeorando', tag: 'high_risk' },
    ],
  },
  redFlags: {
    id: 'redFlags',
    kind: 'multi',
    title: 'Síntomas de alarma',
    hint: 'Marca los que apliquen y continúa (o elige Ninguno)',
    noneLabel: 'Ninguno de los anteriores',
    options: [
      { value: 'severe_abdominal_pelvic_testicular_pain', label: 'Dolor intenso en la parte baja del abdomen, la pelvis o los testículos', tag: 'high_risk' },
      { value: 'recent_surgery_or_hospitalization', label: 'Cirugía u hospitalización en los últimos 30 días', tag: 'high_risk' },
      { value: 'immunocompromised', label: 'Cáncer activo o quimioterapia, trasplante de órganos, o VIH/SIDA u otra condición que debilite el sistema inmunitario', tag: 'high_risk' },
      { value: 'shortness_of_breath_at_rest', label: 'Dificultad para respirar o falta de aire en reposo (p. ej., sentirte sin aliento estando sentado o al caminar distancias cortas en casa)', tag: 'high_risk' },
      { value: 'chest_pain', label: 'Dolor o presión en el pecho', tag: 'high_risk' },
      { value: 'repeated_vomiting', label: 'Vómitos repetidos / no puedes retener líquidos', tag: 'high_risk' },
      { value: 'decreased_urination', label: 'Orinas mucho menos de lo normal o la orina es muy oscura', tag: 'high_risk' },
      { value: 'stiff_neck_headache', label: 'Rigidez en el cuello con dolor de cabeza intenso y/o sensibilidad a la luz', tag: 'high_risk' },
      { value: 'confusion_drowsiness', label: 'Confusión, somnolencia inusual o dificultad para mantenerte despierto', tag: 'high_risk' },
      { value: 'blood_cough_vomit_stool', label: 'Tos con sangre o sangre en el vómito o las heces', tag: 'high_risk' },
    ],
  },
  canDrink: {
    id: 'canDrink',
    kind: 'single',
    title: '¿Puedes beber al menos pequeñas cantidades de líquido cada hora?',
    options: [
      { value: 'yes', label: 'Sí' },
      { value: 'no', label: 'No', tag: 'high_risk' },
    ],
  },
};

export const questionsFor = (lang: 'en' | 'es') => (lang === 'es' ? QUESTIONS_ES : QUESTIONS_EN);
