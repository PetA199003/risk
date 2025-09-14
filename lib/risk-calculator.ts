export function calculateResidualRisk(
  likelihood: number,
  severity: number,
  mitigationFactor: number = 0.3
): number {
  const baseRisk = likelihood * severity;
  const residualRisk = Math.max(1, Math.round(baseRisk * (1 - mitigationFactor)));
  return residualRisk;
}

export function getRiskColor(risk: number): string {
  if (risk <= 5) return 'text-green-600 bg-green-100';
  if (risk <= 10) return 'text-yellow-600 bg-yellow-100';
  if (risk <= 15) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function getRiskLabel(risk: number): string {
  if (risk <= 5) return 'Niedrig';
  if (risk <= 10) return 'Mittel';
  if (risk <= 15) return 'Hoch';
  return 'Sehr hoch';
}