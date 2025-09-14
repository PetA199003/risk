import { HazardCategory } from '@prisma/client';

interface ProjectAnswers {
  isOutdoor: boolean;
  hasElectricity: boolean;
  hasGenerator: boolean;
  hasHazardousMaterials: boolean;
  hasWorkAbove2m: boolean;
  hasPublicAccess: boolean;
  hasNightWork: boolean;
  hasTrafficArea: boolean;
}

export function getRecommendedHazardTitles(answers: ProjectAnswers): string[] {
  const recommended: string[] = [];

  if (answers.isOutdoor) {
    recommended.push('Wetter und Unwetter');
    recommended.push('Stolper- und Sturzgefahr');
  }

  if (answers.hasElectricity) {
    recommended.push('Elektrische Gefährdung');
    recommended.push('Stolper- und Sturzgefahr'); // Kabel
  }

  if (answers.hasGenerator) {
    recommended.push('Kohlenmonoxid-Vergiftung');
    recommended.push('Lärmbelastung');
    recommended.push('Brandgefahr');
  }

  if (answers.hasWorkAbove2m) {
    recommended.push('Absturzgefahr');
  }

  if (answers.hasTrafficArea) {
    recommended.push('Fahrzeugverkehr');
  }

  if (answers.hasNightWork) {
    recommended.push('Sichtminderung bei Nachtarbeit');
    recommended.push('Ermüdung und Überlastung');
  }

  if (answers.hasHazardousMaterials) {
    // Hier könnte eine spezifische chemische Gefährdung hinzugefügt werden
    recommended.push('Brandgefahr');
  }

  // Allgemeine Gefährdungen, die fast immer relevant sind
  recommended.push('Ermüdung und Überlastung');
  recommended.push('Brandgefahr');

  // Duplikate entfernen
  return [...new Set(recommended)];
}