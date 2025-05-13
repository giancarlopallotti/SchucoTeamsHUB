import type { LucideIcon } from "lucide-react";

export type UserRole = "SUPERVISOR" | "AMMINISTRATORE" | "TECNICO";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon | React.ElementType;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  roles?: UserRole[]; // Ruoli che possono vedere questa voce di menu
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName:string;
  email: string;
  role: UserRole;
  avatar?: string; // URL to avatar image
  phone?: string;
  notes?: string;
  files?: FileAttachment[];
  teamIds?: string[]; // IDs of teams the user is a member of
  createdBy?: string; // User ID of the creator
  createdAt?: string; // ISO Date string
  updatedBy?: string; // User ID of last updater
  updatedAt?: string; // ISO Date string of last update
  tags?: string[]; // Aggiunto campo tags per Utente
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  address: string;
  geolocationLink?: string;
  phoneFixed?: string;
  phoneMobile?: string;
  notes?: string;
  tags: string[];
  attachments: FileAttachment[];
  createdBy: string; // User ID
  createdAt: string; // ISO Date string
  awaitingAdminApproval?: boolean;
  updatedBy?: string; // User ID of last updater
  updatedAt?: string; // ISO Date string of last update
  approvedBy?: string; // Optional: track who approved
  approvedAt?: string; // Optional: track when approved
}

export interface Project {
  id: string;
  name: string;
  clients: Pick<Client, "id" | "companyName">[]; // Informazioni cliente semplificate
  description: string;
  status: "Non Iniziato" | "In Corso" | "Completato" | "In Sospeso" | "Annullato";
  priority: "Bassa" | "Media" | "Alta";
  teamMembers: Pick<UserProfile, "id" | "firstName" | "lastName">[]; // Informazioni utente semplificate
  attachments: FileAttachment[];
  tags: string[];
  createdBy: string; // User ID
  createdAt: string; // ISO Date string
  dueDate?: string; // ISO Date string
  updatedBy?: string; // User ID of last updater
  updatedAt?: string; // ISO Date string of last update
}

export interface Tag {
  id: string;
  name: string; // Maiuscolo
  category: "USER" | "CLIENT" | "PROJECT" | "TEAM"; // Aggiunta categoria TEAM
  usageCount: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  // Simplified linkedTo to support only one link per attachment for Firestore simplicity
  // If a file needs to be linked to multiple, consider a different structure or duplicating file info.
  linkedTo: { type: 'project' | 'client' | 'team' | 'user', id: string };
}


export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO Date string
  link?: string; // Link opzionale all'elemento correlato
  // targetUserId?: string; // Optional: To target notifications to specific users
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO Date string
  end: string; // ISO Date string
  allDay?: boolean;
  description?: string;
  type: 'personal' | 'team' | 'project';
  projectId?: string | null; // Allow null
  teamId?: string | null; // Allow null
  userId: string; // Chi l'ha creato/possiede
}

export interface Team {
  id: string;
  name: string;
  members: Pick<UserProfile, "id" | "firstName" | "lastName" | "role">[];
  notes?: string;
  files?: FileAttachment[];
  tags?: string[]; // Aggiunto campo tags per Team
  createdBy: string; // User ID del creatore (SUPERVISOR o AMMINISTRATORE)
  createdAt: string; // ISO Date string
  updatedBy?: string; // User ID of last updater
  updatedAt?: string; // ISO Date string of last update
}
