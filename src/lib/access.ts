import type { Role } from "@prisma/client";

type Viewer = { id: string; householdId: string; role: Role };

// Admins see the whole household; members see only rows they own.
export function transactionScope(viewer: Viewer) {
  return viewer.role === "ADMIN"
    ? { householdId: viewer.householdId }
    : { householdId: viewer.householdId, userId: viewer.id };
}

export function accountScope(viewer: Viewer) {
  return viewer.role === "ADMIN"
    ? { householdId: viewer.householdId }
    : { householdId: viewer.householdId, ownerId: viewer.id };
}
