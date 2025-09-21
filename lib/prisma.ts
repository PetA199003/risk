// Try to import PrismaClient, but handle gracefully if it fails
let PrismaClient: any = null;

try {
  const { PrismaClient: Client } = require('@prisma/client');
  PrismaClient = Client;
} catch (error) {
  console.warn('PrismaClient not available:', error.message);
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? 
  (PrismaClient ? new PrismaClient({
    log: ['query'],
  }) : null);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;