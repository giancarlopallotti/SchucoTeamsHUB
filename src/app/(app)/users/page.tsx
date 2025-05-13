// src/app/(app)/users/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye, Edit3, Trash2, Loader2, UserPlus, AlertTriangle, Users as UsersIcon } from "lucide-react";
import { useUser as useAuthUser } from "@/contexts/user-provider"; // Renamed to avoid conflict
import type { UserProfile } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, deleteUser as deleteUserService } from "@/services/users";

export default function UsersPage() {
  const { user: authUser } = useAuthUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserService,
    onSuccess: (_, userId) => {
      toast({
        title: "Utente Eliminato",
        description: `L'utente è stato eliminato con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error, userId) => {
      toast({
        variant: "destructive",
        title: "Errore Eliminazione Utente",
        description: `Impossibile eliminare l'utente: ${err.message}`,
      });
    },
  });

  const canManageUsers = authUser?.role === "SUPERVISOR" || authUser?.role === "AMMINISTRATORE";

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento utenti...</p>
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
                <p>Impossibile caricare gli utenti: {error.message}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Utenti</h1>
        {canManageUsers && (
          <Button asChild>
            <Link href="/users/new">
              <UserPlus className="mr-2 h-4 w-4" /> Aggiungi Utente
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="mr-2 h-6 w-6" />
            Elenco Utenti
          </CardTitle>
          <CardDescription>
            Visualizza e gestisci gli utenti del sistema. 
            {canManageUsers ? " Puoi creare, modificare ed eliminare utenti." : " Solo Supervisori e Amministratori possono gestire gli utenti."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'SUPERVISOR' ? 'default' : user.role === 'AMMINISTRATORE' ? 'secondary' : 'outline'}>{user.role}</Badge></TableCell>
                    <TableCell>{user.teamIds && user.teamIds.length > 0 ? `${user.teamIds.length} team` : <span className="text-muted-foreground">Nessun team</span>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${user.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> Visualizza
                        </Link>
                      </Button>
                      {canManageUsers && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/users/${user.id}/edit`}>
                              <Edit3 className="mr-1 h-4 w-4" /> Modifica
                            </Link>
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={deleteUserMutation.isPending && deleteUserMutation.variables === user.id}>
                                {deleteUserMutation.isPending && deleteUserMutation.variables === user.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                Elimina
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Questa azione non può essere annullata. Eliminando l'utente, verranno rimossi tutti i dati associati. L'utente perderà l'accesso al sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} disabled={deleteUserMutation.isPending && deleteUserMutation.variables === user.id}>
                                  Conferma Eliminazione
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 p-8 border border-dashed rounded-md flex flex-col items-center justify-center h-[300px]">
              <UsersIcon className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Nessun utente trovato.</p>
              {canManageUsers && (
                <Button asChild className="mt-4">
                  <Link href="/users/new">
                    <UserPlus className="mr-2 h-4 w-4" /> Crea il Tuo Primo Utente
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
