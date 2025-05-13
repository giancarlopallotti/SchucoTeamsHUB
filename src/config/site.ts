// src/config/site.ts
import type { NavItem } from "@/types";
import {
  LayoutDashboard,
  Briefcase,
  Building,
  Users,
  CalendarDays,
  Tags,
  Files,
  Bell,
  LogOut,
} from "lucide-react";

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPERVISOR","AMMINISTRATORE","TECNICO"] },
  { title: "Progetti",  href: "/projects",   icon: Briefcase,      roles: ["SUPERVISOR","AMMINISTRATORE","TECNICO"] },
  { title: "Clienti",    href: "/clients",    icon: Building,       roles: ["SUPERVISOR","AMMINISTRATORE","TECNICO"] },
  { title: "Team",       href: "/teams",      icon: Users,          roles: ["SUPERVISOR","AMMINISTRATORE"] },
  { title: "Utenti",     href: "/users",      icon: Users,          roles: ["SUPERVISOR","AMMINISTRATORE"] },
  { title: "Calendario", href: "/calendar",   icon: CalendarDays,  roles: ["SUPERVISOR","AMMINISTRATORE","TECNICO"] },
  { title: "Tag",        href: "/tags",       icon: Tags,           roles: ["SUPERVISOR","AMMINISTRATORE"] },
  { title: "File",       href: "/files",      icon: Files,          roles: ["AMMINISTRATORE"] },
  { title: "Notifiche",  href: "/notifications", icon: Bell,         roles: ["SUPERVISOR","AMMINISTRATORE","TECNICO"] },
];
