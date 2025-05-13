// src/app/(app)/teams/[teamId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Users, FileText, Info, Paperclip, Loader2, AlertTriangle } from "lucide-react";
import type { Team } from "@/types";
import { useUser } from "@/contexts/user-provider";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeamById } from "@/services/teams";

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const teamId = params.teamId as string;
  
  const { data: team, isLoading, error } = useQuery<Team | null>({
    queryKey: ['team', teamId],
    queryFn: () => getTeamById(teamId),
    enabled: !!teamId, // Esegui la query solo se teamId è disponibile
  });

  const canEditTeam = user?.role === "SUPERVISOR" || user?.role === "AMMINISTRATORE";

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dettagli team...</p>
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
                <p>Impossibile caricare i dettagli del team: {error.message}</p>
                 <Button variant="outline" onClick={() => router.push('/teams')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Team
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!team) {
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
      </Button>

      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-3xl mb-1">{team.name}</CardTitle>
            <CardDescription>
              Creato il: {new Date(team.createdAt).toLocaleDateString('it-IT')} da Utente ID: {team.createdBy}
            </CardDescription>
          </div>
          {canEditTeam && (
            <Button asChild size="sm">
              <Link href={`/teams/${team.id}/edit`}>
                <Edit3 className="mr-2 h-4 w-4" /> Modifica Team
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notes Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Note</h2>
            {team.notes ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{team.notes}</p>
            ) : (
              <p className="text-muted-foreground">Nessuna nota per questo team.</p>
            )}
          </section>

          <hr/>

          {/* Members Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Membri del Team</h2>
            {team.members && team.members.length > 0 ? (
              <ul className="space-y-2">
                {team.members.map((member) => (
                  <li key={member.id} className="flex items-center p-3 border rounded-md bg-card shadow-sm">
                    <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{member.firstName} {member.lastName}</span>
                      <Badge variant="secondary" className="ml-2">{member.role}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nessun membro assegnato a questo team.</p>
            )}
          </section>

          <hr/>
          
          {/* Files Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />File Condivisi</h2>
            {team.files && team.files.length > 0 ? (
              <ul className="space-y-2">
                {team.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm hover:bg-accent/10 transition-colors">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                      <FileText className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
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
              <p className="text-muted-foreground">Nessun file condiviso con questo team.</p>
            )}
          </section>
        </CardContent>
        <CardFooter className="mt-4">
             <p className="text-xs text-muted-foreground">ID Team: {team.id}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
