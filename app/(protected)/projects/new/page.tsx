'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { toast } from 'sonner';

// Import risk assessment types and functions
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
  autoSelect?: {
    location?: {[key: string]: boolean};
    project?: {[key: string]: boolean};
    season?: string[];
    customCriteria?: string[];
    customCriteriaValues?: {[key: string]: any};
    isOutdoor?: boolean;
    hasElectricity?: boolean;
    hasGenerator?: boolean;
    hasWorkAbove2m?: boolean;
    hasPublicAccess?: boolean;
    hasNightWork?: boolean;
    hasTrafficArea?: boolean;
    hasHazardousMaterials?: boolean;
  };
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
// Helper function to determine if an assessment should be auto-selected
const shouldAutoSelect = (assessment: RiskAssessment, projectData: any, eventDate: Date, availableCriteria: any[]): boolean => {
  if (!assessment.autoSelect) return false;
  
  const criteria = assessment.autoSelect;
  
  console.log('Checking assessment:', assessment.activity, 'with criteria:', criteria);
  console.log('Project data:', projectData);
  
  // Check custom criteria from localStorage
  if (criteria.customCriteria && availableCriteria.length > 0) {
    console.log('Checking custom criteria:', criteria.customCriteria);
    for (const customCriteriaId of criteria.customCriteria) {
      const criterion = availableCriteria.find(c => c.id === customCriteriaId);
      if (criterion) {
        console.log('Found criterion:', criterion.name, 'type:', criterion.type);
        // Check if project data matches this custom criterion
        const projectValue = projectData.customCriteria?.[customCriteriaId];
        console.log('Project value for', criterion.name, ':', projectValue);
        
        if (criterion.type === 'boolean' && !projectValue) {
          console.log('Custom criteria mismatch:', criterion.name);
          return false;
        }
        if (criterion.type === 'select' && !projectValue) {
          console.log('Custom select criteria mismatch:', criterion.name);
          return false;
        }
        if (criterion.type === 'multiselect' && (!projectValue || projectValue.length === 0)) {
          console.log('Custom multiselect criteria mismatch:', criterion.name);
          return false;
        }
      } else {
        console.log('Criterion not found:', customCriteriaId);
        return false;
      }
    }
  }
  
  // Check if assessment has custom criteria requirements but no custom criteria are set
  if (criteria.customCriteria && criteria.customCriteria.length > 0 && (!projectData.customCriteria || Object.keys(projectData.customCriteria).length === 0)) {
    console.log('Assessment requires custom criteria but none are set');
    return false;
  }
  
  // Check for multiselect criteria matching
  if (criteria.customCriteria && availableCriteria.length > 0) {
    for (const customCriteriaId of criteria.customCriteria) {
      const criterion = availableCriteria.find(c => c.id === customCriteriaId);
      if (criterion && criterion.type === 'multiselect') {
        const projectValue = projectData.customCriteria?.[customCriteriaId];
        if (projectValue && Array.isArray(projectValue)) {
          let hasMatch = false;
          for (const value of projectValue) {
            if (criteria.customCriteriaValues && criteria.customCriteriaValues[customCriteriaId] && criteria.customCriteriaValues[customCriteriaId].includes(value)) {
              hasMatch = true;
              break;
            }
          }
          if (!hasMatch) {
            console.log('Custom multiselect criteria mismatch:', criterion.name);
            return false;
          }
        }
      }
    }
  }
  
  // Check location criteria
  if (criteria.isOutdoor !== undefined && criteria.isOutdoor !== projectData.isOutdoor) {
    console.log('Location mismatch:', criteria.isOutdoor, 'vs', projectData.isOutdoor);
    return false;
  }
  
  // Check project characteristics
 if (criteria.hasElectricity && !projectData.hasElectricity) {
   console.log('Electricity mismatch');
   return false;
 }
 if (criteria.hasGenerator && !projectData.hasGenerator) {
   console.log('Generator mismatch');
   return false;
 }
 if (criteria.hasWorkAbove2m && !projectData.hasWorkAbove2m) {
   console.log('Work above 2m mismatch');
   return false;
 }
 if (criteria.hasPublicAccess && !projectData.hasPublicAccess) {
   console.log('Public access mismatch');
   return false;
 }
 if (criteria.hasNightWork && !projectData.hasNightWork) {
   console.log('Night work mismatch');
   return false;
 }
 if (criteria.hasTrafficArea && !projectData.hasTrafficArea) {
   console.log('Traffic area mismatch');
   return false;
 }
 if (criteria.hasHazardousMaterials && !projectData.hasHazardousMaterials) {
   console.log('Hazardous materials mismatch');
   return false;
 }
  
  // Check season
  if (criteria.seasons && criteria.seasons.length > 0) {
    const month = eventDate.getMonth();
    const currentSeason = getSeason(month);
    console.log('Season check:', currentSeason, 'in', criteria.seasons);
   if (!criteria.seasons.includes(currentSeason)) {
     console.log('Season mismatch');
     return false;
   }
  }
  
  console.log('Assessment matches criteria!');
  return true;
};

// Helper function to get season from month
const getSeason = (month: number): string => {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [globalRiskAssessments, setGlobalRiskAssessments] = useState<RiskAssessment[]>([]);
  const [selectedRiskAssessments, setSelectedRiskAssessments] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [autoSelectedCount, setAutoSelectedCount] = useState(0);
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [customCriteriaValues, setCustomCriteriaValues] = useState<{[key: string]: any}>({});
  const [criteriaLoaded, setCriteriaLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    isOutdoor: false,
    buildUpStart: undefined as Date | undefined,
    buildUpEnd: undefined as Date | undefined,
    eventStart: undefined as Date | undefined,
    eventEnd: undefined as Date | undefined,
    hasElectricity: false,
    hasGenerator: false,
    hasHazardousMaterials: false,
    hasWorkAbove2m: false,
    hasPublicAccess: false,
    hasNightWork: false,
    hasTrafficArea: false,
  });

  // Load global risk assessments on component mount
  useEffect(() => {
    console.log('Loading data on component mount...');
    
    const savedGlobalAssessments = localStorage.getItem('gbu-global-risk-assessments');
    if (savedGlobalAssessments) {
      try {
        const assessments = JSON.parse(savedGlobalAssessments);
        console.log('Loaded global risk assessments:', assessments.length);
        setGlobalRiskAssessments(assessments);
      } catch (error) {
        console.error('Error loading global risk assessments:', error);
      }
    } else {
      console.log('No global risk assessments found in localStorage');
    }
    
    // Load available criteria
    const savedCriteria = localStorage.getItem('gbu-criteria-categories');
    if (savedCriteria) {
      try {
        const criteria = JSON.parse(savedCriteria);
        console.log('Loaded criteria categories:', criteria.length, criteria);
        setAvailableCriteria(criteria);
        setCriteriaLoaded(true);
      } catch (error) {
        console.error('Error loading criteria categories:', error);
        setCriteriaLoaded(true);
      }
    } else {
      console.log('No criteria categories found in localStorage');
      setCriteriaLoaded(true);
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomCriteriaChange = (criteriaId: string, value: any) => {
    setCustomCriteriaValues(prev => ({
      ...prev,
      [criteriaId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.location || !formData.buildUpStart || 
          !formData.buildUpEnd || !formData.eventStart || !formData.eventEnd) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }

      // Get selected risk assessments
      const selectedAssessments = globalRiskAssessments
        .filter(a => selectedRiskAssessments.includes(a.id))
        .map(assessment => ({
          ...assessment,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // New unique ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      // Create new project object
      const newProject = {
        id: Date.now().toString(),
        title: formData.title,
        location: formData.location,
        description: formData.description,
        isOutdoor: formData.isOutdoor,
        buildUpStart: formData.buildUpStart,
        buildUpEnd: formData.buildUpEnd,
        eventStart: formData.eventStart,
        eventEnd: formData.eventEnd,
        hasElectricity: formData.hasElectricity,
        hasGenerator: formData.hasGenerator,
        hasHazardousMaterials: formData.hasHazardousMaterials,
        hasWorkAbove2m: formData.hasWorkAbove2m,
        hasPublicAccess: formData.hasPublicAccess,
        hasNightWork: formData.hasNightWork,
        hasTrafficArea: formData.hasTrafficArea,
        createdByUserId: session?.user?.id || '1',
        status: 'ENTWURF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: [],
        _count: { projectHazards: 0 },
        riskAssessmentIds: selectedRiskAssessments,
        _count: { projectHazards: selectedRiskAssessments.length }
      };

      // Save to localStorage
      const existingProjects = JSON.parse(localStorage.getItem('gbu-projects') || '[]');
      const updatedProjects = [...existingProjects, newProject];
      localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Projekt erfolgreich erstellt!');
      router.push('/projects');
    } catch (error) {
      toast.error('Fehler beim Erstellen des Projekts.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!formData.title || !formData.location || !formData.buildUpStart || 
          !formData.buildUpEnd || !formData.eventStart || !formData.eventEnd) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }
      
      // Auto-select matching risk assessments when moving to step 2
      if (globalRiskAssessments.length > 0) {
       console.log('Starting auto-selection...');
       console.log('Project data:', formData);
       console.log('Event start date:', formData.eventStart);
       
        const autoSelected = globalRiskAssessments
         .filter(assessment => {
           const shouldSelect = shouldAutoSelect(assessment, formData, formData.eventStart!, availableCriteria);
           console.log(`Assessment "${assessment.activity}": ${shouldSelect ? 'SELECTED' : 'not selected'}`);
           return shouldSelect;
         })
         .map(assessment => {
           console.log(`Auto-selecting: ${assessment.activity}`);
           return assessment.id;
         });
        
       console.log('Auto-selected IDs:', autoSelected);
       
        if (autoSelected.length > 0) {
          setSelectedRiskAssessments(autoSelected);
          setAutoSelectedCount(autoSelected.length);
         console.log('Setting selected assessments:', autoSelected);
         setTimeout(() => {
           toast.success(`${autoSelected.length} Gefährdungen automatisch ausgewählt!`);
         }, 100);
        } else {
          // Reset if no auto-selections
         console.log('No auto-selections found, resetting...');
          setSelectedRiskAssessments([]);
          setAutoSelectedCount(0);
        }
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neues Projekt</h1>
          <p className="text-muted-foreground">
            Erstellen Sie ein neues Veranstaltungsprojekt
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
          <span className="ml-2">Projektdaten</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
          <span className="ml-2">Gefährdungen auswählen</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Grundinformationen</CardTitle>
                <CardDescription>
                  Allgemeine Informationen über das Projekt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Projekttitel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="z.B. Stadtfest Musterhausen 2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Veranstaltungsort *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="z.B. Marktplatz, 12345 Musterhausen"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Kurze Beschreibung der Veranstaltung..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOutdoor"
                    checked={formData.isOutdoor}
                    onCheckedChange={(checked) => handleInputChange('isOutdoor', checked)}
                  />
                  <Label htmlFor="isOutdoor">Outdoor-Veranstaltung</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termine</CardTitle>
                <CardDescription>
                  Aufbau-, Veranstaltungs- und Abbauzeiten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Aufbau Start *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.buildUpStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.buildUpStart ? (
                            format(formData.buildUpStart, "dd.MM.yyyy", { locale: de })
                          ) : (
                            "Datum wählen"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.buildUpStart}
                          onSelect={(date) => handleInputChange('buildUpStart', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Aufbau Ende *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.buildUpEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.buildUpEnd ? (
                            format(formData.buildUpEnd, "dd.MM.yyyy", { locale: de })
                          ) : (
                            "Datum wählen"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.buildUpEnd}
                          onSelect={(date) => handleInputChange('buildUpEnd', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Veranstaltung Start *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.eventStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.eventStart ? (
                            format(formData.eventStart, "dd.MM.yyyy", { locale: de })
                          ) : (
                            "Datum wählen"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.eventStart}
                          onSelect={(date) => handleInputChange('eventStart', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Veranstaltung Ende *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.eventEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.eventEnd ? (
                            format(formData.eventEnd, "dd.MM.yyyy", { locale: de })
                          ) : (
                            "Datum wählen"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.eventEnd}
                          onSelect={(date) => handleInputChange('eventEnd', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gefährdungsanalyse</CardTitle>
                <CardDescription>
                  Diese Angaben helfen bei der automatischen Auswahl relevanter Gefährdungen
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {criteriaLoaded ? `${availableCriteria.length} benutzerdefinierte Kriterien verfügbar` : 'Lade Kriterien...'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasElectricity"
                      checked={formData.hasElectricity}
                      onCheckedChange={(checked) => handleInputChange('hasElectricity', checked)}
                    />
                    <Label htmlFor="hasElectricity">Elektrische Anlagen vorhanden</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasGenerator"
                      checked={formData.hasGenerator}
                      onCheckedChange={(checked) => handleInputChange('hasGenerator', checked)}
                    />
                    <Label htmlFor="hasGenerator">Generatoren/Notstromaggregate</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasWorkAbove2m"
                      checked={formData.hasWorkAbove2m}
                      onCheckedChange={(checked) => handleInputChange('hasWorkAbove2m', checked)}
                    />
                    <Label htmlFor="hasWorkAbove2m">Arbeiten über 2m Höhe</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasPublicAccess"
                      checked={formData.hasPublicAccess}
                      onCheckedChange={(checked) => handleInputChange('hasPublicAccess', checked)}
                    />
                    <Label htmlFor="hasPublicAccess">Publikumsverkehr</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasNightWork"
                      checked={formData.hasNightWork}
                      onCheckedChange={(checked) => handleInputChange('hasNightWork', checked)}
                    />
                    <Label htmlFor="hasNightWork">Nachtarbeit</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasTrafficArea"
                      checked={formData.hasTrafficArea}
                      onCheckedChange={(checked) => handleInputChange('hasTrafficArea', checked)}
                    />
                    <Label htmlFor="hasTrafficArea">Verkehrsflächen betroffen</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasHazardousMaterials"
                      checked={formData.hasHazardousMaterials}
                      onCheckedChange={(checked) => handleInputChange('hasHazardousMaterials', checked)}
                    />
                    <Label htmlFor="hasHazardousMaterials">Gefahrstoffe</Label>
                  </div>
                  </div>

                  {/* Benutzerdefinierte Kriterien */}
                  {criteriaLoaded && availableCriteria.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Benutzerdefinierte Kriterien</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {availableCriteria.map((criteria) => (
                            <div key={criteria.id} className="space-y-2">
                              <Label htmlFor={`custom-${criteria.id}`} className="text-sm font-medium">
                                {criteria.name}
                              </Label>
                              {criteria.description && (
                                <p className="text-xs text-muted-foreground">{criteria.description}</p>
                              )}
                              
                              {criteria.type === 'boolean' && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`custom-${criteria.id}`}
                                    checked={customCriteriaValues[criteria.id] || false}
                                    onCheckedChange={(checked) => handleCustomCriteriaChange(criteria.id, checked)}
                                  />
                                  <Label htmlFor={`custom-${criteria.id}`} className="text-sm">
                                    {criteria.name}
                                  </Label>
                                </div>
                              )}
                              
                              {criteria.type === 'select' && criteria.options && (
                                <Select 
                                  value={customCriteriaValues[criteria.id] || ''} 
                                  onValueChange={(value) => handleCustomCriteriaChange(criteria.id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Auswählen..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {criteria.options.map((option: string) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {criteria.type === 'multiselect' && criteria.options && (
                                <div className="space-y-2">
                                  {criteria.options.map((option: string) => (
                                    <div key={option} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`custom-${criteria.id}-${option}`}
                                        checked={(customCriteriaValues[criteria.id] || []).includes(option)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = customCriteriaValues[criteria.id] || [];
                                          if (checked) {
                                            handleCustomCriteriaChange(criteria.id, [...currentValues, option]);
                                          } else {
                                            handleCustomCriteriaChange(criteria.id, currentValues.filter((v: string) => v !== option));
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`custom-${criteria.id}-${option}`} className="text-sm">
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {criteriaLoaded && availableCriteria.length === 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Keine benutzerdefinierten Kriterien verfügbar. 
                        <Link href="/admin/criteria" className="text-primary hover:underline ml-1">
                          Kriterien erstellen
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" onClick={handleNextStep}>
                Weiter
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">
                  Abbrechen
                </Link>
              </Button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Gefährdungen auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie relevante Gefährdungen aus der globalen Bibliothek aus (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {globalRiskAssessments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Noch keine globalen Gefährdungsbeurteilungen verfügbar.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sie können das Projekt ohne Gefährdungen erstellen und diese später hinzufügen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {selectedRiskAssessments.length} von {globalRiskAssessments.length} ausgewählt
                        {autoSelectedCount > 0 && (
                          <span className="ml-2 text-green-600">
                            ({autoSelectedCount} automatisch ausgewählt)
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRiskAssessments(globalRiskAssessments.map(a => a.id))}
                        >
                          Alle auswählen
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRiskAssessments([]);
                            setAutoSelectedCount(0);
                          }}
                        >
                          Alle abwählen
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {globalRiskAssessments.map((assessment) => (
                        <div key={assessment.id} className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 ${
                          selectedRiskAssessments.includes(assessment.id) && shouldAutoSelect(assessment, formData, formData.eventStart!) 
                            ? 'border-green-200 bg-green-50' 
                            : ''
                        }`}>
                          <Checkbox
                            id={assessment.id}
                            checked={selectedRiskAssessments.includes(assessment.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRiskAssessments([...selectedRiskAssessments, assessment.id]);
                              } else {
                                setSelectedRiskAssessments(selectedRiskAssessments.filter(id => id !== assessment.id));
                                // Reset auto-selected count if manually deselecting
                               if (formData.eventStart && shouldAutoSelect(assessment, formData, formData.eventStart, availableCriteria)) {
                                  setAutoSelectedCount(Math.max(0, autoSelectedCount - 1));
                                }
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={assessment.id} className="text-sm font-medium cursor-pointer">
                              {assessment.activity}
                              {selectedRiskAssessments.includes(assessment.id) && shouldAutoSelect(assessment, formData, formData.eventStart!, availableCriteria) && (
                                <span className="ml-2 text-xs text-green-600 font-normal">
                                  (automatisch ausgewählt)
                                </span>
                              )}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assessment.hazard}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(assessment.riskValue)}`}>
                                Risiko: {assessment.riskValue} ({getRiskLabel(assessment.riskValue)})
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(assessment.residualRisk)}`}>
                                Restrisiko: {assessment.residualRisk}
                              </span>
                              {assessment.group && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                  {assessment.group}
                                </span>
                              )}
                              {assessment.autoSelect && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Auto-Auswahl
                                </span>
                              )}
                              {selectedRiskAssessments.includes(assessment.id) && shouldAutoSelect(assessment, formData, formData.eventStart!, availableCriteria) && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  ✓ Automatisch ausgewählt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" onClick={handlePrevStep} variant="outline">
                Zurück
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Wird erstellt...' : 'Projekt erstellen'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">
                  Abbrechen
                </Link>
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}