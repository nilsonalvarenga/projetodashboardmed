'use client';
import ExtractionList from '@/components/ExtractionList';

export default function ConductsPage() {
  return (
    <ExtractionList
      kind="conduct"
      title="Condutas clínicas"
      subtitle="Condutas extraídas: problema clínico, critérios, passo a passo, exames, medicações/suplementação associadas e alertas."
    />
  );
}
