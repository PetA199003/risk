'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Edit, Trash2, Shield, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Gefährdungs- und Belastungsfaktoren
const hazardFactors = [
  '1. Mechanische Gefährdung',
  '2. Elektrische Gefährdung',
  '3. Gefahrstoffe',
  '4. Biologische Gefährdung',
  '5. Brand- und Explosionsgefährdung',
  '6. Thermische Gefährdung',
  '7. Gefährdung durch spezielle physikalische Einwirkungen',
  '8. Gefährdung/Belastung durch Arbeitsumgebungsbedingungen',
  '9. Physische Belastung/Arbeitsschwere',
  '10. Wahrnehmung und Handlung',
  '11. Psychische Gefährdung',
  '12. Sonstige Gefährdungen/Belastungen'
];

// Risk assessment data structure matching your PDF format
interface RiskAssessment {
  id: string;
  activity: string; // Tätigkeit
  process: string; // Vorgang
  hazard: string; // Gefährdung
  hazardFactors: string; // Gefährdungs- und Belastungsfaktoren
  severity: number; // Schadensschwere/Gefährdung (1-4)
  probability: number; // Wahrscheinlichkeit (1-4)
  riskValue: number; // Risikobewertung (S²×W)
  substitution: boolean; // S (Substitution)
  technical: boolean; // T (Technisch)
  organizational: boolean; // O (Organisatorisch)
  personal: boolean; // P (Persönlich)
  measures: string; // Maßnahmen
  severityAfter: number; // S nach Maßnahmen
  probabilityAfter: number; // W nach Maßnahmen
  residualRisk: number; // R = S²×W nach Maßnahmen
  group?: string; // Added group property
  createdAt: string;
  updatedAt: string;
}

// Risk calculation function using S²×W formula
const calculateRisk = (severity: number, probability: number): number => {
  return severity * severity * probability;
};

// Risk color coding based on S²×W values
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

// Severity and probability labels
const severityLabels = {
  1: '1 - Leichte Verletzungen / Erkrankungen',
  2: '2 - Mittlere Verletzungen / Erkrankungen',
  3: '3 - Schwere Verletzungen/bleibende Schäden/Möglicher Tod'
};

const probabilityLabels = {
  1: '1 - Unwahrscheinlich',
  2: '2 - Wahrscheinlich',
  3: '3 - Sehr wahrscheinlich'
};

export default function HazardsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [projectRiskAssessments, setProjectRiskAssessments] = useState<string[]>([]); // Only store IDs
  const [globalRiskAssessments, setGlobalRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGlobalAssessments, setSelectedGlobalAssessments] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    activity: '',
    process: '',
    hazard: '',
    hazardFactors: '',
    severity: 1,
    probability: 1,
    substitution: false,
    technical: false,
    organizational: false,
    personal: false,
    measures: '',
    severityAfter: 1,
    probabilityAfter: 1,
    group: 'none',
    newGroupName: '',
  });

  // Load global groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('gbu-global-groups');
    if (savedGroups) {
      try {
        setAvailableGroups(JSON.parse(savedGroups));
      } catch (error) {
        console.error('Error loading groups:', error);
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
  }, []);

  // Save groups to localStorage whenever they change
  const saveGroupsToStorage = (groups: string[]) => {
    localStorage.setItem('gbu-global-groups', JSON.stringify(groups));
    setAvailableGroups(groups);
  };

  // Save global risk assessments to localStorage
  const saveGlobalAssessmentsToStorage = (assessments: RiskAssessment[]) => {
    localStorage.setItem('gbu-global-risk-assessments', JSON.stringify(assessments));
    setGlobalRiskAssessments(assessments);
  };

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
    } else {
      router.push('/projects');
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      activity: '',
      process: '',
      hazard: '',
      hazardFactors: '',
      severity: 1,
      probability: 1,
      substitution: false,
      technical: false,
      organizational: false,
      personal: false,
      measures: '',
      severityAfter: 1,
      probabilityAfter: 1,
      group: 'none',
      newGroupName: '',
    });
    setEditingAssessment(null);
  };

  const handleEdit = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment);
    setFormData({
      activity: assessment.activity,
      process: assessment.process,
      hazard: assessment.hazard,
      hazardFactors: assessment.hazardFactors,
      severity: assessment.severity,
      probability: assessment.probability,
      substitution: assessment.substitution,
      technical: assessment.technical,
      organizational: assessment.organizational,
      personal: assessment.personal,
      measures: assessment.measures,
      severityAfter: assessment.severityAfter,
      probabilityAfter: assessment.probabilityAfter,
      group: assessment.group || 'none',
      newGroupName: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.activity || !formData.hazard) {
        toast.error('Tätigkeit und Gefährdung sind erforderlich.');
        return;
      }

      const riskValue = calculateRisk(formData.severity, formData.probability);
      const residualRisk = calculateRisk(formData.severityAfter, formData.probabilityAfter);

      // Determine the actual group value
      let actualGroup = '';
      if (formData.group === 'new' && formData.newGroupName) {
        actualGroup = formData.newGroupName.trim();
      } else if (formData.group !== 'none' && formData.group !== 'new') {
        actualGroup = formData.group;
      }

      let updatedGlobalAssessments;

      if (editingAssessment) {
        // Update existing assessment
        const updatedAssessment: RiskAssessment = {
          ...editingAssessment,
          activity: formData.activity,
          process: formData.process,
          hazard: formData.hazard,
          hazardFactors: formData.hazardFactors,
          severity: formData.severity,
          probability: formData.probability,
          substitution: formData.substitution,
          technical: formData.technical,
          organizational: formData.organizational,
          personal: formData.personal,
          measures: formData.measures,
          severityAfter: formData.severityAfter,
          probabilityAfter: formData.probabilityAfter,
          group: actualGroup,
          riskValue,
          residualRisk,
          updatedAt: new Date().toISOString(),
        };
        
        updatedGlobalAssessments = globalRiskAssessments.map(a => 
          a.id === editingAssessment.id ? updatedAssessment : a
        );
        toast.success('Gefährdungsbeurteilung erfolgreich aktualisiert!');
      } else {
        // Create new assessment
        const newAssessment: RiskAssessment = {
          id: Date.now().toString(),
          activity: formData.activity,
          process: formData.process,
          hazard: formData.hazard,
          hazardFactors: formData.hazardFactors,
          severity: formData.severity,
          probability: formData.probability,
          substitution: formData.substitution,
          technical: formData.technical,
          organizational: formData.organizational,
          personal: formData.personal,
          measures: formData.measures,
          severityAfter: formData.severityAfter,
          probabilityAfter: formData.probabilityAfter,
          group: actualGroup,
          riskValue,
          residualRisk,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedGlobalAssessments = [...globalRiskAssessments, newAssessment];
        
        // Add to current project
        const updatedProjectAssessments = [...projectRiskAssessments, newAssessment.id];
        setProjectRiskAssessments(updatedProjectAssessments);
        
        // Update project in localStorage
        const savedProjects = localStorage.getItem('gbu-projects');
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          const updatedProjects = projects.map((p: any) => 
            p.id === project.id 
              ? { ...p, riskAssessmentIds: updatedProjectAssessments }
              : p
          );
          localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
        }
        
        toast.success('Gefährdungsbeurteilung erfolgreich erstellt!');
      }

      // Update global assessments
      setGlobalRiskAssessments(updatedGlobalAssessments);
      saveGlobalAssessmentsToStorage(updatedGlobalAssessments);

      // Add new group to global groups if it doesn't exist
      if (actualGroup && !availableGroups.includes(actualGroup)) {
        const updatedGroups = [...availableGroups, actualGroup].sort();
        saveGroupsToStorage(updatedGroups);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Fehler beim Speichern der Gefährdungsbeurteilung.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Gefährdungsbeurteilung aus dem Projekt entfernen möchten?')) {
      return;
    }

    try {
      const updatedProjectAssessments = projectRiskAssessments.filter(id => id !== assessmentId);
      setProjectRiskAssessments(updatedProjectAssessments);

      // Update project in localStorage
      const savedProjects = localStorage.getItem('gbu-projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const updatedProjects = projects.map((p: any) => 
          p.id === project.id 
            ? { ...p, riskAssessmentIds: updatedProjectAssessments }
            : p
        );
        localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
      }

      toast.success('Gefährdungsbeurteilung aus Projekt entfernt!');
    } catch (error) {
      toast.error('Fehler beim Entfernen der Gefährdungsbeurteilung.');
    }
  };

  const handleSelectFromGlobal = () => {
    setSelectedGlobalAssessments([]);
    setIsSelectDialogOpen(true);
  };

  const handleAddSelectedAssessments = () => {
    const idsToAdd = globalRiskAssessments.filter(a => 
      selectedGlobalAssessments.includes(a.id)
    ).map(a => a.id);

    const updatedProjectAssessments = [...new Set([...projectRiskAssessments, ...idsToAdd])];
    setProjectRiskAssessments(updatedProjectAssessments);

    // Update project in localStorage
    const savedProjects = localStorage.getItem('gbu-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p: any) => 
        p.id === project.id 
          ? { ...p, riskAssessmentIds: updatedProjectAssessments }
          : p
      );
      localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
    }

    setIsSelectDialogOpen(false);
    toast.success(`${idsToAdd.length} Gefährdungsbeurteilungen hinzugefügt!`);
  };

  const canManage = hasPermission(session.user.role, UserRole.PROJEKTLEITER);
  const isAdmin = hasPermission(session.user.role, UserRole.ADMIN);

  const currentRisk = calculateRisk(formData.severity, formData.probability);
  const currentResidualRisk = calculateRisk(formData.severityAfter, formData.probabilityAfter);

  // Get current project's risk assessments
  const currentProjectAssessments = globalRiskAssessments.filter(a => 
    projectRiskAssessments.includes(a.id)
  );

  // Filter assessments by selected group
  const filteredAssessments = selectedGroup === 'all' 
    ? currentProjectAssessments 
    : currentProjectAssessments.filter(a => a.group === selectedGroup);

  // Get groups that are actually used in current project
  const usedGroups = [...new Set(currentProjectAssessments.map(a => a.group).filter(Boolean))];

  const handleGroupInputChange = (value: string) => {
    if (value === 'none') {
      handleInputChange('group', 'none');
      handleInputChange('newGroupName', '');
    } else if (value === 'new') {
      handleInputChange('group', 'new');
      handleInputChange('newGroupName', '');
    } else {
      handleInputChange('group', value);
      handleInputChange('newGroupName', '');
    }
  };

  // Generate HTML content for PDF export
  const generateRiskAssessmentHTML = (project: any, assessments: any[]) => {
    const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Gefährdungsbeurteilung - ${project.title}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 15mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .legend-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            gap: 20px;
        }
        
        .legend-box {
            border: 1px solid #000;
            padding: 10px;
            flex: 1;
        }
        
        .legend-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            background-color: #f0f0f0;
            padding: 5px;
        }
        
        .severity-item, .probability-item {
            display: flex;
            align-items: center;
            margin: 3px 0;
        }
        
        .color-box {
            width: 12px;
            height: 12px;
            margin-right: 5px;
            border: 1px solid #000;
        }
        
        .green { background-color: #00ff00; }
        .yellow { background-color: #ffff00; }
        .red { background-color: #ff0000; }
        
        .stop-box {
            background-color: #e6f3ff;
            border: 1px solid #000;
            padding: 10px;
            width: 200px;
        }
        
        .stop-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .stop-item {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 8px;
        }
        
        .stop-letter {
            font-weight: bold;
            color: #ff8800;
            width: 15px;
        }
        
        .stop-level {
            color: #ff8800;
            font-weight: bold;
        }
        
        .formula {
            text-align: center;
            margin: 10px 0;
            font-size: 12px;
            font-weight: bold;
        }
        
        .assessment-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 8px;
        }
        
        .assessment-table th,
        .assessment-table td {
            border: 1px solid #000;
            padding: 3px;
            text-align: left;
            vertical-align: top;
        }
        
        .assessment-table th {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: center;
        }
        
        .assessment-table tr:nth-child(even) {
            background-color: #f8f8f8;
        }
        
        .risk-low { background-color: #90EE90; color: #006400; }
        .risk-medium { background-color: #FFD700; color: #B8860B; }
        .risk-high { background-color: #FFA500; color: #FF4500; }
        .risk-very-high { background-color: #FF6B6B; color: #8B0000; }
        
        .footer {
            margin-top: 20px;
            font-size: 8px;
            color: #666;
            display: flex;
            justify-content: space-between;
        }
        
        .truncate {
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        @media print {
            body { print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        Gefährdungsbeurteilung: ${project.title}
    </div>
    
    <div class="legend-container">
        <div class="legend-box">
            <div class="legend-title">Schadensschwere<br>(S 1-3)</div>
            <div class="severity-item">
                <div class="color-box green"></div>
                <span>1 Leichte Verletzungen /</span>
            </div>
            <div class="severity-item">
                <div class="color-box yellow"></div>
                <span>2 Mittlere Verletzungen /</span>
            </div>
            <div class="severity-item">
                <div class="color-box red"></div>
                <span>3 Schwere</span>
            </div>
        </div>
        
        <div class="legend-box">
            <div class="legend-title">Wahrscheinlichkeit<br>(W 1-3)</div>
            <div class="probability-item">
                <div class="color-box green"></div>
                <span>1 unwah</span>
            </div>
            <div class="probability-item">
                <div class="color-box yellow"></div>
                <span>2 wahrs</span>
            </div>
            <div class="probability-item">
                <div class="color-box red"></div>
                <span>3 sehr</span>
            </div>
        </div>
        
        <div class="stop-box">
            <div class="stop-title">STOP-PRINZIP</div>
            <div style="font-size: 8px; text-align: center; margin-bottom: 5px;">SAFETY LEVEL</div>
            <div class="stop-item">
                <span class="stop-letter">S</span>
                <span>Substitution durch sichere Optionen</span>
                <span class="stop-level">++++</span>
            </div>
            <div class="stop-item">
                <span class="stop-letter">T</span>
                <span>Technische Lösungen</span>
                <span class="stop-level">+++</span>
            </div>
            <div class="stop-item">
                <span class="stop-letter">O</span>
                <span>Organisatorische und funktionelle Lösungen</span>
                <span class="stop-level">++</span>
            </div>
            <div class="stop-item">
                <span class="stop-letter">P</span>
                <span>Persönliche Schutzausrüstung</span>
                <span class="stop-level">+</span>
            </div>
        </div>
    </div>
    
    <div class="formula">
        Risikobewertungsformel: S² × W
    </div>
    
    <table class="assessment-table">
        <thead>
            <tr>
                <th style="width: 30px;">Pos.</th>
                <th style="width: 80px;">Tätigkeit</th>
                <th style="width: 80px;">Vorgang</th>
                <th style="width: 100px;">Gefährdung</th>
                <th style="width: 120px;">Gefährdungs- und<br>Belastungsfaktoren</th>
                <th style="width: 25px;">Schadensschwere/<br>Gefährdung</th>
                <th style="width: 25px;">Wahrscheinlichkeit</th>
                <th style="width: 25px;">Risikobewertung</th>
                <th style="width: 25px;">Substitution</th>
                <th style="width: 25px;">Technisch</th>
                <th style="width: 25px;">Organisatorisch</th>
                <th style="width: 25px;">Persönlich</th>
                <th style="width: 100px;">Maßnahmen</th>
                <th style="width: 25px;">S</th>
                <th style="width: 25px;">W</th>
                <th style="width: 25px;">R</th>
            </tr>
            <tr style="background-color: #d0d0d0; font-size: 7px;">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>1-3</td>
                <td>1-3</td>
                <td>S²×W</td>
                <td>S</td>
                <td>T</td>
                <td>O</td>
                <td>P</td>
                <td></td>
                <td>1-3</td>
                <td>1-3</td>
                <td>S²×W</td>
            </tr>
        </thead>
        <tbody>
            ${assessments.map((assessment, index) => {
              const getRiskClass = (risk: number) => {
                if (risk <= 4) return 'risk-low';
                if (risk <= 8) return 'risk-medium';
                if (risk <= 16) return 'risk-high';
                return 'risk-very-high';
              };
              
              return `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td class="truncate" title="${assessment.activity}">${assessment.activity}</td>
                    <td class="truncate" title="${assessment.process || '-'}">${assessment.process || '-'}</td>
                    <td class="truncate" title="${assessment.hazard}">${assessment.hazard}</td>
                    <td class="truncate" title="${assessment.hazardFactors || '-'}">${assessment.hazardFactors || '-'}</td>
                    <td style="text-align: center;">${assessment.severity}</td>
                    <td style="text-align: center;">${assessment.probability}</td>
                    <td style="text-align: center;" class="${getRiskClass(assessment.riskValue)}">${assessment.riskValue}</td>
                    <td style="text-align: center;">${assessment.substitution ? '✓' : '-'}</td>
                    <td style="text-align: center;">${assessment.technical ? '✓' : '-'}</td>
                    <td style="text-align: center;">${assessment.organizational ? '✓' : '-'}</td>
                    <td style="text-align: center;">${assessment.personal ? '✓' : '-'}</td>
                    <td class="truncate" title="${assessment.measures || '-'}">${assessment.measures || '-'}</td>
                    <td style="text-align: center;">${assessment.severityAfter}</td>
                    <td style="text-align: center;">${assessment.probabilityAfter}</td>
                    <td style="text-align: center;" class="${getRiskClass(assessment.residualRisk)}">${assessment.residualRisk}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <span>Erstellt am: ${currentDate}</span>
        <span>Projekt: ${project.title} | Ort: ${project.location}</span>
    </div>
</body>
</html>
    `;
  };

  const generatePrintableHTML = () => {
    return generateRiskAssessmentHTML(project, currentProjectAssessments);
  };

  const handleExportPDF = async () => {
    try {
      // Create a temporary div with the content
      const printContent = document.createElement('div');
      printContent.innerHTML = generatePrintableHTML();
      
      // Hide the current page content
      const originalContent = document.body.innerHTML;
      const originalTitle = document.title;
      
      // Replace page content with print content
      document.body.innerHTML = printContent.innerHTML;
      document.title = `Gefährdungsbeurteilung_${project.title}`;
      
      // Trigger print dialog
      window.print();
      
      // Restore original content after printing
      setTimeout(() => {
        document.body.innerHTML = originalContent;
        document.title = originalTitle;
        // Reload the page to restore React functionality
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Fehler beim Öffnen der Druckvorschau.');
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Gefährdungsbeurteilung</h1>
          <p className="text-muted-foreground">
            {project.title} - Risikobewertung nach S²×W Formel
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="groupFilter">Gruppe filtern:</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Alle Gruppen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Gruppen</SelectItem>
                  {usedGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Gefährdungsbeurteilung
                  </Button>
                </DialogTrigger>
              
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAssessment ? 'Gefährdungsbeurteilung bearbeiten' : 'Neue Gefährdungsbeurteilung'}
                    </DialogTitle>
                    <DialogDescription>
                      Bewertung nach S²×W Formel (Schadensschwere² × Wahrscheinlichkeit)
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Grunddaten */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="activity">Tätigkeit *</Label>
                        <Input
                          id="activity"
                          value={formData.activity}
                          onChange={(e) => handleInputChange('activity', e.target.value)}
                          placeholder="z.B. Bühnenaufbau"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="process">Vorgang</Label>
                        <Input
                          id="process"
                          value={formData.process}
                          onChange={(e) => handleInputChange('process', e.target.value)}
                          placeholder="z.B. Montage von Traversen"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hazard">Gefährdung *</Label>
                      <Input
                        id="hazard"
                        value={formData.hazard}
                        onChange={(e) => handleInputChange('hazard', e.target.value)}
                        placeholder="z.B. Absturzgefahr"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hazardFactors">Gefährdungs- und Belastungsfaktoren</Label>
                      <Select value={formData.hazardFactors} onValueChange={(value) => handleInputChange('hazardFactors', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Gefährdungs- und Belastungsfaktor auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {hazardFactors.map((factor) => (
                            <SelectItem key={factor} value={factor}>
                              {factor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gruppe zuweisen */}
                    <div className="space-y-2">
                      <Label htmlFor="group">Gruppe</Label>
                      <Select value={formData.group || 'none'} onValueChange={handleGroupInputChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Gruppe auswählen oder neue erstellen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Keine Gruppe</SelectItem>
                          <SelectItem value="new">+ Neue Gruppe erstellen</SelectItem>
                          {availableGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.group === 'new' && (
                        <Input
                          value={formData.newGroupName || ''}
                          onChange={(e) => handleInputChange('newGroupName', e.target.value)}
                          placeholder="Neue Gruppe eingeben (z.B. Be- und Entladen LKW, Transport, Auf- und Abbau)"
                          autoFocus
                        />
                      )}
                    </div>
                    {/* Risikobewertung VOR Maßnahmen */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Risikobewertung vor Schutzmaßnahmen</h3>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="severity">Schadensschwere/Gefährdung (S)</Label>
                          <Select value={formData.severity.toString()} onValueChange={(value) => handleInputChange('severity', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(severityLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="probability">Wahrscheinlichkeit (W)</Label>
                          <Select value={formData.probability.toString()} onValueChange={(value) => handleInputChange('probability', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(probabilityLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Risikobewertung (S²×W)</Label>
                          <div className={`p-3 rounded text-center font-bold text-lg ${getRiskColor(currentRisk)}`}>
                            {currentRisk} - {getRiskLabel(currentRisk)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STOP-Prinzip Schutzmaßnahmen */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Schutzmaßnahmen (STOP-Prinzip)</h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="substitution"
                            checked={formData.substitution}
                            onCheckedChange={(checked) => handleInputChange('substitution', checked)}
                          />
                          <Label htmlFor="substitution">S - Substitution</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="technical"
                            checked={formData.technical}
                            onCheckedChange={(checked) => handleInputChange('technical', checked)}
                          />
                          <Label htmlFor="technical">T - Technische Maßnahmen</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="organizational"
                            checked={formData.organizational}
                            onCheckedChange={(checked) => handleInputChange('organizational', checked)}
                          />
                          <Label htmlFor="organizational">O - Organisatorische Maßnahmen</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="personal"
                            checked={formData.personal}
                            onCheckedChange={(checked) => handleInputChange('personal', checked)}
                          />
                          <Label htmlFor="personal">P - Persönliche Schutzausrüstung</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="measures">Weitere Maßnahmen</Label>
                        <Textarea
                          id="measures"
                          value={formData.measures}
                          onChange={(e) => handleInputChange('measures', e.target.value)}
                          placeholder="Zusätzliche Schutzmaßnahmen und Hinweise"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Restrisiko nach Maßnahmen */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Restrisiko nach Schutzmaßnahmen</h3>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="severityAfter">Schadensschwere (S) nach Maßnahmen</Label>
                          <Select value={formData.severityAfter.toString()} onValueChange={(value) => handleInputChange('severityAfter', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(severityLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="probabilityAfter">Wahrscheinlichkeit (W) nach Maßnahmen</Label>
                          <Select value={formData.probabilityAfter.toString()} onValueChange={(value) => handleInputChange('probabilityAfter', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(probabilityLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Restrisiko (R = S²×W)</Label>
                          <div className={`p-3 rounded text-center font-bold text-lg ${getRiskColor(currentResidualRisk)}`}>
                            {currentResidualRisk} - {getRiskLabel(currentResidualRisk)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Wird gespeichert...' : (editingAssessment ? 'Aktualisieren' : 'Erstellen')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="outline" onClick={handleSelectFromGlobal}>
              <Shield className="mr-2 h-4 w-4" />
              Aus Vorlagen auswählen
            </Button>
            
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Als PDF drucken
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{currentProjectAssessments.length}</p>
                <p className="text-sm text-muted-foreground">Beurteilungen</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {currentProjectAssessments.filter(a => a.riskValue > 16).length}
                </p>
                <p className="text-sm text-muted-foreground">Sehr hohes Risiko</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {currentProjectAssessments.filter(a => a.riskValue > 8 && a.riskValue <= 16).length}
                </p>
                <p className="text-sm text-muted-foreground">Hohes Risiko</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {currentProjectAssessments.filter(a => a.residualRisk <= 4).length}
                </p>
                <p className="text-sm text-muted-foreground">Akzeptables Restrisiko</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gefährdungsbeurteilungen nach S²×W Formel
          </CardTitle>
          <CardDescription>
            Systematische Bewertung aller identifizierten Gefährdungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentProjectAssessments.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Noch keine Gefährdungsbeurteilungen vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie Ihre erste Gefährdungsbeurteilung für dieses Projekt.
              </p>
              {canManage && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Beurteilung erstellen
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Tätigkeit</TableHead>
                    <TableHead className="font-bold">Vorgang</TableHead>
                    <TableHead className="font-bold">Gefährdung</TableHead>
                    <TableHead className="font-bold">Gefährdungs- und Belastungsfaktoren</TableHead>
                    <TableHead className="font-bold text-center">Schadensschwere/Gefährdung</TableHead>
                    <TableHead className="font-bold text-center">Wahrscheinlichkeit</TableHead>
                    <TableHead className="font-bold text-center">Risikobewertung</TableHead>
                    <TableHead className="font-bold">S (Substitution)</TableHead>
                    <TableHead className="font-bold">T (Technisch)</TableHead>
                    <TableHead className="font-bold">O (Organisatorisch)</TableHead>
                    <TableHead className="font-bold">P (Persönlich)</TableHead>
                    <TableHead className="font-bold">Maßnahmen</TableHead>
                    <TableHead className="font-bold text-center">S</TableHead>
                    <TableHead className="font-bold text-center">W</TableHead>
                    <TableHead className="font-bold text-center">R</TableHead>
                    {canManage && <TableHead className="font-bold text-center">Aktionen</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment, index) => (
                    <TableRow key={assessment.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="font-medium max-w-32">
                        <div className="truncate" title={assessment.activity}>
                          {assessment.activity}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.process}>
                          {assessment.process || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.hazard}>
                          {assessment.hazard}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40">
                        <div className="truncate" title={assessment.hazardFactors}>
                          {assessment.hazardFactors || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{assessment.severity}</TableCell>
                      <TableCell className="text-center font-medium">{assessment.probability}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRiskColor(assessment.riskValue)}>
                          {assessment.riskValue}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.substitution}>
                          {assessment.substitution ? '✓' : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.technical}>
                          {assessment.technical ? '✓' : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.organizational}>
                          {assessment.organizational ? '✓' : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.personal}>
                          {assessment.personal ? '✓' : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="truncate" title={assessment.measures}>
                          {assessment.measures || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{assessment.severityAfter}</TableCell>
                      <TableCell className="text-center font-medium">{assessment.probabilityAfter}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRiskColor(assessment.residualRisk)}>
                          {assessment.residualRisk}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            {isAdmin ? (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(assessment)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(assessment.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground px-2">
                                Nur Admin kann bearbeiten
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Select from Global Assessments Dialog */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gefährdungsbeurteilungen aus Vorlagen auswählen</DialogTitle>
            <DialogDescription>
              Wählen Sie bereits erstellte Gefährdungsbeurteilungen aus, um sie zu diesem Projekt hinzuzufügen.
            </DialogDescription>
          </DialogHeader>
          
          {globalRiskAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Noch keine globalen Gefährdungsbeurteilungen vorhanden.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedGlobalAssessments.length} von {globalRiskAssessments.length} ausgewählt
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedGlobalAssessments(globalRiskAssessments.map(a => a.id))}
                  >
                    Alle auswählen
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedGlobalAssessments([])}
                  >
                    Alle abwählen
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedGlobalAssessments.length === globalRiskAssessments.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGlobalAssessments(globalRiskAssessments.map(a => a.id));
                            } else {
                              setSelectedGlobalAssessments([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Tätigkeit</TableHead>
                      <TableHead>Gefährdung</TableHead>
                      <TableHead>Gruppe</TableHead>
                      <TableHead>Risiko</TableHead>
                      <TableHead>Restrisiko</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalRiskAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedGlobalAssessments.includes(assessment.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGlobalAssessments(prev => [...prev, assessment.id]);
                              } else {
                                setSelectedGlobalAssessments(prev => prev.filter(id => id !== assessment.id));
                              }
                            }}
                            disabled={projectRiskAssessments.includes(assessment.id)}
                          />
                        </TableCell>
                        <TableCell className={`font-medium ${projectRiskAssessments.includes(assessment.id) ? 'text-muted-foreground' : ''}`}>
                          {assessment.activity}
                          {projectRiskAssessments.includes(assessment.id) && (
                            <span className="ml-2 text-xs text-muted-foreground">(bereits hinzugefügt)</span>
                          )}
                        </TableCell>
                        <TableCell>{assessment.hazard}</TableCell>
                        <TableCell>
                          {assessment.group ? (
                            <Badge variant="outline">{assessment.group}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskColor(assessment.riskValue)}>
                            {assessment.riskValue}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskColor(assessment.residualRisk)}>
                            {assessment.residualRisk}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleAddSelectedAssessments}
                  disabled={selectedGlobalAssessments.length === 0}
                >
                  {selectedGlobalAssessments.length} Beurteilungen hinzufügen
                </Button>
                <Button variant="outline" onClick={() => setIsSelectDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}