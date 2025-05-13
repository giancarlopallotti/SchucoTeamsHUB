// src/app/(app)/tags/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Tag as TagIcon, Trash2, Loader2, AlertTriangle, Settings2, Users, Building, Briefcase, Group } from "lucide-react"; // Aggiunto Settings2, Users, Building, Briefcase, Group
import { useUser } from "@/contexts/user-provider";
import type { Tag } from "@/types";
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
import React, { useMemo } from "react"; // Importato useMemo
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTags, deleteTag as deleteTagService } from "@/services/tags";

// Funzione helper per raggruppare i tag per categoria
const groupTagsByCategory = (tags: Tag[]): Record<Tag["category"], Tag[]> => {
    const initialGroups: Record<Tag["category"], Tag[]> = { USER: [], TEAM: [], CLIENT: [], PROJECT: [] };
    return tags.reduce((acc, tag) => {
        if (!acc[tag.category]) {
            acc[tag.category] = []; // Inizializza se la categoria non esiste (dovrebbe sempre esistere)
        }
        acc[tag.category].push(tag);
        return acc;
    }, initialGroups);
};

// Mappa delle categorie ai label e icone
const categoryConfig: Record<Tag["category"], { label: string; icon: React.ElementType }> = {
    USER: { label: "Utenti", icon: Users },
    TEAM: { label: "Team", icon: Group },
    CLIENT: { label: "Clienti", icon: Building },
    PROJECT: { label: "Progetti", icon: Briefcase },
};

export default function TagsPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags, isLoading, error } = useQuery<Tag[]>({
    queryKey: ['tags'], // Fetch all tags
    queryFn: () => getTags(), // Ensure getTags is called with no arguments
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTagService,
    onSuccess: (data, tagId) => {
      toast({
        title: "Tag Eliminato",
        description: `Il tag è stato eliminato con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: Error, tagId) => {
      toast({
        variant: "destructive",
        title: "Errore Eliminazione Tag",
        description: err.message, // Mostra l'errore specifico dal servizio (es. tag in uso)
      });
    },
  });

  const canManageTags = authUser?.role === "SUPERVISOR" || authUser?.role === "AMMINISTRATORE";

  const handleDeleteTag = (tagId: string) => {
    deleteTagMutation.mutate(tagId);
  };

  // Raggruppa i tag quando i dati sono disponibili
  const groupedTags = useMemo(() => {
    if (!tags) return {};
    return groupTagsByCategory(tags);
  }, [tags]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento tag...</p>
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
                <p>Impossibile caricare i tag: {error.message}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Tag</h1>
        {canManageTags && (
          <Button asChild>
            <Link href="/tags/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Crea Nuovo Tag
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {(Object.keys(groupedTags) as Array<Tag["category"]>).map((category) => {
          const config = categoryConfig[category];
          const categoryTags = groupedTags[category];
          if (!config) return null; // Salta se la categoria non è configurata
          const CategoryIcon = config.icon;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CategoryIcon className="mr-2 h-6 w-6 text-primary" />
                  Tag {config.label}
                </CardTitle>
                <CardDescription>
                  Tag specifici per {config.label.toLowerCase()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryTags && categoryTags.length > 0 ? (
                  <ul className="space-y-2">
                    {categoryTags.map((tag) => (
                      <li key={tag.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tag.name}</span>
                          <Badge variant="outline">{tag.usageCount} Utilizzi</Badge>
                        </div>
                        <div className="flex gap-1">
                          {canManageTags && (
                            <>
                              <Button variant="outline" size="sm" asChild title="Gestisci Associazioni">
                                <Link href={`/tags/${tag.id}/manage`}>
                                  <Settings2 className="h-4 w-4" />
                                  <span className="sr-only">Gestisci</span>
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    title="Elimina Tag"
                                    disabled={(tag.usageCount > 0) || (deleteTagMutation.isPending && deleteTagMutation.variables === tag.id)}
                                  >
                                    {deleteTagMutation.isPending && deleteTagMutation.variables === tag.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    <span className="sr-only">Elimina</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Stai per eliminare il tag "{tag.name}". Questa azione non può essere annullata. Potrai eliminare il tag solo se non è associato a nessun elemento (Utilizzi: {tag.usageCount}).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteTag(tag.id)}
                                        disabled={tag.usageCount > 0 || (deleteTagMutation.isPending && deleteTagMutation.variables === tag.id)}
                                    >
                                      Conferma Eliminazione
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nessun tag trovato per questa categoria.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

       {(!tags || tags.length === 0) && !isLoading && (
            <div className="mt-8 p-8 border border-dashed rounded-md flex flex-col items-center justify-center h-[300px]">
              <TagIcon className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Nessun tag trovato nel sistema.</p>
              {canManageTags && (
                <Button asChild className="mt-4">
                  <Link href="/tags/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crea il Tuo Primo Tag
                  </Link>
                </Button>
              )}
            </div>
        )}
    </div>
  );
}
