// src/app/(app)/projects/[projectId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Info, Paperclip, Loader2, AlertTriangle, Briefcase, Users, Building, CalendarDays, Tag as TagIcon, FileText as FileIcon, CheckCircle, XCircle, AlertCircle as AlertCircleIcon, Clock } from "lucide-react";
import type { Project, FileAttachment, Client, UserProfile } from "@/types";
import { useUser } from "@/contexts/user-provider";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "@/services/projects";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";


const getStatusIcon = (status: Project["status"]) => {
  switch (status) {
    case "Non Iniziato": return <Clock className="mr-2 h-5 w-5 text-muted-foreground" />;
    case "In Corso": return <Loader2 className="mr-2 h-5 w-5 text-blue-500 animate-spin" />;
    case "Completato": return <CheckCircle className="mr-2 h-5 w-5 text-green-500" />;
    case "In Sospeso": return <AlertCircleIcon className="mr-2 h-5 w-5 text-yellow-500" />; // Use renamed import
    case "Annullato": return <XCircle className="mr-2 h-5 w-5 text-red-500" />;
    default: return <Info className="mr-2 h-5 w-5 text-muted-foreground" />;
  }
};

const getPriorityBadgeVariant = (priority: Project["priority"]): "default" | "secondary" | "destructive" | "outline" => {
    switch(priority) {
        case "Alta": return "destructive";
        case "Media": return "default"; // or secondary
        case "Bassa": return "outline";
        default: return "outline";
    }
};


export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useUser();
  const projectId = params.projectId as string;
  
  const { data: project, isLoading, error } = useQuery<Project | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  });

  // Determine if the current user can edit the project based on role
  // This can be more granular based on project ownership or team membership in a real app
  const canEditProject = authUser?.role === "SUPERVISOR" || authUser?.role === "AMMINISTRATORE";

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dettagli progetto...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile caricare i dettagli del progetto: {error.message}</p>
                 <Button variant="outline" onClick={() => router.push('/projects')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Progetti
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Progetto Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per il progetto con ID: {projectId}.</p>
                 <Button variant="outline" onClick={() => router.push('/projects')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Progetti
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-3xl mb-1 flex items-center">
                <Briefcase className="mr-3 h-8 w-8 text-primary"/>{project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(project.status)}
                <Badge variant="secondary">{project.status}</Badge>
                <Badge variant={getPriorityBadgeVariant(project.priority)}>Priorità: {project.priority}</Badge>
            </div>
            <CardDescription className="mt-2">
              Creato il: {project.createdAt ? format(parseISO(project.createdAt), "PPpp", { locale: it }) : 'N/A'} da Utente ID: {project.createdBy}
              {project.dueDate && (
                <span className="block mt-1"><CalendarDays className="inline mr-1 h-4 w-4" /> Scadenza: {format(parseISO(project.dueDate), "PP", { locale: it })}</span>
              )}
            </CardDescription>
          </div>
          {canEditProject && (
            <Button asChild size="sm" className="mt-4 sm:mt-0">
              <Link href={`/projects/${project.id}/edit`}>
                <Edit3 className="mr-2 h-4 w-4" /> Modifica Progetto
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Descrizione Progetto</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          </section>
          
          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Clienti Coinvolti</h2>
            {project.clients && project.clients.length > 0 ? (
              <ul className="space-y-2">
                {project.clients.map((client) => (
                  <li key={client.id} className="text-sm p-2 border rounded-md bg-card shadow-sm">
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline text-primary">
                        {client.companyName}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun cliente associato a questo progetto.</p>
            )}
          </section>

          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Team Assegnato</h2>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              <ul className="space-y-2">
                {project.teamMembers.map((member) => (
                  <li key={member.id} className="flex items-center p-2 border rounded-md bg-card shadow-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Link href={`/users/${member.id}`} className="font-medium hover:underline">
                        {member.firstName} {member.lastName}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun membro del team assegnato.</p>
            )}
          </section>

          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><TagIcon className="mr-2 h-5 w-5 text-primary" />Tag</h2>
            {project.tags && project.tags.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun tag assegnato.</p>
            )}
          </section>
          
          <hr/>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />Allegati</h2>
            {project.attachments && project.attachments.length > 0 ? (
              <ul className="space-y-2">
                {project.attachments.map((file: FileAttachment) => (
                  <li key={file.id} className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm hover:bg-accent/10 transition-colors">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                      <FileIcon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div>
                        <span className="font-medium group-hover:text-primary group-hover:underline">{file.name}</span>
                        <p className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB) - Tipo: {file.type}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun file allegato a questo progetto.</p>
            )}
          </section>
        </CardContent>
        <CardFooter className="mt-4 border-t pt-4">
             <p className="text-xs text-muted-foreground">ID Progetto: {project.id}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
