'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, Users, Shield, Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { hasPermission, UserRole } from '@/lib/permissions';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<any>(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIV':
        return 'bg-green-100 text-green-800';
      case 'ENTWURF':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVIERT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AKTIV': return 'Aktiv';
      case 'ENTWURF': return 'Entwurf';
      case 'ARCHIVIERT': return 'Archiviert';
      default: return status;
    }
  };

  const hazardFactors = [
    { key: 'hasElectricity', label: 'Elektrische Anlagen' },
    { key: 'hasGenerator', label: 'Generatoren/Notstromaggregate' },
    { key: 'hasWorkAbove2m', label: 'Arbeiten über 2m Höhe' },
    { key: 'hasPublicAccess', label: 'Publikumsverkehr' },
    { key: 'hasNightWork', label: 'Nachtarbeit' },
    { key: 'hasTrafficArea', label: 'Verkehrsflächen betroffen' },
    { key: 'hasHazardousMaterials', label: 'Gefahrstoffe' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Projekten
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{project.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              {project.isOutdoor && (
                <Badge variant="outline">Outdoor</Badge>
              )}
            </div>
          </div>
        </div>
        {hasPermission(session.user.role, UserRole.PROJEKTLEITER) && (
          <Button asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Termine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Aufbau</h4>
              <p className="text-sm">
                {format(new Date(project.buildUpStart), 'dd.MM.yyyy', { locale: de })} - {' '}
                {format(new Date(project.buildUpEnd), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Veranstaltung</h4>
              <p className="text-sm">
                {format(new Date(project.eventStart), 'dd.MM.yyyy', { locale: de })} - {' '}
                {format(new Date(project.eventEnd), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Projektinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Teilnehmer</h4>
              <p className="text-sm">{project.participants?.length || 0} Personen</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Gefährdungen</h4>
              <p className="text-sm">{project.riskAssessmentIds ? project.riskAssessmentIds.length : 0} identifiziert</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Erstellt am</h4>
              <p className="text-sm">
                {format(new Date(project.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Beschreibung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gefährdungsfaktoren
          </CardTitle>
          <CardDescription>
            Identifizierte Risikofaktoren für dieses Projekt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {hazardFactors.map((factor) => (
              <div key={factor.key} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">{factor.label}</span>
                <Badge variant={project[factor.key] ? "default" : "secondary"}>
                  {project[factor.key] ? 'Ja' : 'Nein'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{project.riskAssessmentIds ? project.riskAssessmentIds.length : 0}</p>
                <p className="text-sm text-muted-foreground">Gefährdungsbeurteilungen</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Unterweisungen</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Berichte</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/hazards`}>
            <Shield className="mr-2 h-4 w-4" />
            Gefährdungen verwalten
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/participants`}>
            <Users className="mr-2 h-4 w-4" />
            Teilnehmer verwalten
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/reports`}>
            <FileText className="mr-2 h-4 w-4" />
            Berichte erstellen
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}/briefing`}>
            <Users className="mr-2 h-4 w-4" />
            Sicherheitsunterweisung
          </Link>
        </Button>
      </div>
    </div>
  );
}