import { PrismaClient, UserRole, HazardCategory, ControlType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gbu-app.de' },
    update: {},
    create: {
      email: 'admin@gbu-app.de',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      password: adminPassword,
    },
  });

  const projektleiter = await prisma.user.upsert({
    where: { email: 'projektleiter@gbu-app.de' },
    update: {},
    create: {
      email: 'projektleiter@gbu-app.de',
      name: 'Max Mustermann',
      role: UserRole.PROJEKTLEITER,
      password: userPassword,
    },
  });

  const mitarbeiter = await prisma.user.upsert({
    where: { email: 'mitarbeiter@gbu-app.de' },
    update: {},
    create: {
      email: 'mitarbeiter@gbu-app.de',
      name: 'Lisa Musterfrau',
      role: UserRole.MITARBEITER,
      password: userPassword,
    },
  });

  // Create hazards with control measures
  const hazards = [
    {
      title: 'Elektrische Gefährdung',
      description: 'Stromschlag durch defekte oder unsachgemäß verwendete Elektrogeräte',
      category: HazardCategory.ELEKTRIK,
      defaultLikelihood: 2,
      defaultSeverity: 5,
      legalRefs: 'DGUV Vorschrift 3, VDE 0100',
      controlMeasures: [
        {
          description: 'Prüfung der elektrischen Anlagen durch Elektrofachkraft',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Verwendung von FI-Schutzschaltern',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Unterweisung im Umgang mit elektrischen Geräten',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Absturzgefahr',
      description: 'Sturz von erhöhten Arbeitsplätzen oder Bühnen',
      category: HazardCategory.HOEHE,
      defaultLikelihood: 3,
      defaultSeverity: 5,
      legalRefs: 'DGUV Regel 112-198, PSAgA',
      controlMeasures: [
        {
          description: 'Absturzsicherungen (Geländer, Netze)',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Persönliche Schutzausrüstung gegen Absturz',
          type: ControlType.PPE,
          mandatory: true,
        },
        {
          description: 'Unterweisung in Höhenarbeit',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Wetter und Unwetter',
      description: 'Gefährdung durch Wind, Regen, Blitz bei Outdoor-Veranstaltungen',
      category: HazardCategory.WETTER,
      defaultLikelihood: 4,
      defaultSeverity: 4,
      legalRefs: 'DIN EN 13782',
      controlMeasures: [
        {
          description: 'Wetterüberwachung und Frühwarnsystem',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Windlastberechnungen für Aufbauten',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Blitzschutzkonzept',
          type: ControlType.TECHNISCH,
          mandatory: false,
        },
      ],
    },
    {
      title: 'Kohlenmonoxid-Vergiftung',
      description: 'CO-Vergiftung durch Generatoren oder Heizgeräte',
      category: HazardCategory.CHEMISCH,
      defaultLikelihood: 2,
      defaultSeverity: 5,
      legalRefs: 'TRGS 900',
      controlMeasures: [
        {
          description: 'Aufstellung von Generatoren im Freien oder gut belüfteten Bereichen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'CO-Warnmelder installieren',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Regelmäßige Wartung der Verbrennungsgeräte',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Fahrzeugverkehr',
      description: 'Gefährdung durch rangierenede oder fahrende Fahrzeuge',
      category: HazardCategory.VERKEHR,
      defaultLikelihood: 3,
      defaultSeverity: 4,
      legalRefs: 'StVO, DGUV Regel 114-016',
      controlMeasures: [
        {
          description: 'Verkehrswege markieren und absperren',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Einweiser beim Rangieren einsetzen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Warnwesten tragen',
          type: ControlType.PPE,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Lärmbelastung',
      description: 'Gehörschädigung durch hohe Schallpegel',
      category: HazardCategory.LAERM,
      defaultLikelihood: 4,
      defaultSeverity: 3,
      legalRefs: 'LärmVibrationsArbSchV',
      controlMeasures: [
        {
          description: 'Gehörschutz bereitstellen',
          type: ControlType.PPE,
          mandatory: true,
        },
        {
          description: 'Schallpegelmessungen durchführen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Arbeitszeiten bei hohem Lärmpegel begrenzen',
          type: ControlType.ORGANISATORISCH,
          mandatory: false,
        },
      ],
    },
    {
      title: 'Brandgefahr',
      description: 'Brand durch elektrische Geräte, Pyrotechnik oder offenes Feuer',
      category: HazardCategory.BRAND,
      defaultLikelihood: 2,
      defaultSeverity: 5,
      legalRefs: 'Versammlungsstättenverordnung',
      controlMeasures: [
        {
          description: 'Feuerlöscher bereitstellen',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Brandschutzordnung erstellen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Rauchverbot in kritischen Bereichen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Sichtminderung bei Nachtarbeit',
      description: 'Unfallgefahr durch schlechte Sichtverhältnisse',
      category: HazardCategory.SONSTIGE,
      defaultLikelihood: 3,
      defaultSeverity: 3,
      legalRefs: 'ASR A3.4',
      controlMeasures: [
        {
          description: 'Ausreichende Beleuchtung installieren',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Reflektierende Arbeitskleidung tragen',
          type: ControlType.PPE,
          mandatory: true,
        },
        {
          description: 'Zusätzliche Pausenzeiten einhalten',
          type: ControlType.ORGANISATORISCH,
          mandatory: false,
        },
      ],
    },
    {
      title: 'Stolper- und Sturzgefahr',
      description: 'Verletzungen durch Kabel, unebenen Untergrund oder Hindernisse',
      category: HazardCategory.MECHANISCH,
      defaultLikelihood: 4,
      defaultSeverity: 2,
      legalRefs: 'DGUV Information 208-016',
      controlMeasures: [
        {
          description: 'Kabelbrücken und Kabelkanäle verwenden',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Arbeitsplätze gut beleuchten',
          type: ControlType.TECHNISCH,
          mandatory: true,
        },
        {
          description: 'Sicherheitsschuhe tragen',
          type: ControlType.PPE,
          mandatory: true,
        },
      ],
    },
    {
      title: 'Ermüdung und Überlastung',
      description: 'Unfälle durch Müdigkeit und Überforderung bei langen Arbeitszeiten',
      category: HazardCategory.SONSTIGE,
      defaultLikelihood: 3,
      defaultSeverity: 3,
      legalRefs: 'ArbZG, ASR A3.2',
      controlMeasures: [
        {
          description: 'Pausenzeiten einhalten',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Schichtpläne erstellen',
          type: ControlType.ORGANISATORISCH,
          mandatory: true,
        },
        {
          description: 'Aufgaben im Team verteilen',
          type: ControlType.ORGANISATORISCH,
          mandatory: false,
        },
      ],
    },
  ];

  for (const hazardData of hazards) {
    const { controlMeasures, ...hazardInfo } = hazardData;
    
    const hazard = await prisma.hazard.create({
      data: {
        ...hazardInfo,
        controlMeasures: {
          create: controlMeasures,
        },
      },
    });

    console.log(`Created hazard: ${hazard.title}`);
  }

  // Create sample project
  const sampleProject = await prisma.project.create({
    data: {
      title: 'Stadtfest Musterhausen 2024',
      location: 'Marktplatz, 12345 Musterhausen',
      isOutdoor: true,
      buildUpStart: new Date('2024-07-15T08:00:00'),
      buildUpEnd: new Date('2024-07-16T18:00:00'),
      eventStart: new Date('2024-07-17T14:00:00'),
      eventEnd: new Date('2024-07-17T23:00:00'),
      description: 'Jährliches Stadtfest mit Bühne, Ständen und Fahrgeschäften',
      createdByUserId: projektleiter.id,
      status: 'ENTWURF',
      hasElectricity: true,
      hasGenerator: true,
      hasWorkAbove2m: true,
      hasPublicAccess: true,
      hasTrafficArea: true,
    },
  });

  // Add some hazards to the sample project
  const allHazards = await prisma.hazard.findMany();
  const relevantHazards = allHazards.filter(h => 
    ['Elektrische Gefährdung', 'Absturzgefahr', 'Wetter und Unwetter', 'Kohlenmonoxid-Vergiftung', 'Fahrzeugverkehr']
    .includes(h.title)
  );

  for (const hazard of relevantHazards) {
    await prisma.projectHazard.create({
      data: {
        projectId: sampleProject.id,
        hazardId: hazard.id,
        likelihood: hazard.defaultLikelihood,
        severity: hazard.defaultSeverity,
        residualRisk: Math.max(1, Math.round((hazard.defaultLikelihood * hazard.defaultSeverity) * 0.7)),
        selected: true,
      },
    });
  }

  // Add sample participants
  const participants = [
    { firstName: 'Anna', lastName: 'Schmidt', email: 'a.schmidt@musterfirma.de', company: 'Musterfirma GmbH', role: 'Techniker' },
    { firstName: 'Thomas', lastName: 'Weber', email: 't.weber@eventservice.de', company: 'Event Service', role: 'Rigger' },
    { firstName: 'Sarah', lastName: 'Müller', email: 's.mueller@sicherheit.de', company: 'Sicherheit Plus', role: 'Sicherheitsbeauftragte' },
    { firstName: 'Michael', lastName: 'Wagner', email: 'm.wagner@technik.de', company: 'Wagner Technik', role: 'Elektriker' },
  ];

  for (const participant of participants) {
    await prisma.participant.create({
      data: {
        ...participant,
        projectId: sampleProject.id,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Login credentials:');
  console.log('Admin: admin@gbu-app.de / admin123');
  console.log('Projektleiter: projektleiter@gbu-app.de / user123');
  console.log('Mitarbeiter: mitarbeiter@gbu-app.de / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });