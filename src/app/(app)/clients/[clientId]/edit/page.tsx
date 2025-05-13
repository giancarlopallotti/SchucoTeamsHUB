// src/app/(app)/clients/[clientId]/edit/page.tsx
"use client";

import { ClientForm } from "@/components/forms/client-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getClientById } from "@/services/clients"; // Assicurati che esista

export default function EditClientPage() {
  const { user: authUser, isLoading: authUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery<Client | null>({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId && !!authUser, // Fetch only if clientId and authUser are available
  });
  
  // Handle authorization - redirect if not authorized (e.g., only specific roles can edit)
  // This is a basic check; more complex logic might be needed based on your app's rules
  React.useEffect(() => {
    if (!authUserLoading && authUser && !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
        // Example: Only supervisor or admin can edit. Tecnicos might only view or need approval.
        // router.replace("/clients"); // Or a "permission denied" page
        console.warn("EditClientPage: Utente non autorizzato sta tentando di modificare un cliente.");
    }
  }, [authUser, authUserLoading, router]);


  if (authUserLoading || clientLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dati cliente...</p>
      </div>
    );
  }

  // This check is for after authUser data is loaded
  if (!authUser || !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
     return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per modificare questo cliente.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati del cliente: {clientError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/clients')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Clienti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!clientData) { 
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Cliente Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per il cliente con ID: {clientId}. Potrebbe essere stato eliminato.</p>
                 <Button variant="outline" onClick={() => router.push('/clients')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Clienti
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
      <ClientForm initialData={clientData} isEditing={true} />
    </div>
  );
}
