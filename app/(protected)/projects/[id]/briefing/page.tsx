'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Download, Users, AlertTriangle, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Emergency numbers by country
const emergencyNumbers = {
  'Deutschland': { fire: '112', firstAid: '112', police: '110', isEU: true },
  'Österreich': { fire: '122', firstAid: '144', police: '133', isEU: true },
  'Schweiz': { fire: '118', firstAid: '144', police: '117', isEU: false },
  'Frankreich': { fire: '18', firstAid: '15', police: '17', isEU: true },
  'Italien': { fire: '115', firstAid: '118', police: '113', isEU: true },
  'Spanien': { fire: '080', firstAid: '061', police: '091', isEU: true },
  'Griechenland': { fire: '199', firstAid: '166', police: '100', isEU: true },
  'Niederlande': { fire: '112', firstAid: '112', police: '112', isEU: true },
  'Belgien': { fire: '112', firstAid: '112', police: '101', isEU: true },
  'Polen': { fire: '998', firstAid: '999', police: '997', isEU: true },
  'Tschechien': { fire: '150', firstAid: '155', police: '158', isEU: true },
  'Dänemark': { fire: '112', firstAid: '112', police: '114', isEU: true },
  'Schweden': { fire: '112', firstAid: '112', police: '112', isEU: true },
  'Norwegen': { fire: '110', firstAid: '113', police: '112', isEU: false },
  'Finnland': { fire: '112', firstAid: '112', police: '112', isEU: true },
  'Großbritannien': { fire: '999', firstAid: '999', police: '999', isEU: false },
  'USA': { fire: '911', firstAid: '911', police: '911', isEU: false },
  'Kanada': { fire: '911', firstAid: '911', police: '911', isEU: false },
};

const countries = Object.keys(emergencyNumbers);

export default function BriefingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [projectRiskAssessments, setProjectRiskAssessments] = useState<string[]>([]);
  const [globalRiskAssessments, setGlobalRiskAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('Deutschland');
  const [briefingData, setBriefingData] = useState({
    projectManager: '',
    safetyOfficer: '',
    emergencyContact: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Load project from localStorage
    const savedProjects = localStorage.getItem('gbu-projects');
    if (savedProjects) {
      try {
        const projects = JSON.parse(savedProjects);
        const foundProject = projects.find((p: any) => p.id === params.id);
        if (foundProject) {
          setProject(foundProject);
          setProjectRiskAssessments(foundProject.riskAssessmentIds || []);
        } else {
          router.push('/projects');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        router.push('/projects');
      }
    }

    // Load global risk assessments
    const savedGlobalAssessments = localStorage.getItem('gbu-global-risk-assessments');
    if (savedGlobalAssessments) {
      try {
        setGlobalRiskAssessments(JSON.parse(savedGlobalAssessments));
      } catch (error) {
        console.error('Error loading global risk assessments:', error);
      }
    }

    setLoading(false);
  }, [params.id, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !project) {
    return null;
  }

  const canManage = hasPermission(session.user.role, UserRole.PROJEKTLEITER);

  // Get current project's risk assessments
  const currentProjectAssessments = globalRiskAssessments.filter(a => 
    projectRiskAssessments.includes(a.id)
  );

  const handleInputChange = (field: string, value: string) => {
    setBriefingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateBriefingContent = () => {
    const emergencyNums = emergencyNumbers[selectedCountry as keyof typeof emergencyNumbers];
    
    return `
# SICHERHEITSUNTERWEISUNG
## ${project.title}

**Datum:** ${format(new Date(), 'dd.MM.yyyy', { locale: de })}
**Ort:** ${project.location}
**Veranstaltungszeitraum:** ${format(new Date(project.eventStart), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(project.eventEnd), 'dd.MM.yyyy', { locale: de })}

---

## ORGANISATION

**Projektleitung:** ${briefingData.projectManager || '[Name eintragen]'}
**Sicherheitsbeauftragte/r:** ${briefingData.safetyOfficer || '[Name eintragen]'}
**Notfallkontakt:** ${briefingData.emergencyContact || '[Telefonnummer eintragen]'}

---

## ALLGEMEINE HINWEISE

### Arbeitsschutz
- Persönliche Schutzausrüstung (PSA) ist entsprechend der Gefährdungsbeurteilung zu tragen
- Arbeitsplätze sind sauber und ordentlich zu halten
- Defekte Arbeitsmittel sind sofort zu melden und außer Betrieb zu nehmen
- Alkohol- und Drogenkonsum während der Arbeitszeit ist strengstens untersagt

### Verhalten bei Unfällen
- Ruhe bewahren und Unfallstelle absichern
- Erste Hilfe leisten (soweit möglich)
- Notruf absetzen (siehe Notfallnummern)
- Vorgesetzten/Sicherheitsbeauftragten informieren
- Unfall dokumentieren

### Arbeitszeiten und Pausen
- Arbeitszeiten gemäß Arbeitsvertrag einhalten
- Regelmäßige Pausen einhalten (spätestens nach 6 Stunden)
- Bei Übermüdung oder gesundheitlichen Problemen Arbeit einstellen

---

## IDENTIFIZIERTE GEFÄHRDUNGEN UND SCHUTZMAßNAHMEN

${currentProjectAssessments.map((assessment, index) => `
### ${index + 1}. ${assessment.activity}

**Gefährdung:** ${assessment.hazard}

**Schutzmaßnahmen:**
${assessment.substitution ? '- **Substitution:** Gefährliche Stoffe/Verfahren durch weniger gefährliche ersetzen' : ''}
${assessment.technical ? '- **Technische Maßnahmen:** Technische Schutzeinrichtungen verwenden' : ''}
${assessment.organizational ? '- **Organisatorische Maßnahmen:** Arbeitsabläufe und -anweisungen beachten' : ''}
${assessment.personal ? '- **Persönliche Schutzausrüstung:** Vorgeschriebene PSA tragen' : ''}
${assessment.measures ? `- **Zusätzliche Maßnahmen:** ${assessment.measures}` : ''}

**Risikobewertung:** ${assessment.riskValue} → **Restrisiko:** ${assessment.residualRisk}

`).join('')}

---

## NOTFALL UND RÄUMUNG

### Notfallnummern (${selectedCountry})
- **Feuerwehr:** ${emergencyNums.fire}
- **Rettungsdienst/Notarzt:** ${emergencyNums.firstAid}
- **Polizei:** ${emergencyNums.police}
${emergencyNums.isEU ? '\n**EU-weite Notrufnummer:** 112 (Feuerwehr und Rettungsdienst)' : ''}

### Verhalten im Notfall
1. **Ruhe bewahren**
2. **Gefahrenbereich verlassen** (wenn möglich)
3. **Notruf absetzen** (W-Fragen beachten)
4. **Erste Hilfe leisten** (soweit möglich)
5. **Einsatzkräfte einweisen**

### Räumung
- Bei Räumungsalarm sofort Arbeitsplatz verlassen
- Nächsten Fluchtweg benutzen (nicht Aufzug)
- Zum Sammelplatz begeben: **[Sammelplatz eintragen]**
- Vollständigkeit prüfen
- Auf weitere Anweisungen warten

### W-Fragen für Notruf
- **Wo** ist etwas passiert?
- **Was** ist passiert?
- **Wie viele** Verletzte?
- **Welche** Art der Verletzung?
- **Warten** auf Rückfragen!

---

## ERSTE HILFE

### Erste-Hilfe-Einrichtungen
- Erste-Hilfe-Kästen: **[Standorte eintragen]**
- Ersthelfer: **[Namen eintragen]**
- Sanitätsraum: **[Ort eintragen]**

### Wichtige Erste-Hilfe-Maßnahmen
- **Bewusstlosigkeit:** Stabile Seitenlage, Atemwege freihalten
- **Starke Blutung:** Druckverband anlegen, Schockbekämpfung
- **Verbrennungen:** Mit Wasser kühlen (10-15 Min.), nicht bei großflächigen Verbrennungen
- **Elektrounfall:** Stromzufuhr unterbrechen, dann Erste Hilfe

---

## ZUSÄTZLICHE HINWEISE

${briefingData.additionalNotes || '[Projektspezifische Hinweise hier eintragen]'}

---

**Unterschrift Teilnehmer/in:**

Name: _________________________ Unterschrift: _________________________ Datum: _________

**Diese Unterweisung wurde verstanden und wird befolgt.**

---

*Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr*
*Erstellt von: ${session.user.name}*
    `.trim();
  };

  const handleDownloadBriefing = () => {
    const content = generateBriefingContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sicherheitsunterweisung_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Unterweisung erfolgreich heruntergeladen!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Projekt
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Sicherheitsunterweisung</h1>
          <p className="text-muted-foreground">
            {project.title} - Automatisch generierte Unterweisung aus Gefährdungsbeurteilungen
          </p>
        </div>
        <Button onClick={handleDownloadBriefing}>
          <Download className="mr-2 h-4 w-4" />
          Unterweisung herunterladen
        </Button>
      </div>

      {currentProjectAssessments.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Keine Gefährdungsbeurteilungen vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fügen Sie erst Gefährdungsbeurteilungen hinzu, um eine Unterweisung zu erstellen.
              </p>
              <Button asChild>
                <Link href={`/projects/${project.id}/hazards`}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Gefährdungsbeurteilungen hinzufügen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentProjectAssessments.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Konfiguration</CardTitle>
                <CardDescription>
                  Einstellungen für die Sicherheitsunterweisung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Land (für Notfallnummern)</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectManager">Projektleitung</Label>
                  <Input
                    id="projectManager"
                    value={briefingData.projectManager}
                    onChange={(e) => handleInputChange('projectManager', e.target.value)}
                    placeholder="Name der Projektleitung"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyOfficer">Sicherheitsbeauftragte/r</Label>
                  <Input
                    id="safetyOfficer"
                    value={briefingData.safetyOfficer}
                    onChange={(e) => handleInputChange('safetyOfficer', e.target.value)}
                    placeholder="Name des Sicherheitsbeauftragten"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Notfallkontakt</Label>
                  <Input
                    id="emergencyContact"
                    value={briefingData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Telefonnummer für Notfälle"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Notfallnummern ({selectedCountry})
                </CardTitle>
                <CardDescription>
                  Automatisch eingefügte Notfallnummern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Feuerwehr</span>
                  <Badge variant="destructive" className="text-lg font-bold">
                    {emergencyNumbers[selectedCountry as keyof typeof emergencyNumbers].fire}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Rettungsdienst/Notarzt</span>
                  <Badge className="bg-blue-600 text-lg font-bold">
                    {emergencyNumbers[selectedCountry as keyof typeof emergencyNumbers].firstAid}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Polizei</span>
                  <Badge className="bg-green-600 text-lg font-bold">
                    {emergencyNumbers[selectedCountry as keyof typeof emergencyNumbers].police}
                  </Badge>
                </div>
                {emergencyNumbers[selectedCountry as keyof typeof emergencyNumbers].isEU && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <span className="font-medium">EU-Notruf (Feuerwehr & Rettung)</span>
                    <Badge className="bg-blue-800 text-lg font-bold">
                      112
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zusätzliche Hinweise</CardTitle>
              <CardDescription>
                Projektspezifische Ergänzungen zur Unterweisung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={briefingData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Zusätzliche projektspezifische Sicherheitshinweise, Besonderheiten, Sammelplätze, etc."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Einbezogene Gefährdungsbeurteilungen
              </CardTitle>
              <CardDescription>
                Diese Gefährdungen werden in die Unterweisung einbezogen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {currentProjectAssessments.map((assessment, index) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{index + 1}. {assessment.activity}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{assessment.hazard}</p>
                      <div className="flex gap-2 mt-2">
                        {assessment.substitution && <Badge variant="outline">S</Badge>}
                        {assessment.technical && <Badge variant="outline">T</Badge>}
                        {assessment.organizational && <Badge variant="outline">O</Badge>}
                        {assessment.personal && <Badge variant="outline">P</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Risiko: {assessment.riskValue}</div>
                      <div className="text-sm text-muted-foreground">Restrisiko: {assessment.residualRisk}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vorschau der Unterweisung</CardTitle>
              <CardDescription>
                So wird die generierte Sicherheitsunterweisung aussehen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generateBriefingContent()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}