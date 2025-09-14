export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen im Dashboard!
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Projekte</h3>
            </div>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Aktive Projekte
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Veranstaltungen</h3>
            </div>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Geplante Veranstaltungen
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Benutzer</h3>
            </div>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Registrierte Benutzer
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Berichte</h3>
            </div>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Offene Berichte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}