// src/app/(app)/teams/[teamId]/edit/page.tsx
"use client";

import { TeamForm } from "@/components/forms/team-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { Team } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTeamById } from "@/services/teams";


export default function EditTeamPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const { data: teamData, isLoading: teamLoading, error: teamError } = useQuery<Team | null>({
    queryKey: ['team', teamId],
    queryFn: () => getTeamById(teamId),
    enabled: !!teamId && !!user && (user.role === "SUPERVISOR" || user.role === "AMMINISTRATORE"),
  });
  
  // Redirect if user is not authorized AFTER checking user loading and user role
  React.useEffect(() => {
    if (!userLoading && user && user.role !== "SUPERVISOR" && user.role !== "AMMINISTRATORE") {
      router.replace("/dashboard");
    }
  }, [user, userLoading, router]);


  if (userLoading || teamLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento...</p>
      </div>
    );
  }

  // This check is for after user data is loaded
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "AMMINISTRATORE")) {
     return ( // This might be redundant if the useEffect above redirects, but good as a fallback
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per modificare questo team. Contatta un amministratore.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati del team: {teamError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/teams')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!teamData) { // Team not found after loading and no error
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Team Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per il team con ID: {teamId}. Potrebbe essere stato eliminato.</p>
                 <Button variant="outline" onClick={() => router.push('/teams')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Team
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
      <TeamForm initialData={teamData} isEditing={true} />
    </div>
  );
}
