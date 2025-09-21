'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';

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

// Risk assessment data structure
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
  // Automatic selection criteria
  autoSelect?: {
    isOutdoor?: boolean;
    hasElectricity?: boolean;
    hasGenerator?: boolean;
    hasWorkAbove2m?: boolean;
    hasPublicAccess?: boolean;
    hasNightWork?: boolean;
    hasTrafficArea?: boolean;
    hasHazardousMaterials?: boolean;
    seasons?: string[]; // ['spring', 'summer', 'autumn', 'winter']
    eventTypes?: string[]; // ['festival', 'concert', 'corporate', 'sports', 'market']
  };
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<any>(null);
  const [criteriaFormData, setCriteriaFormData] = useState({
    isOutdoor: undefined as boolean | undefined,
    hasElectricity: false,
    hasGenerator: false,
    hasWorkAbove2m: false,
    hasPublicAccess: false,
    hasNightWork: false,
    hasTrafficArea: false,
    hasHazardousMaterials: false,
    seasons: [] as string[],
  });
  const [globalRiskAssessments, setGlobalRiskAssessments] = useState<RiskAssessment[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    newName: '',
  });

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
    // Auto-selection criteria
    autoSelectOutdoor: false,
    autoSelectIndoor: false,
    autoSelectElectricity: false,
    autoSelectGenerator: false,
    autoSelectWorkAbove2m: false,
    autoSelectPublicAccess: false,
    autoSelectNightWork: false,
    autoSelectTrafficArea: false,
    autoSelectHazardousMaterials: false,
    autoSelectSeasons: [] as string[],
    autoSelectEventTypes: [] as string[],
  });

  // Load global groups and risk assessments from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('gbu-global-groups');
    if (savedGroups) {
      try {
        setAvailableGroups(JSON.parse(savedGroups));
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }

    const savedGlobalAssessments = localStorage.getItem('gbu-global-risk-assessments');
    if (savedGlobalAssessments) {
      try {
        setGlobalRiskAssessments(JSON.parse(savedGlobalAssessments));
      } catch (error) {
        console.error('Error loading global risk assessments:', error);
      }
    }

    // Load criteria categories from localStorage
    const savedCriteria = localStorage.getItem('gbu-criteria-categories');
    if (savedCriteria) {
      try {
        const criteria = JSON.parse(savedCriteria);
        setAvailableCriteria(criteria);
        console.log('Loaded criteria for hazard creation:', criteria.length);
      } catch (error) {
        console.error('Error loading criteria categories:', error);
      }
    }
  }, []);

  // Save groups to localStorage
  const saveGroupsToStorage = (groups: string[]) => {
    localStorage.setItem('gbu-global-groups', JSON.stringify(groups));
    setAvailableGroups(groups);
  };

  // Save global risk assessments to localStorage
  const saveGlobalAssessmentsToStorage = (assessments: RiskAssessment[]) => {
    localStorage.setItem('gbu-global-risk-assessments', JSON.stringify(assessments));
    setGlobalRiskAssessments(assessments);
  };

  const handleEditGroup = (groupName: string) => {
    setEditingGroup(groupName);
    setGroupFormData({
      name: groupName,
      newName: groupName,
    });
    setIsGroupDialogOpen(true);
  };

  const handleDeleteGroup = async (groupName: string) => {
    const assessmentsInGroup = globalRiskAssessments.filter(a => a.group === groupName);
    
    if (assessmentsInGroup.length > 0) {
      if (!confirm(`Diese Gruppe enthält ${assessmentsInGroup.length} Gefährdungsbeurteilungen. Sollen diese Beurteilungen ohne Gruppe fortgesetzt werden?`)) {
        return;
      }
    } else {
      if (!confirm(`Sind Sie sicher, dass Sie die Gruppe "${groupName}" löschen möchten?`)) {
        return;
      }
    }

    try {
      // Remove group from assessments
      const updatedAssessments = globalRiskAssessments.map(a => 
        a.group === groupName ? { ...a, group: '' } : a
      );
      saveGlobalAssessmentsToStorage(updatedAssessments);

      // Remove group from available groups
      const updatedGroups = availableGroups.filter(g => g !== groupName);
      saveGroupsToStorage(updatedGroups);

      // Reset selected group if it was deleted
      if (selectedGroup === groupName) {
        setSelectedGroup('all');
      }

      toast.success('Gruppe erfolgreich gelöscht!');
    } catch (error) {
      toast.error('Fehler beim Löschen der Gruppe.');
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupFormData.newName.trim()) {
      toast.error('Gruppenname ist erforderlich.');
      return;
    }

    const newName = groupFormData.newName.trim();
    
    // Check if new name already exists (and it's not the same group being edited)
    if (availableGroups.includes(newName) && newName !== editingGroup) {
      toast.error('Eine Gruppe mit diesem Namen existiert bereits.');
      return;
    }

    try {
      if (editingGroup) {
        // Rename existing group
        const updatedAssessments = globalRiskAssessments.map(a => 
          a.group === editingGroup ? { ...a, group: newName } : a
        );
        saveGlobalAssessmentsToStorage(updatedAssessments);

        const updatedGroups = availableGroups.map(g => g === editingGroup ? newName : g).sort();
        saveGroupsToStorage(updatedGroups);

        // Update selected group if it was renamed
        if (selectedGroup === editingGroup) {
          setSelectedGroup(newName);
        }

        toast.success('Gruppe erfolgreich umbenannt!');
      } else {
        // Create new group
        const updatedGroups = [...availableGroups, newName].sort();
        saveGroupsToStorage(updatedGroups);
        toast.success('Gruppe erfolgreich erstellt!');
      }

      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      setGroupFormData({ name: '', newName: '' });
    } catch (error) {
      toast.error('Fehler beim Speichern der Gruppe.');
    }
  };

  const resetGroupForm = () => {
    setGroupFormData({ name: '', newName: '' });
    setEditingGroup(null);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !hasPermission(session?.user?.role, UserRole.PROJEKTLEITER)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !hasPermission(session.user.role, UserRole.PROJEKTLEITER)) {
    return null;
  }

  const canManage = hasPermission(session.user.role, UserRole.PROJEKTLEITER);
  const canManageGroups = hasPermission(session.user.role, UserRole.ADMIN);

  console.log('User role:', session.user.role);
  console.log('Can manage hazards:', canManage);
  console.log('Can manage groups:', canManageGroups);

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
      autoSelectOutdoor: false,
      autoSelectIndoor: false,
      autoSelectElectricity: false,
      autoSelectGenerator: false,
      autoSelectWorkAbove2m: false,
      autoSelectPublicAccess: false,
      autoSelectNightWork: false,
      autoSelectTrafficArea: false,
      autoSelectHazardousMaterials: false,
      autoSelectSeasons: [],
      autoSelectEventTypes: [],
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
      autoSelectOutdoor: assessment.autoSelect?.isOutdoor === true,
      autoSelectIndoor: assessment.autoSelect?.isOutdoor === false,
      autoSelectElectricity: assessment.autoSelect?.hasElectricity || false,
      autoSelectGenerator: assessment.autoSelect?.hasGenerator || false,
      autoSelectWorkAbove2m: assessment.autoSelect?.hasWorkAbove2m || false,
      autoSelectPublicAccess: assessment.autoSelect?.hasPublicAccess || false,
      autoSelectNightWork: assessment.autoSelect?.hasNightWork || false,
      autoSelectTrafficArea: assessment.autoSelect?.hasTrafficArea || false,
      autoSelectHazardousMaterials: assessment.autoSelect?.hasHazardousMaterials || false,
      autoSelectSeasons: assessment.autoSelect?.seasons || [],
      autoSelectEventTypes: assessment.autoSelect?.eventTypes || [],
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

      // Build auto-selection criteria
      const autoSelect: any = {};
      
      // Location criteria
      if (formData.autoSelectOutdoor) autoSelect.isOutdoor = true;
      if (formData.autoSelectIndoor) autoSelect.isOutdoor = false;
      
      // Project characteristics
      if (formData.autoSelectElectricity) autoSelect.hasElectricity = true;
      if (formData.autoSelectGenerator) autoSelect.hasGenerator = true;
      if (formData.autoSelectWorkAbove2m) autoSelect.hasWorkAbove2m = true;
      if (formData.autoSelectPublicAccess) autoSelect.hasPublicAccess = true;
      if (formData.autoSelectNightWork) autoSelect.hasNightWork = true;
      if (formData.autoSelectTrafficArea) autoSelect.hasTrafficArea = true;
      if (formData.autoSelectHazardousMaterials) autoSelect.hasHazardousMaterials = true;
      
      // Seasons and event types
      if (formData.autoSelectSeasons.length > 0) autoSelect.seasons = formData.autoSelectSeasons;
      if (formData.autoSelectEventTypes.length > 0) autoSelect.eventTypes = formData.autoSelectEventTypes;
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
          autoSelect: Object.keys(autoSelect).length > 0 ? autoSelect : undefined,
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
          autoSelect: Object.keys(autoSelect).length > 0 ? autoSelect : undefined,
          riskValue,
          residualRisk,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedGlobalAssessments = [...globalRiskAssessments, newAssessment];
        toast.success('Gefährdungsbeurteilung erfolgreich erstellt!');
      }

      // Update global assessments
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
    if (!confirm('Sind Sie sicher, dass Sie diese Gefährdungsbeurteilung löschen möchten? Sie wird aus allen Projekten entfernt.')) {
      return;
    }

    try {
      const updatedGlobalAssessments = globalRiskAssessments.filter(a => a.id !== assessmentId);
      saveGlobalAssessmentsToStorage(updatedGlobalAssessments);
      toast.success('Gefährdungsbeurteilung erfolgreich gelöscht!');
    } catch (error) {
      toast.error('Fehler beim Löschen der Gefährdungsbeurteilung.');
    }
  };

  const currentRisk = calculateRisk(formData.severity, formData.probability);
  const currentResidualRisk = calculateRisk(formData.severityAfter, formData.probabilityAfter);

  // Filter assessments by selected group
  const filteredAssessments = selectedGroup === 'all' 
    ? globalRiskAssessments 
    : globalRiskAssessments.filter(a => a.group === selectedGroup);

  // Get groups that are actually used
  const usedGroups = [...new Set(globalRiskAssessments.map(a => a.group).filter(Boolean))];

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

  const handleCriteriaInputChange = (field: string, value: any) => {
    setCriteriaFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSeasonToggle = (season: string) => {
    setCriteriaFormData(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter(s => s !== season)
        : [...prev.seasons, season]
    }));
  };

  const handleSaveCriteria = async () => {
    setIsLoading(true);
    try {
      // Save criteria logic here
      toast.success('Kriterien erfolgreich gespeichert!');
      setCriteriaDialogOpen(false);
    } catch (error) {
      toast.error('Fehler beim Speichern der Kriterien.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Globale Gefährdungsbeurteilungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die globale Bibliothek der Gefährdungsbeurteilungen nach S²×W Formel
          </p>
        </div>
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
          
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetGroupForm}>
                <Edit className="mr-2 h-4 w-4" />
                Gruppen verwalten
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup 
                    ? 'Bearbeiten Sie den Gruppennamen.'
                    : 'Erstellen Sie eine neue Gruppe für Gefährdungsbeurteilungen.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Gruppenname *</Label>
                  <Input
                    id="groupName"
                    value={groupFormData.newName}
                    onChange={(e) => setGroupFormData(prev => ({ ...prev, newName: e.target.value }))}
                    placeholder="z.B. Be- und Entladen LKW, Transport"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingGroup ? 'Umbenennen' : 'Erstellen'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
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

                {/* Automatische Auswahl Kriterien */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Automatische Auswahl Kriterien</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Gefährdung wird automatisch bei neuen Projekten ausgewählt, wenn die folgenden Kriterien erfüllt sind:
                  </p>
                  
                  {availableCriteria.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Automatische Auswahl konfigurieren (Verfügbare Kriterien: {availableCriteria.length})
                      </div>
                      
                      {availableCriteria.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm mb-2">Keine Auswahlkriterien verfügbar.</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/criteria">
                              Kriterien erstellen
                            </Link>
                          </Button>
                        </div>
                      )}

                      {/* Veranstaltungsort */}
                      {availableCriteria.filter(c => c.category === 'location').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Veranstaltungsort</h4>
                          <div className="space-y-2 pl-4">
                            {availableCriteria
                              .filter(c => c.category === 'location')
                              .map(criterion => (
                                <div key={criterion.id} className="flex items-center space-x-2">
                                  {criterion.type === 'boolean' ? (
                                    <>
                                      <Checkbox
                                        id={`location-${criterion.id}`}
                                        checked={formData.autoSelect?.location?.[criterion.name] || false}
                                        onCheckedChange={(checked) => handleAutoSelectChange('location', criterion.name, checked)}
                                      />
                                      <Label htmlFor={`location-${criterion.id}`} className="text-sm">
                                        {criterion.name}
                                        {criterion.description && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({criterion.description})
                                          </span>
                                        )}
                                      </Label>
                                    </>
                                  ) : (
                                    <div className="space-y-1 w-full">
                                      <Label className="text-sm">{criterion.name}</Label>
                                      <Select
                                        value={formData.autoSelect?.location?.[criterion.name] || ''}
                                        onValueChange={(value) => handleAutoSelectChange('location', criterion.name, value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">Keine Auswahl</SelectItem>
                                          {criterion.options?.map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Projektmerkmale */}
                      {availableCriteria.filter(c => c.category === 'project').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Projektmerkmale</h4>
                          <div className="space-y-2 pl-4">
                            {availableCriteria
                              .filter(c => c.category === 'project')
                              .map(criterion => (
                                <div key={criterion.id} className="flex items-center space-x-2">
                                  {criterion.type === 'boolean' ? (
                                    <>
                                      <Checkbox
                                        id={`project-${criterion.id}`}
                                        checked={formData.autoSelect?.project?.[criterion.name] || false}
                                        onCheckedChange={(checked) => handleAutoSelectChange('project', criterion.name, checked)}
                                      />
                                      <Label htmlFor={`project-${criterion.id}`} className="text-sm">
                                        {criterion.name}
                                        {criterion.description && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({criterion.description})
                                          </span>
                                        )}
                                      </Label>
                                    </>
                                  ) : (
                                    <div className="space-y-1 w-full">
                                      <Label className="text-sm">{criterion.name}</Label>
                                      <Select
                                        value={formData.autoSelect?.project?.[criterion.name] || ''}
                                        onValueChange={(value) => handleAutoSelectChange('project', criterion.name, value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">Keine Auswahl</SelectItem>
                                          {criterion.options?.map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Jahreszeiten */}
                      {availableCriteria.filter(c => c.category === 'season').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Jahreszeiten</h4>
                          <div className="space-y-2 pl-4">
                            {availableCriteria
                              .filter(c => c.category === 'season')
                              .map(criterion => (
                                <div key={criterion.id} className="space-y-2">
                                  <Label className="text-sm font-medium">{criterion.name}</Label>
                                  {criterion.type === 'multiselect' && criterion.options ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {criterion.options.map((option: string) => (
                                        <div key={option} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`season-${criterion.id}-${option}`}
                                            checked={formData.autoSelect?.seasons?.includes(option) || false}
                                            onCheckedChange={(checked) => {
                                              const currentSeasons = formData.autoSelect?.seasons || [];
                                              const newSeasons = checked
                                                ? [...currentSeasons, option]
                                                : currentSeasons.filter(s => s !== option);
                                              handleAutoSelectChange('seasons', 'seasons', newSeasons);
                                            }}
                                          />
                                          <Label htmlFor={`season-${criterion.id}-${option}`} className="text-sm">
                                            {option}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`season-${criterion.id}`}
                                        checked={formData.autoSelect?.seasons?.[criterion.name] || false}
                                        onCheckedChange={(checked) => handleAutoSelectChange('seasons', criterion.name, checked)}
                                      />
                                      <Label htmlFor={`season-${criterion.id}`} className="text-sm">
                                        {criterion.name}
                                      </Label>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Benutzerdefiniert */}
                      {availableCriteria.filter(c => c.category === 'custom').length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Benutzerdefiniert</h4>
                          <div className="space-y-2 pl-4">
                            {availableCriteria
                              .filter(c => c.category === 'custom')
                              .map(criterion => (
                                <div key={criterion.id} className="flex items-center space-x-2">
                                  {criterion.type === 'boolean' ? (
                                    <>
                                      <Checkbox
                                        id={`custom-${criterion.id}`}
                                        checked={formData.autoSelect?.custom?.[criterion.name] || false}
                                        onCheckedChange={(checked) => handleAutoSelectChange('custom', criterion.name, checked)}
                                      />
                                      <Label htmlFor={`custom-${criterion.id}`} className="text-sm">
                                        {criterion.name}
                                        {criterion.description && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({criterion.description})
                                          </span>
                                        )}
                                      </Label>
                                    </>
                                  ) : criterion.type === 'select' ? (
                                    <div className="space-y-1 w-full">
                                      <Label className="text-sm">{criterion.name}</Label>
                                      <Select
                                        value={formData.autoSelect?.custom?.[criterion.name] || ''}
                                        onValueChange={(value) => handleAutoSelectChange('custom', criterion.name, value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">Keine Auswahl</SelectItem>
                                          {criterion.options?.map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : criterion.type === 'multiselect' ? (
                                    <div className="space-y-2 w-full">
                                      <Label className="text-sm font-medium">{criterion.name}</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {criterion.options?.map((option: string) => (
                                          <div key={option} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`custom-${criterion.id}-${option}`}
                                              checked={formData.autoSelect?.custom?.[criterion.name]?.includes(option) || false}
                                              onCheckedChange={(checked) => {
                                                const currentValues = formData.autoSelect?.custom?.[criterion.name] || [];
                                                const newValues = checked
                                                  ? [...currentValues, option]
                                                  : currentValues.filter((v: string) => v !== option);
                                                handleAutoSelectChange('custom', criterion.name, newValues);
                                              }}
                                            />
                                            <Label htmlFor={`custom-${criterion.id}-${option}`} className="text-sm">
                                              {option}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legacy hardcoded criteria - remove this section once dynamic criteria are working */}
                  {availableCriteria.length === 0 && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Automatische Auswahl konfigurieren (Legacy-Modus)
                      </div>
                      
                      {/* Veranstaltungsort */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Veranstaltungsort</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isOutdoor"
                              checked={formData.autoSelect?.isOutdoor || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('location', 'isOutdoor', checked)}
                            />
                            <Label htmlFor="isOutdoor" className="text-sm">Outdoor-Veranstaltung</Label>
                          </div>
                        </div>
                      </div>

                      {/* Projektmerkmale */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Projektmerkmale</h4>
                        <div className="space-y-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasElectricity"
                              checked={formData.autoSelect?.hasElectricity || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasElectricity', checked)}
                            />
                            <Label htmlFor="hasElectricity" className="text-sm">Elektrische Anlagen vorhanden</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasGenerator"
                              checked={formData.autoSelect?.hasGenerator || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasGenerator', checked)}
                            />
                            <Label htmlFor="hasGenerator" className="text-sm">Generatoren/Notstromaggregate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasWorkAbove2m"
                              checked={formData.autoSelect?.hasWorkAbove2m || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasWorkAbove2m', checked)}
                            />
                            <Label htmlFor="hasWorkAbove2m" className="text-sm">Arbeiten über 2m Höhe</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasPublicAccess"
                              checked={formData.autoSelect?.hasPublicAccess || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasPublicAccess', checked)}
                            />
                            <Label htmlFor="hasPublicAccess" className="text-sm">Publikumsverkehr</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasNightWork"
                              checked={formData.autoSelect?.hasNightWork || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasNightWork', checked)}
                            />
                            <Label htmlFor="hasNightWork" className="text-sm">Nachtarbeit</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasTrafficArea"
                              checked={formData.autoSelect?.hasTrafficArea || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasTrafficArea', checked)}
                            />
                            <Label htmlFor="hasTrafficArea" className="text-sm">Verkehrsflächen betroffen</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasHazardousMaterials"
                              checked={formData.autoSelect?.hasHazardousMaterials || false}
                              onCheckedChange={(checked) => handleAutoSelectChange('project', 'hasHazardousMaterials', checked)}
                            />
                            <Label htmlFor="hasHazardousMaterials" className="text-sm">Gefahrstoffe</Label>
                          </div>
                        </div>
                      </div>

                      {/* Jahreszeiten */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Jahreszeiten</h4>
                        <div className="space-y-2 pl-4">
                          <div className="grid grid-cols-2 gap-2">
                            {['spring', 'summer', 'autumn', 'winter'].map((season) => (
                              <div key={season} className="flex items-center space-x-2">
                                <Checkbox
                                  id={season}
                                  checked={formData.autoSelect?.seasons?.includes(season) || false}
                                  onCheckedChange={(checked) => {
                                    const currentSeasons = formData.autoSelect?.seasons || [];
                                    const newSeasons = checked
                                      ? [...currentSeasons, season]
                                      : currentSeasons.filter(s => s !== season);
                                    handleAutoSelectChange('seasons', 'seasons', newSeasons);
                                  }}
                                />
                                <Label htmlFor={season} className="text-sm">
                                  {season === 'spring' ? 'Frühling' : 
                                   season === 'summer' ? 'Sommer' : 
                                   season === 'autumn' ? 'Herbst' : 'Winter'}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{globalRiskAssessments.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
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
                  {globalRiskAssessments.filter(a => a.riskValue > 16).length}
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
                  {globalRiskAssessments.filter(a => a.riskValue > 8 && a.riskValue <= 16).length}
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
                  {globalRiskAssessments.filter(a => a.residualRisk <= 4).length}
                </p>
                <p className="text-sm text-muted-foreground">Akzeptables Restrisiko</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gruppenverwaltung
          </CardTitle>
          <CardDescription>
            Verwalten Sie Gruppen für die Organisation von Gefährdungsbeurteilungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Noch keine Gruppen vorhanden.
              </p>
              <Button onClick={() => setIsGroupDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Gruppe erstellen
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {availableGroups.map((group) => {
                const assessmentCount = globalRiskAssessments.filter(a => a.group === group).length;
                return (
                  <div key={group} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{group}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assessmentCount} Beurteilung{assessmentCount !== 1 ? 'en' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteGroup(group)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Globale Gefährdungsbeurteilungen nach S²×W Formel
          </CardTitle>
          <CardDescription>
            Zentrale Verwaltung aller Gefährdungsbeurteilungen für alle Projekte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {globalRiskAssessments.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Noch keine Gefährdungsbeurteilungen vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie Ihre erste globale Gefährdungsbeurteilung.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Beurteilung erstellen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Tätigkeit</TableHead>
                    <TableHead className="font-bold">Gefährdung</TableHead>
                    <TableHead className="font-bold">Gruppe</TableHead>
                    <TableHead className="font-bold text-center">S</TableHead>
                    <TableHead className="font-bold text-center">W</TableHead>
                    <TableHead className="font-bold text-center">Risiko</TableHead>
                    <TableHead className="font-bold text-center">S nach</TableHead>
                    <TableHead className="font-bold text-center">W nach</TableHead>
                    <TableHead className="font-bold text-center">Restrisiko</TableHead>
                    <TableHead className="font-bold text-center">Aktionen</TableHead>
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
                        <div className="truncate" title={assessment.hazard}>
                          {assessment.hazard}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assessment.group ? (
                          <Badge variant="outline">{assessment.group}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{assessment.severity}</TableCell>
                      <TableCell className="text-center font-medium">{assessment.probability}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRiskColor(assessment.riskValue)}>
                          {assessment.riskValue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{assessment.severityAfter}</TableCell>
                      <TableCell className="text-center font-medium">{assessment.probabilityAfter}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRiskColor(assessment.residualRisk)}>
                          {assessment.residualRisk}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          {canManage && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(assessment)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(assessment.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Selection Criteria Dialog */}
      <Dialog open={criteriaDialogOpen} onOpenChange={setCriteriaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Automatische Auswahlkriterien bearbeiten
            </DialogTitle>
            <DialogDescription>
              Definieren Sie die Kriterien, wann diese Gefährdung automatisch ausgewählt werden soll.
              <br />
              <strong>Gefährdung:</strong> {editingCriteria?.activity}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Location Criteria */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Veranstaltungsort</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-indoor"
                    checked={criteriaFormData.isOutdoor === false}
                    onCheckedChange={(checked) => 
                      handleCriteriaInputChange('isOutdoor', checked ? false : undefined)
                    }
                  />
                  <Label htmlFor="criteria-indoor">Nur Indoor-Veranstaltungen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-outdoor"
                    checked={criteriaFormData.isOutdoor === true}
                    onCheckedChange={(checked) => 
                      handleCriteriaInputChange('isOutdoor', checked ? true : undefined)
                    }
                  />
                  <Label htmlFor="criteria-outdoor">Nur Outdoor-Veranstaltungen</Label>
                </div>
              </div>
            </div>

            {/* Project Characteristics */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Projektmerkmale</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-electricity"
                    checked={criteriaFormData.hasElectricity}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasElectricity', checked)}
                  />
                  <Label htmlFor="criteria-electricity">Elektrische Anlagen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-generator"
                    checked={criteriaFormData.hasGenerator}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasGenerator', checked)}
                  />
                  <Label htmlFor="criteria-generator">Generatoren</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-height"
                    checked={criteriaFormData.hasWorkAbove2m}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasWorkAbove2m', checked)}
                  />
                  <Label htmlFor="criteria-height">Arbeiten über 2m</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-public"
                    checked={criteriaFormData.hasPublicAccess}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasPublicAccess', checked)}
                  />
                  <Label htmlFor="criteria-public">Publikumsverkehr</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-night"
                    checked={criteriaFormData.hasNightWork}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasNightWork', checked)}
                  />
                  <Label htmlFor="criteria-night">Nachtarbeit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-traffic"
                    checked={criteriaFormData.hasTrafficArea}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasTrafficArea', checked)}
                  />
                  <Label htmlFor="criteria-traffic">Verkehrsflächen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criteria-hazmat"
                    checked={criteriaFormData.hasHazardousMaterials}
                    onCheckedChange={(checked) => handleCriteriaInputChange('hasHazardousMaterials', checked)}
                  />
                  <Label htmlFor="criteria-hazmat">Gefahrstoffe</Label>
                </div>
              </div>
            </div>

            {/* Seasonal Criteria */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Jahreszeiten</Label>
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { key: 'spring', label: 'Frühling' },
                  { key: 'summer', label: 'Sommer' },
                  { key: 'autumn', label: 'Herbst' },
                  { key: 'winter', label: 'Winter' }
                ].map((season) => (
                  <div key={season.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`criteria-${season.key}`}
                      checked={criteriaFormData.seasons.includes(season.key)}
                      onCheckedChange={() => handleSeasonToggle(season.key)}
                    />
                    <Label htmlFor={`criteria-${season.key}`}>{season.label}</Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Leer lassen für ganzjährige Auswahl
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-base font-semibold">Vorschau der Kriterien</Label>
              <div className="mt-2 text-sm">
                {criteriaFormData.isOutdoor === true && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">Outdoor</span>}
                {criteriaFormData.isOutdoor === false && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">Indoor</span>}
                {criteriaFormData.hasElectricity && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Elektrik</span>}
                {criteriaFormData.hasGenerator && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Generator</span>}
                {criteriaFormData.hasWorkAbove2m && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Höhenarbeit</span>}
                {criteriaFormData.hasPublicAccess && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Publikum</span>}
                {criteriaFormData.hasNightWork && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Nachtarbeit</span>}
                {criteriaFormData.hasTrafficArea && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Verkehr</span>}
                {criteriaFormData.hasHazardousMaterials && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-1">Gefahrstoffe</span>}
                {criteriaFormData.seasons.map(season => (
                  <span key={season} className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-2 mb-1">
                    {season === 'spring' ? 'Frühling' : season === 'summer' ? 'Sommer' : season === 'autumn' ? 'Herbst' : 'Winter'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSaveCriteria} disabled={isLoading} className="flex-1">
              {isLoading ? 'Wird gespeichert...' : 'Kriterien speichern'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCriteriaDialogOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}