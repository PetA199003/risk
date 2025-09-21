'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { hasPermission } from '@/lib/permissions';
import { UserRole } from '@/lib/permissions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Load projects from localStorage on component mount
    const savedProjects = localStorage.getItem('gbu-projects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  }, []);
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

  if (!session?.user) {
    return null; // Will redirect via useEffect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIV':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'ENTWURF':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'ARCHIVIERT':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Veranstaltungsprojekte und Gefährdungsbeurteilungen
          </p>
        </div>
        {hasPermission(session.user.role, UserRole.PROJEKTLEITER) && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Neues Projekt
            </Link>
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Noch keine Projekte vorhanden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Erstellen Sie Ihr erstes Projekt, um mit der Gefährdungsbeurteilung zu beginnen.
              </p>
              {hasPermission(session.user.role, UserRole.PROJEKTLEITER) && (
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Erstes Projekt erstellen
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {project.location}
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(project.eventStart), 'dd.MM.yyyy', { locale: de })}
                    {' - '}
                    {format(new Date(project.eventEnd), 'dd.MM.yyyy', { locale: de })}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" />
                      {project.participants.length} Teilnehmer
                    </div>
                    <div className="text-muted-foreground">
                      {project.riskAssessmentIds ? project.riskAssessmentIds.length : 0} Gefährdungsbeurteilungen
                    </div>
                  </div>

                  {project.isOutdoor && (
                    <Badge variant="outline" className="w-fit">
                      Outdoor-Veranstaltung
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/projects/${project.id}`}>
                        Details
                      </Link>
                    </Button>
                    {hasPermission(session.user.role, UserRole.PROJEKTLEITER) && (
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/projects/${project.id}/edit`}>
                          Bearbeiten
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}