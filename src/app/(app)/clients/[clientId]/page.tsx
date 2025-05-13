// src/app/(app)/clients/[clientId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Mail, Phone, Info, Paperclip, Loader2, AlertTriangle, Building, User, MapPin, FileText as FileIcon, Tag as TagIcon } from "lucide-react";
import type { Client, FileAttachment } from "@/types";
import { useUser } from "@/contexts/user-provider";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientById, approveClient as approveClientService } from "@/services/clients"; 
import { useToast } from "@/hooks/use-toast";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useUser();
  const clientId = params.clientId as string;
  const { toast } = useToast();
  
  const { data: client, isLoading, error, refetch } = useQuery<Client | null>({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  });

  const canEditClient = authUser?.role === "SUPERVISOR" || authUser?.role === "AMMINISTRATORE";
  const canApproveClient = authUser?.role === "AMMINISTRATORE";


  const handleApproveClient = async () => {
    if (!client || !authUser || !canApproveClient) return;
    try {
        await approveClientService(client.id, authUser.id);
        toast({ title: "Cliente Approvato", description: `Il cliente "${client.companyName}" è stato approvato.` });
        refetch(); // Refetch client data to update UI
    } catch (e: any) {
        toast({ variant: "destructive", title: "Errore Approvazione", description: e.message });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dettagli cliente...</p>
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
                <p>Impossibile caricare i dettagli del cliente: {error.message}</p>
                 <Button variant="outline" onClick={() => router.push('/clients')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Clienti
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Cliente Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per il cliente con ID: {clientId}.</p>
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-3xl mb-1 flex items-center"><Building className="mr-3 h-8 w-8 text-primary"/>{client.companyName}</CardTitle>
            <CardDescription>
              Creato il: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('it-IT') : 'N/A'} da Utente ID: {client.createdBy}
            </CardDescription>
            {client.awaitingAdminApproval && (
                 <Badge variant="destructive" className="mt-2">In Attesa di Approvazione</Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {client.awaitingAdminApproval && canApproveClient && (
                <Button onClick={handleApproveClient} size="sm" variant="secondary">
                    Approva Cliente
                </Button>
            )}
            {canEditClient && (
                <Button asChild size="sm">
                <Link href={`/clients/${client.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Modifica Cliente
                </Link>
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Referente</h2>
            <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
          </section>
          <hr/>
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Informazioni di Contatto</h2>
            <div className="space-y-2 text-sm">
              {client.address && (
                <p className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    Indirizzo: <span className="ml-1">{client.address}</span>
                    {client.geolocationLink && (
                        <a href={client.geolocationLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">(Mappa)</a>
                    )}
                </p>
              )}
              {client.phoneFixed && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Tel. Fisso: <span className="ml-1">{client.phoneFixed}</span></p>}
              {client.phoneMobile && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Tel. Mobile: <span className="ml-1">{client.phoneMobile}</span></p>}
            </div>
          </section>

          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><TagIcon className="mr-2 h-5 w-5 text-primary" />Tag</h2>
            {client.tags && client.tags.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {client.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun tag assegnato.</p>
            )}
          </section>
          
          <hr/>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Note</h2>
            {client.notes ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna nota per questo cliente.</p>
            )}
          </section>

          <hr/>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />Allegati</h2>
            {client.attachments && client.attachments.length > 0 ? (
              <ul className="space-y-2">
                {client.attachments.map((file: FileAttachment) => (
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
              <p className="text-sm text-muted-foreground">Nessun file allegato a questo cliente.</p>
            )}
          </section>
        </CardContent>
        <CardFooter className="mt-4 border-t pt-4">
             <p className="text-xs text-muted-foreground">ID Cliente: {client.id}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
