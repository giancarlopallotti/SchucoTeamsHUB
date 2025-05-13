// src/types/index.d.ts
export type UserRole = "SUPERVISOR" | "AMMINISTRATORE" | "TECNICO" | "";
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: UserRole[];
}
