'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GBU Veranstaltungsmanagement
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professionelle Verwaltung von Gefährdungsbeurteilungen und Unterweisungen 
            für Veranstaltungsprojekte
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/login">
                Anmelden
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Gefährdungsbeurteilungen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Systematische Erfassung und Bewertung von Risiken bei Veranstaltungen
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Teilnehmerverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verwaltung von Mitarbeitern und Teilnehmern mit digitalen Unterweisungen
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Dokumentation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatische Generierung von Berichten und Nachweisdokumenten
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Auswertungen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Übersichtliche Dashboards und Statistiken für bessere Entscheidungen
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Demo-Zugänge</CardTitle>
            <CardDescription className="text-center">
              Testen Sie das System mit den folgenden Zugangsdaten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Administrator</h4>
                  <p className="text-sm text-gray-600 mt-1">admin@gbu-app.de</p>
                  <p className="text-sm text-gray-600">admin123</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Projektleiter</h4>
                  <p className="text-sm text-gray-600 mt-1">projektleiter@gbu-app.de</p>
                  <p className="text-sm text-gray-600">user123</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Mitarbeiter</h4>
                  <p className="text-sm text-gray-600 mt-1">mitarbeiter@gbu-app.de</p>
                  <p className="text-sm text-gray-600">user123</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <Button asChild>
                  <Link href="/login">
                    Jetzt anmelden
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}