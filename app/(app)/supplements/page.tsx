'use client';
import ExtractionList from '@/components/ExtractionList';

export default function SupplementsPage() {
  return (
    <ExtractionList
      kind="supplement"
      title="Vitaminas e suplementos"
      subtitle="Vitaminas/suplementos citados no acervo: dose, forma, sinais de deficiência, riscos, interações e exames relacionados."
    />
  );
}
