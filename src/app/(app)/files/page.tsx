// src/app/(app)/files/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileArchive, FileText, Trash2, Loader2, AlertTriangle, Download, ExternalLink } from "lucide-react";
import { useUser } from "@/contexts/user-provider";
import type { FileAttachment } from "@/types";
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
import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllFiles, deleteFile as deleteFileService } from "@/services/files"; // Assuming these services exist
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";


export default function FilesPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if user is not an administrator
  useEffect(() => {
    if (!userLoading && user && user.role !== "AMMINISTRATORE") {
      router.replace("/dashboard");
    }
  }, [user, userLoading, router]);

  const { data: files, isLoading: filesLoading, error } = useQuery<FileAttachment[]>({
    queryKey: ['allFiles'],
    queryFn: getAllFiles,
    enabled: !!user && user.role === "AMMINISTRATORE", // Only fetch if user is admin
  });

  const deleteFileMutation = useMutation({
    mutationFn: (payload: { fileId: string, storagePath?: string }) => deleteFileService(payload.fileId, payload.storagePath),
    onSuccess: (_, { fileId }) => {
      toast({ title: "File Eliminato", description: "Il file è stato eliminato con successo." });
      queryClient.invalidateQueries({ queryKey: ['allFiles'] });
      // Potrebbe essere necessario invalidare anche le query relative a team, user, client, project se il file era lì
    },
    onError: (err: Error, { fileId }) => {
      toast({ variant: "destructive", title: "Errore Eliminazione", description: `Impossibile eliminare il file: ${err.message}` });
    },
  });

  const handleDeleteFile = (fileId: string, storagePath?: string) => {
    if (!fileId) {
        toast({ variant: "destructive", title: "Errore", description: "ID file mancante." });
        return;
    }
    deleteFileMutation.mutate({ fileId, storagePath });
  };
  
  const getLinkForEntity = (entityType: FileAttachment["linkedTo"][0]["type"], entityId: string): string => {
    switch (entityType) {
        case "user": return `/users/${entityId}`;
        case "client": return `/clients/${entityId}`;
        case "project": return `/projects/${entityId}`;
        case "team": return `/teams/${entityId}`;
        default: return "#"; // Fallback
    }
  }


  if (userLoading || filesLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento file...</p>
      </div>
    );
  }

  if (!user || user.role !== "AMMINISTRATORE") {
     return ( // Fallback in case useEffect redirect fails
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Questa sezione è riservata agli amministratori.</p>
          </CardContent>
        </Card>
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
                <p>Impossibile caricare l'elenco dei file: {error.message}</p>
            </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione File (Amministratore)</h1>
        {/* Add Upload button or other actions if needed */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileArchive className="mr-2 h-6 w-6" />
            Tutti i File Caricati nel Sistema
          </CardTitle>
           <CardDescription>
            Visualizza, scarica ed elimina tutti i file caricati nelle varie sezioni dell'applicazione.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {files && files.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome File</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Caricato Da</TableHead>
                  <TableHead>Caricato Il</TableHead>
                  <TableHead>Collegato A</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {file.name}
                    </TableCell>
                    <TableCell><Badge variant="outline">{file.type || "Sconosciuto"}</Badge></TableCell>
                    <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                    <TableCell>{file.uploadedBy || "N/A"}</TableCell>
                    <TableCell>{format(new Date(file.uploadedAt), "PPpp", { locale: it })}</TableCell>
                    <TableCell>
                        {file.linkedTo?.map(link => (
                            <Link key={`${link.type}-${link.id}`} href={getLinkForEntity(link.type, link.id)} className="mr-1">
                                <Badge variant="secondary" className="capitalize hover:bg-primary hover:text-primary-foreground">
                                    {link.type} <ExternalLink className="ml-1 h-3 w-3"/>
                                </Badge>
                            </Link>
                        ))}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                          <Download className="mr-1 h-4 w-4" /> Scarica
                        </a>
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={deleteFileMutation.isPending && deleteFileMutation.variables?.fileId === file.id}
                          >
                            {deleteFileMutation.isPending && deleteFileMutation.variables?.fileId === file.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                            Elimina
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione non può essere annullata. Il file "{file.name}" verrà eliminato permanentemente dallo storage e i riferimenti potrebbero essere rimossi dalle entità collegate.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFile(file.id, file.storagePath)} disabled={deleteFileMutation.isPending && deleteFileMutation.variables?.fileId === file.id}>
                              Conferma Eliminazione
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 p-8 border border-dashed rounded-md flex flex-col items-center justify-center h-[300px]">
              <FileArchive className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Nessun file trovato nel sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
