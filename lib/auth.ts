import { getSession, type SessionPayload } from "@/lib/auth-session";

export async function getAuthSession() {
  return getSession();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: "Unauthorized" as const };
  }
  return { session, error: null };
}

/** Requires Admin role. Returns 403 if not admin. */
export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error || !session) {
    return { session: null, error: "Unauthorized" as const };
  }
  if (session.roleName !== "Admin") {
    return { session, error: "Forbidden" as const };
  }
  return { session, error: null };
}

export type { SessionPayload };
