'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Shield, Plus, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';
import { generateRiskAssessmentPDF, downloadPDF } from '@/lib/pdf-risk-assessment';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RiskAssessment {
  id: string;
  activity: string;
  process: string;
  hazard: string;
  hazardFactors: string;
  severity: number;
  probability: number;
  riskValue: number;
  substitution: boolean;
  technical: boolean;
  organizational: boolean;
  personal: boolean;
  measures: string;
  severityAfter: number;
  probabilityAfter: number;
  residualRisk: number;
  group?: string;
  createdAt: string;
  updatedAt: string;
}

const getRiskColor = (risk: number): string => {
  if (risk <= 4) return 'bg-green-100 text-green-800';
  if (risk <= 8) return 'bg-yellow-100 text-yellow-800';
  if (risk <= 16) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getRiskLabel = (risk: number): string => {
  if (risk <= 4) return 'Niedrig';
  if (risk <= 8) return 'Mittel';
  if (risk <= 16) return 'Hoch';
  return 'Sehr hoch';
};

export default function ProjectHazardsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [globalRiskAssessments, setGlobalRiskAssessments] = useState<RiskAssessment[]>([]);
  const [projectRiskAssessments, setProjectRiskAssessments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAssessmentToggle = (assessmentId: string, checked: boolean) => {
    if (!canManage) return;

    let updatedAssessments: string[];
    if (checked) {
      updatedAssessments = [...projectRiskAssessments, assessmentId];
    } else {
      updatedAssessments = projectRiskAssessments.filter(id => id !== assessmentId);
    }

    setProjectRiskAssessments(updatedAssessments);

    // Update project in localStorage
    const savedProjects = localStorage.getItem('gbu-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p: any) => 
        p.id === project.id 
          ? { ...p, riskAssessmentIds: updatedAssessments }
          : p
      );
      localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
    }

    toast.success(checked ? 'Gefährdung hinzugefügt' : 'Gefährdung entfernt');
  };

  const handleExportPDF = async () => {
    try {
      const selectedAssessments = globalRiskAssessments.filter(a => 
        projectRiskAssessments.includes(a.id)
      );

      if (selectedAssessments.length === 0) {
        toast.error('Keine Gefährdungsbeurteilungen ausgewählt.');
        return;
      }

      const pdfBytes = await generateRiskAssessmentPDF(project, selectedAssessments);
      const filename = `Gefaehrdungsbeurteilung_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      downloadPDF(pdfBytes, filename);
      toast.success('PDF erfolgreich erstellt!');
    } catch (error) {
      toast.error('Fehler beim Erstellen der PDF.');
    }
  };

  const selectedAssessments = globalRiskAssessments.filter(a => 
    projectRiskAssessments.includes(a.id)
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Gefährdungen verwalten</h1>
          <p className="text-muted-foreground">
            {project.title} - Gefährdungsbeurteilungen auswählen und verwalten
          </p>
        </div>
        {canManage && selectedAssessments.length > 0 && (
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF Export
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{globalRiskAssessments.length}</p>
                <p className="text-sm text-muted-foreground">Verfügbare Gefährdungen</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{projectRiskAssessments.length}</p>
                <p className="text-sm text-muted-foreground">Ausgewählte Gefährdungen</p>
              </div>
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {selectedAssessments.reduce((sum, a) => sum + a.residualRisk, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Gesamt-Restrisiko</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {globalRiskAssessments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Keine Gefährdungen verfügbar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie erst Gefährdungsbeurteilungen in der globalen Bibliothek.
              </p>
              <Button asChild>
                <Link href="/admin/hazards">
                  <Plus className="mr-2 h-4 w-4" />
                  Gefährdungen erstellen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verfügbare Gefährdungsbeurteilungen
            </CardTitle>
            <CardDescription>
              Wählen Sie relevante Gefährdungen für dieses Projekt aus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {globalRiskAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id={assessment.id}
                    checked={projectRiskAssessments.includes(assessment.id)}
                    onCheckedChange={(checked) => handleAssessmentToggle(assessment.id, !!checked)}
                    disabled={!canManage}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{assessment.activity}</h4>
                        <p className="text-sm text-muted-foreground">{assessment.hazard}</p>
                        {assessment.hazardFactors && (
                          <p className="text-xs text-muted-foreground">{assessment.hazardFactors}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {assessment.group && (
                          <Badge variant="outline" className="text-xs">
                            {assessment.group}
                          </Badge>
                        )}
                        <div className="flex gap-2">
                          <Badge className={getRiskColor(assessment.riskValue)} title="Ursprüngliches Risiko">
                            {assessment.riskValue}
                          </Badge>
                          <Badge className={getRiskColor(assessment.residualRisk)} title="Restrisiko nach Maßnahmen">
                            {assessment.residualRisk}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">STOP:</span>
                      {assessment.substitution && <Badge variant="outline" className="text-xs">S</Badge>}
                      {assessment.technical && <Badge variant="outline" className="text-xs">T</Badge>}
                      {assessment.organizational && <Badge variant="outline" className="text-xs">O</Badge>}
                      {assessment.personal && <Badge variant="outline" className="text-xs">P</Badge>}
                    </div>

                    {assessment.measures && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <strong>Maßnahmen:</strong> {assessment.measures}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ausgewählte Gefährdungsbeurteilungen</CardTitle>
            <CardDescription>
              Diese Gefährdungen sind für das Projekt ausgewählt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">{assessment.activity}</h4>
                    <p className="text-sm text-muted-foreground">{assessment.hazard}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.group && (
                      <Badge variant="outline" className="text-xs">
                        {assessment.group}
                      </Badge>
                    )}
                    <Badge className={getRiskColor(assessment.residualRisk)}>
                      Restrisiko: {assessment.residualRisk}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}