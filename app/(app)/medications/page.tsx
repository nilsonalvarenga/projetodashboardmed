'use client';
import ExtractionList from '@/components/ExtractionList';

export default function MedicationsPage() {
  return (
    <ExtractionList
      kind="medication"
      title="Medicações extraídas"
      subtitle="Medicações citadas no acervo, com dose, indicação, contraindicações e interações — sempre com a fonte interna. Apoio à decisão."
    />
  );
}
