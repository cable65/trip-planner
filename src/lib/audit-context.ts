import { AsyncLocalStorage } from "node:async_hooks";

export type AuditContext = {
  actorId: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const storage = new AsyncLocalStorage<AuditContext>();

export function getAuditContext(): AuditContext {
  return (
    storage.getStore() ?? {
      actorId: null,
      actorRole: null,
      ipAddress: null,
      userAgent: null
    }
  );
}

export function runWithAuditContext<T>(ctx: AuditContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

