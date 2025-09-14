import { prisma } from '@/lib/prisma';

export async function createAuditLog(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}