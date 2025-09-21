'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProjectReportsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Berichte</h1>
          <p className="text-muted-foreground">
            {project.title} - Berichte und Dokumentation
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verfügbare Berichte
          </CardTitle>
          <CardDescription>
            Erstellen und herunterladen Sie verschiedene Berichte für dieses Projekt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Gefährdungsbeurteilung</h3>
                    <p className="text-sm text-muted-foreground">
                      Vollständige Gefährdungsbeurteilung als PDF
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    PDF herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Teilnehmerliste</h3>
                    <p className="text-sm text-muted-foreground">
                      Liste aller Projektteilnehmer
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    PDF herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Sicherheitsunterweisung</h3>
                    <p className="text-sm text-muted-foreground">
                      Unterweisung basierend auf Gefährdungsbeurteilungen
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${project.id}/briefing`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Unterweisung erstellen
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Projektübersicht</h3>
                    <p className="text-sm text-muted-foreground">
                      Zusammenfassung aller Projektdaten
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    PDF herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}