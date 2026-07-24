// Taxonomia clínica — espelha o ENUM clinical_category do banco (0001_init.sql).
// Use SEMPRE estes valores ao classificar chunks/extrações.

export const CLINICAL_CATEGORIES = [
  'medicacao', 'vitamina', 'suplemento', 'exame', 'diagnostico', 'conduta',
  'contraindicacao', 'interacao_medicamentosa', 'protocolo', 'alimentacao_dieta',
  'hormonios', 'obesidade_metabolismo', 'tireoide', 'diabetes', 'longevidade',
  'estetica', 'sono', 'dor', 'psiquiatria', 'outros',
] as const;

export type ClinicalCategory = (typeof CLINICAL_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ClinicalCategory, string> = {
  medicacao: 'Medicação',
  vitamina: 'Vitamina',
  suplemento: 'Suplemento',
  exame: 'Exame',
  diagnostico: 'Diagnóstico',
  conduta: 'Conduta',
  contraindicacao: 'Contraindicação',
  interacao_medicamentosa: 'Interação medicamentosa',
  protocolo: 'Protocolo',
  alimentacao_dieta: 'Alimentação/Dieta',
  hormonios: 'Hormônios',
  obesidade_metabolismo: 'Obesidade/Metabolismo',
  tireoide: 'Tireoide',
  diabetes: 'Diabetes',
  longevidade: 'Longevidade',
  estetica: 'Estética',
  sono: 'Sono',
  dor: 'Dor',
  psiquiatria: 'Psiquiatria',
  outros: 'Outros',
};

export function isCategory(v: string): v is ClinicalCategory {
  return (CLINICAL_CATEGORIES as readonly string[]).includes(v);
}
