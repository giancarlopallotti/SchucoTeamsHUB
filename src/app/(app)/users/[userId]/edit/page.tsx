// src/app/(app)/users/[userId]/edit/page.tsx
"use client";

import { UserForm } from "@/components/forms/user-form";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/services/users";


export default function EditUserPage() {
  const { user: authUser, isLoading: authUserLoading } = useAuthUser();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { data: userData, isLoading: userLoading, error: userError } = useQuery<UserProfile | null>({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId && !!authUser && (authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE"),
  });
  
  React.useEffect(() => {
    if (!authUserLoading && authUser && authUser.role !== "SUPERVISOR" && authUser.role !== "AMMINISTRATORE") {
      router.replace("/dashboard");
    }
  }, [authUser, authUserLoading, router]);


  if (authUserLoading || userLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dati utente...</p>
      </div>
    );
  }

  if (!authUser || (authUser.role !== "SUPERVISOR" && authUser.role !== "AMMINISTRATORE")) {
     return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per modificare questo utente.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento Utente</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati dell'utente: {userError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/users')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Utenti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userData) { 
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Annulla Modifiche
      </Button>
      <UserForm initialData={userData} isEditing={true} />
    </div>
  );
}
