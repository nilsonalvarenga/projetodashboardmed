'use client';
import ExtractionList from '@/components/ExtractionList';

export default function ProtocolsPage() {
  return (
    <ExtractionList
      kind="protocol"
      title="Protocolos"
      subtitle="Protocolos extraídos do acervo. Só viram 'oficiais' após revisão e aprovação humana."
    />
  );
}
