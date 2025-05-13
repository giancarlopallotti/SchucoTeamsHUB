// src/app/(app)/users/[userId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Mail, Phone, Info, Paperclip, Loader2, AlertTriangle, Users, FileText as FileIcon } from "lucide-react";
import type { UserProfile, Team } from "@/types";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/services/users";
import { getTeams } from "@/services/teams"; // To fetch team names

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthUser();
  const userId = params.userId as string;
  
  const { data: user, isLoading: userLoading, error: userError } = useQuery<UserProfile | null>({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });

  const { data: allTeams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['allTeams'],
    queryFn: getTeams,
    enabled: !!user, // Only fetch teams if user data is available or being fetched
  });

  const canEditUser = authUser?.role === "SUPERVISOR" || authUser?.role === "AMMINISTRATORE";

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getTeamNames = (teamIds?: string[]): string => {
    if (!teamIds || teamIds.length === 0 || !allTeams) return "Nessun team";
    return teamIds.map(id => allTeams.find(t => t.id === id)?.name || "Team Sconosciuto").join(', ');
  };

  if (userLoading || teamsLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dettagli utente...</p>
      </div>
    );
  }

  if (userError) {
     return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile caricare i dettagli dell'utente: {userError.message}</p>
                 <Button variant="outline" onClick={() => router.push('/users')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Utenti
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Utente Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per l'utente con ID: {userId}. Potrebbe essere stato eliminato.</p>
                 <Button variant="outline" onClick={() => router.push('/users')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Utenti
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

      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl mb-1">{user.firstName} {user.lastName}</CardTitle>
              <Badge variant={user.role === 'SUPERVISOR' ? 'default' : user.role === 'AMMINISTRATORE' ? 'secondary' : 'outline'}>
                {user.role}
              </Badge>
              <CardDescription className="mt-1">
                Creato il: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}
              </CardDescription>
            </div>
          </div>
          {canEditUser && (
            <Button asChild size="sm" className="mt-4 sm:mt-0">
              <Link href={`/users/${user.id}/edit`}>
                <Edit3 className="mr-2 h-4 w-4" /> Modifica Utente
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Informazioni di Contatto</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email: <a href={`mailto:${user.email}`} className="text-primary hover:underline ml-1">{user.email}</a></p>
              {user.phone && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Telefono: <span className="ml-1">{user.phone}</span></p>}
            </div>
          </section>

          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Team</h2>
            <p className="text-sm text-muted-foreground">{getTeamNames(user.teamIds)}</p>
          </section>
          
          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Note</h2>
            {user.notes ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{user.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna nota per questo utente.</p>
            )}
          </section>

          <hr/>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />File Allegati</h2>
            {user.files && user.files.length > 0 ? (
              <ul className="space-y-2">
                {user.files.map((file) => (
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
              <p className="text-sm text-muted-foreground">Nessun file allegato a questo utente.</p>
            )}
          </section>
        </CardContent>
        <CardFooter className="mt-4 border-t pt-4">
             <p className="text-xs text-muted-foreground">ID Utente: {user.id}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
