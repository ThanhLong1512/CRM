import { cache } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export type SessionDbUser = Pick<User, "id" | "email" | "name" | "role">;

export type SessionContext = {
  authUser: AuthUser | null;
  dbUser: SessionDbUser | null;
};

export const getSessionDbUser = cache(async (): Promise<SessionContext> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return { authUser: authUser ?? null, dbUser: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, name: true, role: true },
  });

  return { authUser, dbUser };
});

export function resolveUserRole(dbUser: SessionDbUser | null): UserRole {
  return dbUser?.role ?? "SALES";
}

export function isAdminRole(role: string): boolean {
  return role === "ADMIN";
}
