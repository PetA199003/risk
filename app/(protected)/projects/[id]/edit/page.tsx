'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
          // Populate form with existing data
          setFormData({
            title: foundProject.title,
            location: foundProject.location,
            description: foundProject.description || '',
            isOutdoor: foundProject.isOutdoor,
            buildUpStart: foundProject.buildUpStart ? new Date(foundProject.buildUpStart) : undefined,
            buildUpEnd: foundProject.buildUpEnd ? new Date(foundProject.buildUpEnd) : undefined,
            eventStart: foundProject.eventStart ? new Date(foundProject.eventStart) : undefined,
            eventEnd: foundProject.eventEnd ? new Date(foundProject.eventEnd) : undefined,
            hasElectricity: foundProject.hasElectricity,
            hasGenerator: foundProject.hasGenerator,
            hasHazardousMaterials: foundProject.hasHazardousMaterials,
            hasWorkAbove2m: foundProject.hasWorkAbove2m,
            hasPublicAccess: foundProject.hasPublicAccess,
            hasNightWork: foundProject.hasNightWork,
            hasTrafficArea: foundProject.hasTrafficArea,
          });
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

  // Check permissions
  if (!hasPermission(session.user.role, UserRole.PROJEKTLEITER)) {
    router.push('/projects');
    return null;
  }

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

      // Update project object
      const updatedProject = {
        ...project,
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
        updatedAt: new Date().toISOString(),
      };

      // Update in localStorage
      const existingProjects = JSON.parse(localStorage.getItem('gbu-projects') || '[]');
      const updatedProjects = existingProjects.map((p: any) => 
        p.id === project.id ? updatedProject : p
      );
      localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Projekt erfolgreich aktualisiert!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Projekts.');
    } finally {
      setIsLoading(false);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekt bearbeiten</h1>
          <p className="text-muted-foreground">
            {project.title} - Projektdaten bearbeiten
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/projects/${project.id}`}>
              Abbrechen
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}