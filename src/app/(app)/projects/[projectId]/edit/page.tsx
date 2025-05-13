// src/app/(app)/projects/[projectId]/edit/page.tsx
"use client";

import { ProjectForm } from "@/components/forms/project-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "@/services/projects";

export default function EditProjectPage() {
  const { user: authUser, isLoading: authUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: projectData, isLoading: projectLoading, error: projectError } = useQuery<Project | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId && !!authUser, 
  });
  
  // Add role-based access control if needed
  React.useEffect(() => {
    // Example: Only SUPERVISOR or AMMINISTRATORE can edit projects
    // if (!authUserLoading && authUser && !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
    //   router.replace("/projects"); 
    // }
    if (!authUserLoading && !authUser) {
        router.replace("/dashboard"); // Or login page
    }
  }, [authUser, authUserLoading, router]);


  if (authUserLoading || projectLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dati progetto...</p>
      </div>
    );
  }
  
  // Fallback check if user is not loaded or authorized
  if (!authUser /* || !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE") */) {
     return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per modificare questo progetto o non sei loggato.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento Progetto</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati del progetto: {projectError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/projects')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Progetti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!projectData) { 
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Annulla Modifiche
      </Button>
      <ProjectForm initialData={projectData} isEditing={true} />
    </div>
  );
}
