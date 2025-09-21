'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings, Tag, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';

interface CriteriaCategory {
  id: string;
  name: string;
  type: 'boolean' | 'select' | 'multiselect';
  category: 'location' | 'project' | 'season' | 'custom';
  options?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels = {
  location: 'Veranstaltungsort',
  project: 'Projektmerkmale',
  season: 'Jahreszeiten',
  custom: 'Benutzerdefiniert'
};

const typeLabels = {
  boolean: 'Ja/Nein',
  select: 'Einzelauswahl',
  multiselect: 'Mehrfachauswahl'
};

export default function CriteriaCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [criteriaCategories, setCriteriaCategories] = useState<CriteriaCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CriteriaCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'boolean' as 'boolean' | 'select' | 'multiselect',
    category: 'project' as 'location' | 'project' | 'season' | 'custom',
    description: '',
    options: ['']
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !hasPermission(session?.user?.role, UserRole.ADMIN)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Load criteria categories from localStorage
    const savedCategories = localStorage.getItem('gbu-criteria-categories');
    if (savedCategories) {
      try {
        setCriteriaCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('Error loading criteria categories:', error);
        // Initialize with default categories
        initializeDefaultCategories();
      }
    } else {
      initializeDefaultCategories();
    }
  }, []);

  const initializeDefaultCategories = () => {
    const defaultCategories: CriteriaCategory[] = [
      {
        id: '1',
        name: 'Outdoor-Veranstaltung',
        type: 'boolean',
        category: 'location',
        description: 'Veranstaltung findet im Freien statt',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Elektrische Anlagen vorhanden',
        type: 'boolean',
        category: 'project',
        description: 'Projekt verwendet elektrische Anlagen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Generatoren/Notstromaggregate',
        type: 'boolean',
        category: 'project',
        description: 'Verwendung von Generatoren oder Notstromaggregaten',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Arbeiten über 2m Höhe',
        type: 'boolean',
        category: 'project',
        description: 'Arbeiten in Höhen über 2 Meter',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Publikumsverkehr',
        type: 'boolean',
        category: 'project',
        description: 'Veranstaltung mit Publikumszugang',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Nachtarbeit',
        type: 'boolean',
        category: 'project',
        description: 'Arbeiten während der Nachtzeit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        name: 'Verkehrsflächen betroffen',
        type: 'boolean',
        category: 'project',
        description: 'Beeinträchtigung von Verkehrswegen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        name: 'Gefahrstoffe',
        type: 'boolean',
        category: 'project',
        description: 'Verwendung von Gefahrstoffen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '9',
        name: 'Jahreszeiten',
        type: 'multiselect',
        category: 'season',
        options: ['Frühling', 'Sommer', 'Herbst', 'Winter'],
        description: 'Saisonale Gefährdungen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setCriteriaCategories(defaultCategories);
    localStorage.setItem('gbu-criteria-categories', JSON.stringify(defaultCategories));
  };

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

  if (!session?.user || !hasPermission(session.user.role, UserRole.ADMIN)) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'boolean',
      category: 'project',
      description: '',
      options: ['']
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: CriteriaCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      category: category.category,
      description: category.description || '',
      options: category.options || ['']
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error('Name ist erforderlich.');
        return;
      }

      // Check for duplicate names
      const existingCategory = criteriaCategories.find(c => 
        c.name.toLowerCase() === formData.name.toLowerCase() && 
        c.id !== editingCategory?.id
      );
      if (existingCategory) {
        toast.error('Ein Kriterium mit diesem Namen existiert bereits.');
        return;
      }

      // Validate options for select types
      if ((formData.type === 'select' || formData.type === 'multiselect')) {
        const validOptions = formData.options.filter(opt => opt.trim());
        if (validOptions.length === 0) {
          toast.error('Mindestens eine Option ist erforderlich.');
          return;
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedCategories;

      if (editingCategory) {
        // Update existing category
        updatedCategories = criteriaCategories.map(c => 
          c.id === editingCategory.id 
            ? { 
                ...c, 
                name: formData.name,
                type: formData.type,
                category: formData.category,
                description: formData.description,
                options: (formData.type === 'select' || formData.type === 'multiselect') 
                  ? formData.options.filter(opt => opt.trim()) 
                  : undefined,
                updatedAt: new Date().toISOString()
              }
            : c
        );
        toast.success('Kriterium erfolgreich aktualisiert!');
      } else {
        // Create new category
        const newCategory: CriteriaCategory = {
          id: Date.now().toString(),
          name: formData.name,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          options: (formData.type === 'select' || formData.type === 'multiselect') 
            ? formData.options.filter(opt => opt.trim()) 
            : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedCategories = [...criteriaCategories, newCategory];
        toast.success('Kriterium erfolgreich erstellt!');
      }

      setCriteriaCategories(updatedCategories);
      localStorage.setItem('gbu-criteria-categories', JSON.stringify(updatedCategories));

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Fehler beim Speichern des Kriteriums.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = criteriaCategories.find(c => c.id === categoryId);
    if (!category) return;

    if (!confirm(`Sind Sie sicher, dass Sie das Kriterium "${category.name}" löschen möchten?`)) {
      return;
    }

    try {
      const updatedCategories = criteriaCategories.filter(c => c.id !== categoryId);
      setCriteriaCategories(updatedCategories);
      localStorage.setItem('gbu-criteria-categories', JSON.stringify(updatedCategories));
      toast.success('Kriterium erfolgreich gelöscht!');
    } catch (error) {
      toast.error('Fehler beim Löschen des Kriteriums.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'location': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-green-100 text-green-800';
      case 'season': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boolean': return 'bg-gray-100 text-gray-800';
      case 'select': return 'bg-yellow-100 text-yellow-800';
      case 'multiselect': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auswahlkriterien verwalten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Kategorien und Kriterien für die automatische Gefährdungsauswahl
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Neues Kriterium
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kriterium bearbeiten' : 'Neues Kriterium erstellen'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Bearbeiten Sie die Eigenschaften des Kriteriums.'
                  : 'Erstellen Sie ein neues Auswahlkriterium für die automatische Gefährdungsauswahl.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="z.B. Pyrotechnik vorhanden"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Typ *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Kurze Beschreibung des Kriteriums"
                />
              </div>

              {(formData.type === 'select' || formData.type === 'multiselect') && (
                <div className="space-y-2">
                  <Label>Optionen *</Label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionsChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        {formData.options.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      <Plus className="mr-2 h-4 w-4" />
                      Option hinzufügen
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Wird gespeichert...' : (editingCategory ? 'Aktualisieren' : 'Erstellen')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = criteriaCategories.filter(c => c.category === key).length;
          return (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                  <Badge className={getCategoryColor(key)}>
                    {label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Auswahlkriterien
          </CardTitle>
          <CardDescription>
            Alle verfügbaren Kriterien für die automatische Gefährdungsauswahl
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criteriaCategories.length === 0 ? (
            <div className="text-center py-16">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Noch keine Kriterien vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie Ihr erstes Auswahlkriterium.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Erstes Kriterium erstellen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Optionen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteriaCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(category.category)}>
                        {categoryLabels[category.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(category.type)}>
                        {typeLabels[category.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {category.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {category.options ? (
                        <div className="flex flex-wrap gap-1">
                          {category.options.slice(0, 3).map((option, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                          {category.options.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.options.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}