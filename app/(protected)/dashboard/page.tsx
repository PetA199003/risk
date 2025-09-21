'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Load projects from localStorage to get real counts
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

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen im Dashboard, {session.user.name}!
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Projekte</h3>
            </div>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt Projekte
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Veranstaltungen</h3>
            </div>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'AKTIV').length}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Projekte
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Benutzer</h3>
            </div>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Registrierte Benutzer
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Gefährdungsbeurteilungen</h3>
            </div>
            <div className="text-2xl font-bold">{projects.reduce((total, project) => total + (project.riskAssessmentIds ? project.riskAssessmentIds.length : 0), 0)}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt Beurteilungen
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Benutzerinformationen</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {session.user.name}</p>
            <p><strong>E-Mail:</strong> {session.user.email}</p>
            <p><strong>Rolle:</strong> {session.user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}