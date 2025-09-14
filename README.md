# GBU Veranstaltungsmanagement

Ein System zur Verwaltung von Gefährdungsbeurteilungen und Unterweisungen für Veranstaltungsprojekte.

## Docker Setup (Empfohlen)

### Entwicklung mit Docker

```bash
# Entwicklungsumgebung starten
npm run docker:dev

# Oder manuell
docker-compose -f docker-compose.dev.yml up --build
```

### Produktion mit Docker

```bash
# Produktionsumgebung starten
npm run docker:prod

# Oder manuell
docker-compose up --build
```

### Nur Datenbank starten

```bash
npm run docker:db
```

### Datenbank-Operationen mit Docker

```bash
# Prisma Client generieren
docker-compose exec app npx prisma generate

# Datenbank migrieren
docker-compose exec app npx prisma db push

# Datenbank mit Beispieldaten füllen
docker-compose exec app npm run db:seed
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