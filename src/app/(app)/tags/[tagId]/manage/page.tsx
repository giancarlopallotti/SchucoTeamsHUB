// src/app/(app)/tags/[tagId]/manage/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft, Loader2, Save, Users, Building, Briefcase, Group, Tag as TagIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@/contexts/user-provider";
import type { Tag, UserProfile, Client, Project, Team } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTagById, getEntitiesByTag, updateTagAssociations } from "@/services/tags";
import { getUsers } from "@/services/users";
import { getClients } from "@/services/clients";
import { getProjects } from "@/services/projects";
import { getTeams } from "@/services/teams";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";

// Tipo generico per le entità da visualizzare
type Entity = Pick<UserProfile | Team | Client | Project, "id"> & {
  displayName: string; // Campo unificato per visualizzare nome/azienda/etc.
};

// Mappa delle categorie ai label e icone
const categoryConfig: Record<Tag["category"], { label: string; icon: React.ElementType; fetchFn: () => Promise<any[]>; nameField: keyof any }> = {
    USER: { label: "Utenti", icon: Users, fetchFn: getUsers, nameField: 'firstName' }, // Usa firstName o combina con lastName
    TEAM: { label: "Team", icon: Group, fetchFn: getTeams, nameField: 'name'},
    CLIENT: { label: "Clienti", icon: Building, fetchFn: getClients, nameField: 'companyName'},
    PROJECT: { label: "Progetti", icon: Briefcase, fetchFn: getProjects, nameField: 'name'},
};


export default function ManageTagAssociationsPage() {
  const { user: authUser, isLoading: authUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tagId = params.tagId as string;

  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [initialAssociatedIds, setInitialAssociatedIds] = useState<Set<string>>(new Set());

  // 1. Fetch Tag Details
  const { data: tag, isLoading: isLoadingTag, error: tagError } = useQuery<Tag | null>({
    queryKey: ['tag', tagId],
    queryFn: () => getTagById(tagId),
    enabled: !!tagId && !!authUser && (authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE"),
  });

  // 2. Fetch Entities Associated with the Tag
  const { data: associatedEntities, isLoading: isLoadingAssociated } = useQuery<Array<Pick<Entity, "id">>>({
    queryKey: ['associatedEntities', tagId, tag?.category],
    queryFn: () => tag ? getEntitiesByTag(tag.name, tag.category) : Promise.resolve([]),
    enabled: !!tag, // Fetch only when tag data (including category) is available
    onSuccess: (data) => {
      const ids = new Set(data.map(e => e.id));
      setSelectedEntityIds(ids); // Initialize selection with currently associated entities
      setInitialAssociatedIds(ids); // Store initial state for comparison
    }
  });

  // 3. Fetch All Potential Entities for the Tag's Category
  const categoryInfo = tag ? categoryConfig[tag.category] : null;
  const { data: allEntities, isLoading: isLoadingAllEntities, error: allEntitiesError } = useQuery<Entity[]>({
    queryKey: ['allEntities', tag?.category],
    queryFn: async () => {
      if (!categoryInfo) return [];
      const entitiesRaw = await categoryInfo.fetchFn();
      // Map raw data to the unified Entity structure
      return entitiesRaw.map(e => {
          let displayName = e[categoryInfo.nameField];
          if (tag?.category === 'USER') {
              displayName = `${e.firstName || ''} ${e.lastName || ''}`.trim();
          }
          return { id: e.id, displayName: displayName || `ID: ${e.id}` }; // Fallback display name
      });
    },
    enabled: !!categoryInfo && !!tag,
  });


  // Permissions check
  useEffect(() => {
    if (!authUserLoading && authUser && !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
      router.replace("/tags");
    } else if (!authUserLoading && !authUser) {
      router.replace("/dashboard");
    }
  }, [authUser, authUserLoading, router]);

  const handleCheckboxChange = (entityId: string, checked: boolean) => {
    setSelectedEntityIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(entityId);
      } else {
        newSet.delete(entityId);
      }
      return newSet;
    });
  };

  // Calculate changes
  const { entitiesToAdd, entitiesToRemove } = useMemo(() => {
    const currentSelected = selectedEntityIds;
    const initial = initialAssociatedIds;
    const entitiesToAdd = [...currentSelected].filter(id => !initial.has(id));
    const entitiesToRemove = [...initial].filter(id => !currentSelected.has(id));
    return { entitiesToAdd, entitiesToRemove };
  }, [selectedEntityIds, initialAssociatedIds]);

  const hasChanges = entitiesToAdd.length > 0 || entitiesToRemove.length > 0;


  // Mutation for updating associations
  const updateAssociationsMutation = useMutation({
    mutationFn: () => {
        if (!tag) throw new Error("Tag non definito.");
        return updateTagAssociations(tag.id, tag.name, tag.category, entitiesToAdd, entitiesToRemove);
    },
    onSuccess: () => {
      toast({ title: "Associazioni Aggiornate", description: `Le associazioni per il tag "${tag?.name}" sono state salvate.` });
      queryClient.invalidateQueries({ queryKey: ['tags'] }); // Invalidate general tags list
      queryClient.invalidateQueries({ queryKey: ['tag', tagId] }); // Invalidate this specific tag
      queryClient.invalidateQueries({ queryKey: ['associatedEntities', tagId, tag?.category] }); // Invalidate associated list
      // Optionally invalidate queries for the affected entities if their display depends on tags
      // queryClient.invalidateQueries({ queryKey: [getCollectionNameByCategory(tag.category)] });
      setInitialAssociatedIds(new Set(selectedEntityIds)); // Update initial state after successful save
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Aggiornamento", description: error.message });
    },
  });


  // Loading and Error States
  const isLoading = authUserLoading || isLoadingTag || isLoadingAssociated || isLoadingAllEntities;
  const error = tagError || allEntitiesError;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento associazioni tag...</p>
      </div>
    );
  }

  if (!authUser || !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Accesso Negato</CardTitle></CardHeader>
          <CardContent><p>Non hai i permessi per gestire le associazioni dei tag.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento</CardTitle></CardHeader>
          <CardContent><p>Impossibile caricare i dati: {error.message}</p></CardContent>
           <CardFooter><Button variant="outline" onClick={() => router.push('/tags')}><ArrowLeft className="mr-2 h-4 w-4"/>Torna ai Tag</Button></CardFooter>
        </Card>
      </div>
    );
  }

  if (!tag || !categoryInfo) {
      return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Tag Non Trovato</CardTitle></CardHeader>
            <CardContent><p>Impossibile trovare i dati per il tag specificato.</p></CardContent>
             <CardFooter><Button variant="outline" onClick={() => router.push('/tags')}><ArrowLeft className="mr-2 h-4 w-4"/>Torna ai Tag</Button></CardFooter>
        </Card>
      </div>
    )
  }

  const CategoryIcon = categoryInfo.icon;


  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" onClick={() => router.push('/tags')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'Elenco Tag
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TagIcon className="h-6 w-6 text-primary" />
            Gestisci Associazioni per: <Badge variant="secondary" className="text-xl px-3 py-1">{tag.name}</Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 pt-2">
            <CategoryIcon className="h-5 w-5 text-muted-foreground" />
            Categoria: {categoryInfo.label} - Seleziona/deseleziona gli elementi da associare a questo tag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allEntities && allEntities.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto border p-4 rounded-md">
                {allEntities.map((entity) => (
                    <div key={entity.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                        <Checkbox
                            id={`entity-${entity.id}`}
                            checked={selectedEntityIds.has(entity.id)}
                            onCheckedChange={(checked) => handleCheckboxChange(entity.id, !!checked)}
                        />
                        <label
                            htmlFor={`entity-${entity.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow"
                        >
                            {entity.displayName}
                        </label>
                    </div>
                ))}
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-4">Nessun elemento trovato nella categoria '{categoryInfo.label}'.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => router.push('/tags')}>Annulla</Button>
          <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button disabled={!hasChanges || updateAssociationsMutation.isPending}>
                        {updateAssociationsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Salva Modifiche
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Conferma Modifiche</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per aggiornare le associazioni per il tag "{tag.name}". <br/>
                            {entitiesToAdd.length > 0 && `Verrà aggiunto a ${entitiesToAdd.length} elementi.`} <br/>
                            {entitiesToRemove.length > 0 && `Verrà rimosso da ${entitiesToRemove.length} elementi.`} <br/>
                            Procedere?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => updateAssociationsMutation.mutate()}
                            disabled={updateAssociationsMutation.isPending}
                        >
                          Conferma
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
