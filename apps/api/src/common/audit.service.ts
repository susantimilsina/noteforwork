import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export type ActorType = 'PATIENT' | 'PHYSICIAN' | 'ADMIN' | 'SYSTEM' | 'PUBLIC';

/** Append-only audit trail. Never put raw PHI in `meta` — reference IDs instead. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(event: {
    actorType: ActorType;
    actorId?: string;
    action: string;
    entity: string;
    entityId: string;
    meta?: Record<string, unknown>;
  }) {
    return this.prisma.client.auditEvent.create({
      data: { ...event, meta: (event.meta ?? {}) as object },
    });
  }
}
