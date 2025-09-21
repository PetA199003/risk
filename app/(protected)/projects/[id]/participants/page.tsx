'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2, Users, Mail, Building, UserCheck, Upload } from 'lucide-react';
import { Download, PenTool } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';
import { SignaturePadComponent } from '@/components/signature-pad';
import { generateParticipantListPDF, downloadPDF } from '@/lib/pdf-generator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
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
          setParticipants(foundProject.participants || []);
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
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      role: '',
    });
    setEditingParticipant(null);
  };

  const handleEdit = (participant: any) => {
    setEditingParticipant(participant);
    setFormData({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email || '',
      company: participant.company || '',
      role: participant.role || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.firstName || !formData.lastName) {
        toast.error('Vor- und Nachname sind erforderlich.');
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedParticipants;

      if (editingParticipant) {
        // Update existing participant
        updatedParticipants = participants.map(p => 
          p.id === editingParticipant.id 
            ? { ...p, ...formData, updatedAt: new Date().toISOString() }
            : p
        );
        toast.success('Teilnehmer erfolgreich aktualisiert!');
      } else {
        // Create new participant
        const newParticipant = {
          id: Date.now().toString(),
          ...formData,
          projectId: project.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedParticipants = [...participants, newParticipant];
        toast.success('Teilnehmer erfolgreich hinzugefügt!');
      }

      // Update participants state
      setParticipants(updatedParticipants);

      // Update project in localStorage
      const savedProjects = localStorage.getItem('gbu-projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const updatedProjects = projects.map((p: any) => 
          p.id === project.id 
            ? { ...p, participants: updatedParticipants }
            : p
        );
        localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Fehler beim Speichern des Teilnehmers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (participantId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Teilnehmer löschen möchten?')) {
      return;
    }

    try {
      const updatedParticipants = participants.filter(p => p.id !== participantId);
      setParticipants(updatedParticipants);

      // Update project in localStorage
      const savedProjects = localStorage.getItem('gbu-projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const updatedProjects = projects.map((p: any) => 
          p.id === project.id 
            ? { ...p, participants: updatedParticipants }
            : p
        );
        localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
      }

      toast.success('Teilnehmer erfolgreich gelöscht!');
    } catch (error) {
      toast.error('Fehler beim Löschen des Teilnehmers.');
    }
  };

  const handleSignature = (participant: any) => {
    setCurrentParticipant(participant);
    setSignatureDialogOpen(true);
  };

  const handleSaveSignature = (signatureData: string) => {
    if (!currentParticipant) return;

    const updatedParticipants = participants.map(p => 
      p.id === currentParticipant.id 
        ? { 
            ...p, 
            signature: signatureData, 
            signedAt: new Date().toISOString() 
          }
        : p
    );

    setParticipants(updatedParticipants);

    // Update project in localStorage
    const savedProjects = localStorage.getItem('gbu-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p: any) => 
        p.id === project.id 
          ? { ...p, participants: updatedParticipants }
          : p
      );
      localStorage.setItem('gbu-projects', JSON.stringify(updatedProjects));
    }

    toast.success('Unterschrift erfolgreich gespeichert!');
    setCurrentParticipant(null);
  };

  const handleExportPDF = async () => {
    try {
      const pdfBytes = await generateParticipantListPDF(project, participants);
      const filename = `Teilnehmerliste_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      downloadPDF(pdfBytes, filename);
      toast.success('PDF erfolgreich erstellt!');
    } catch (error) {
      toast.error('Fehler beim Erstellen der PDF.');
    }
  };

  const canManage = hasPermission(session.user.role, UserRole.PROJEKTLEITER);

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
          <h1 className="text-3xl font-bold tracking-tight">Teilnehmer verwalten</h1>
          <p className="text-muted-foreground">
            {project.title} - Teilnehmer und Mitarbeiter verwalten
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Teilnehmer hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingParticipant ? 'Teilnehmer bearbeiten' : 'Neuen Teilnehmer hinzufügen'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingParticipant 
                      ? 'Bearbeiten Sie die Teilnehmerdaten.'
                      : 'Fügen Sie einen neuen Teilnehmer zum Projekt hinzu.'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Max"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Mustermann"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="max.mustermann@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Firma</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Musterfirma GmbH"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle/Position</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Techniker, Rigger, etc."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Wird gespeichert...' : (editingParticipant ? 'Aktualisieren' : 'Hinzufügen')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              CSV Import
            </Button>
            
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF Export
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{participants.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{participants.filter(p => p.email).length}</p>
                <p className="text-sm text-muted-foreground">Mit E-Mail</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{participants.filter(p => p.company).length}</p>
                <p className="text-sm text-muted-foreground">Mit Firma</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{participants.filter(p => p.signature).length}</p>
                <p className="text-sm text-muted-foreground">Unterwiesen</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teilnehmerliste
          </CardTitle>
          <CardDescription>
            Alle Teilnehmer und Mitarbeiter für dieses Projekt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Noch keine Teilnehmer vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fügen Sie Teilnehmer hinzu, um mit den Unterweisungen zu beginnen.
              </p>
              {canManage && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Teilnehmer hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unterschrift</TableHead>
                  {canManage && <TableHead className="text-right">Aktionen</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.firstName} {participant.lastName}
                    </TableCell>
                    <TableCell>
                      {participant.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {participant.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {participant.company}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.role || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {participant.signature ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Unterwiesen
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Nicht unterwiesen
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.signature ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-sm">✓ Unterschrieben</span>
                          {participant.signedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(participant.signedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSignature(participant)}
                        >
                          <PenTool className="mr-2 h-4 w-4" />
                          Unterschreiben
                        </Button>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(participant)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(participant.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <SignaturePadComponent
        isOpen={signatureDialogOpen}
        onClose={() => {
          setSignatureDialogOpen(false);
          setCurrentParticipant(null);
        }}
        onSave={handleSaveSignature}
        participantName={currentParticipant ? `${currentParticipant.firstName} ${currentParticipant.lastName}` : ''}
      />
    </div>
  );
}