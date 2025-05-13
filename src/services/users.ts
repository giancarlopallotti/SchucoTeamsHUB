// src/services/users.ts

import type { UserProfile } from "@/types";

// Potrai qui definire utility comuni al frontend, es:
export function formatUserName(user: UserProfile) {
  return `${user.name} (${user.role})`;
}
