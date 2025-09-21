# GBU Veranstaltungsmanagement

Ein System zur Verwaltung von Gefährdungsbeurteilungen und Unterweisungen für Veranstaltungsprojekte.

## 🐳 Docker Setup (Empfohlen)

Das System kann vollständig mit Docker gestartet werden. Alle Abhängigkeiten und die Anwendung werden automatisch in Containern ausgeführt.

### Schnellstart

```bash
# Einfacher Start (Produktion)
./start-docker.sh prod

# Oder Entwicklungsmodus
./start-docker.sh dev
```

### Detaillierte Docker-Befehle

#### Entwicklung mit Docker (Hot Reload)
```bash
# Entwicklungsumgebung starten
npm run docker:dev

# Oder manuell
docker compose -f docker-compose.dev.yml up --build
```

#### Produktion mit Docker

```bash
# Produktionsumgebung starten
npm run docker:prod

# Oder manuell
docker compose up --build
```

#### Container-Verwaltung

```bash
# Container stoppen
npm run docker:stop

# Logs anzeigen
npm run docker:logs

# Komplett aufräumen (Container, Volumes, Images löschen)
npm run docker:clean
```

### Verfügbare Skripte

```bash
# Mit Start-Skript
./start-docker.sh dev     # Entwicklung
./start-docker.sh prod    # Produktion  
./start-docker.sh stop    # Stoppen
./start-docker.sh logs    # Logs anzeigen
./start-docker.sh clean   # Aufräumen

# Mit npm
npm run docker:dev        # Entwicklung
npm run docker:prod       # Produktion
npm run docker:stop       # Stoppen
npm run docker:logs       # Logs
npm run docker:clean      # Aufräumen
```

### Systemanforderungen

- **Docker** (Version 20.10+)
- **Docker Compose** (Version 2.0+)
- **Mindestens 2GB RAM** für Container
- **Port 3000** muss verfügbar sein

### Erste Schritte

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd gbu-veranstaltungsmanagement
   ```

2. **Docker starten**
   ```bash
   ./start-docker.sh prod
   ```

3. **Anwendung öffnen**
   - Browser: http://localhost:3000
   - Login mit Demo-Daten (siehe unten)

### Persistente Daten

- **Entwicklung**: Daten werden in `dev_data` Volume gespeichert
- **Produktion**: Daten werden in `app_data` Volume gespeichert
- **Backup**: Volumes bleiben bei Container-Neustarts erhalten

### Troubleshooting

```bash
# Container-Status prüfen
docker compose ps

# Logs anzeigen
docker compose logs app

# Container neu starten
docker compose restart app

# Komplett neu bauen
docker compose up --build --force-recreate
```

## Setup

### 1. Supabase Projekt erstellen

1. Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein neues Projekt
2. Notieren Sie sich die Projekt-URL und die API-Keys aus den Projekteinstellungen

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie `.env.example` zu `.env` und füllen Sie die Supabase-Werte aus:

```bash
cp .env.example .env
```

Tragen Sie Ihre Supabase-Daten ein:
```
NEXT_PUBLIC_SUPABASE_URL="https://ihr-projekt.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="ihr-anon-key"
SUPABASE_SERVICE_ROLE_KEY="ihr-service-role-key"
```

### 3. Datenbank Schema

Das Prisma Schema kann als Referenz für die Supabase-Tabellen verwendet werden. Erstellen Sie die entsprechenden Tabellen in Supabase:

- `users` - Benutzer
- `projects` - Projekte
- `hazards` - Gefährdungen
- `control_measures` - Schutzmaßnahmen
- `project_hazards` - Projekt-Gefährdungen Zuordnung
- `participants` - Teilnehmer
- `briefings` - Unterweisungen
- `signatures` - Unterschriften
- `attachments` - Anhänge
- `audit_logs` - Audit-Protokoll

### 4. Row Level Security (RLS)

Aktivieren Sie RLS für alle Tabellen und erstellen Sie entsprechende Policies für:
- Benutzer können nur ihre eigenen Daten sehen
- Projektleiter können ihre Projekte verwalten
- Admins haben vollen Zugriff

### 5. Installation und Start

```bash
npm install
npm run dev
```

## Features

- ✅ Supabase Integration
- ✅ Benutzerauthentifizierung
- ✅ Projektverwaltung
- ✅ Gefährdungsbeurteilungen
- ✅ Teilnehmerverwaltung
- ✅ Responsive Design
- ✅ TypeScript Support

## Technologie-Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Datenbank**: Supabase (PostgreSQL)
- **Authentifizierung**: Supabase Auth
- **Deployment**: Vercel/Netlify ready

## Entwicklung

Das Projekt nutzt sowohl Prisma (für Entwicklung/Schema) als auch Supabase (für Produktion). Die Supabase-Integration ermöglicht:

- Echtzeit-Updates
- Automatische API-Generierung  
- Integrierte Authentifizierung
- Row Level Security
- Automatische Backups