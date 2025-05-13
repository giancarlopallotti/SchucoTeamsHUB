// src/components/forms/team-form.tsx
"use client";

import type { Team, FileAttachment, UserProfile, Tag } from "@/types"; // Aggiunto Tag
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Trash2, UserPlus, Users, Loader2, Tag as TagIcon, FileText } from "lucide-react"; // Aggiunto TagIcon, FileText
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/user-provider";
import { createTeam, updateTeam, getAvailableTechnicians } from "@/services/teams";
import { getTags, createTag as createTagService } from "@/services/tags"; // Importa funzioni per i tag
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const teamFormSchema = z.object({
  name: z.string().min(3, { message: "Il nome del team deve contenere almeno 3 caratteri." }).max(100),
  notes: z.string().max(500, { message: "Le note non possono superare i 500 caratteri." }).optional(),
  tags: z.array(z.string()).optional(), // Aggiunto campo per i nomi dei tag
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  initialData?: Team | null;
  isEditing?: boolean;
}

export function TeamForm({ initialData, isEditing = false }: TeamFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [currentAttachedFiles, setCurrentAttachedFiles] = useState<FileAttachment[]>(initialData?.files || []);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [filesMarkedForRemoval, setFilesMarkedForRemoval] = useState<FileAttachment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Pick<UserProfile, "id" | "firstName" | "lastName" | "role">[]>(initialData?.members || []);

  // State per i tag
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialData?.tags || []);
  const [newTagName, setNewTagName] = useState("");

  const { data: availableTechnicians, isLoading: isLoadingTechnicians } = useQuery({
    queryKey: ['availableTechnicians'],
    queryFn: getAvailableTechnicians,
  });

  // Query per ottenere i tag di categoria TEAM
  const { data: availableTags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['teamTags'],
    queryFn: () => getTags("TEAM"), // Filtra per categoria TEAM
  });

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      notes: initialData?.notes || "",
      tags: initialData?.tags || [], // Default per i tag
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        notes: initialData.notes || "",
        tags: initialData.tags || [],
      });
      setTeamMembers(initialData.members || []);
      setCurrentAttachedFiles(initialData.files || []);
      setSelectedTagNames(initialData.tags || []);
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
    } else {
      form.reset({ name: "", notes: "", tags: [] });
      setTeamMembers([]);
      setCurrentAttachedFiles([]);
      setSelectedTagNames([]);
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
    }
  }, [initialData, form]);

  // Aggiorna i valori del form quando i tag selezionati cambiano
   useEffect(() => {
    form.setValue("tags", selectedTagNames);
  }, [selectedTagNames, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      setNewlySelectedFiles(prev => [...prev, ...newFilesArray]);

      const newFileAttachments: FileAttachment[] = newFilesArray.map(file => ({
        id: `new-${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedBy: user?.id || "unknown-user",
        uploadedAt: new Date().toISOString(),
        // Simplified linkedTo for form purposes
        linkedTo: { type: 'team', id: initialData?.id || 'new-team' },
      }));
      setCurrentAttachedFiles(prev => [...prev, ...newFileAttachments]);
      event.target.value = "";
    }
  };

  const removeFile = (fileIdToRemove: string) => {
    const fileToRemove = currentAttachedFiles.find(f => f.id === fileIdToRemove);
    if (!fileToRemove) return;

    if (fileToRemove.id.startsWith('new-')) {
      setNewlySelectedFiles(prev => prev.filter(f => !(f.name === fileToRemove.name && f.size === fileToRemove.size) ));
    } else if(fileToRemove.storagePath) {
      setFilesMarkedForRemoval(prev => [...prev, fileToRemove]);
    }
    setCurrentAttachedFiles(prev => prev.filter(file => file.id !== fileIdToRemove));
  };

  const handleAddMember = (memberId: string) => {
    if (!availableTechnicians) return;
    const memberToAdd = availableTechnicians.find(tech => tech.id === memberId);
    if (memberToAdd && !teamMembers.find(m => m.id === memberId)) {
      setTeamMembers(prev => [...prev, memberToAdd]);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // Gestione Tag
  const handleTagToggle = (tagName: string) => {
    setSelectedTagNames(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const createTagMutation = useMutation({
    mutationFn: (newTagData: { name: string; category: "TEAM" }) => createTagService(newTagData),
    onSuccess: (newTag) => {
        toast({ title: "Tag Creato", description: `Il tag "${newTag.name}" è stato creato.` });
        queryClient.invalidateQueries({ queryKey: ['teamTags'] });
        setSelectedTagNames(prev => [...prev, newTag.name]); // Auto-select the new tag
        setNewTagName(""); // Clear input
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Errore Creazione Tag", description: error.message });
    }
  });

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim().toUpperCase(), category: "TEAM" });
  };


  // Mutations per Create/Update Team
  const createTeamMutation = useMutation({
    mutationFn: (formData: { teamData: Pick<Team, "name" | "notes" | "members" | "tags">, filesToUpload: File[], userId: string }) =>
      createTeam(formData.teamData, formData.filesToUpload, formData.userId),
    onSuccess: (data) => {
      toast({ title: "Team Creato", description: `Il team "${data.name}" è stato creato con successo.` });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      router.push("/teams");
    },
    onError: (error: Error) => {
      console.error("TeamForm createTeamMutation Error:", error);
      toast({ variant: "destructive", title: "Errore Creazione Team", description: error.message });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (formData: { teamId: string, teamData: Partial<Pick<Team, "name" | "notes" | "members" | "tags">>, newFilesToUpload: File[], filesToRemovePaths: string[], currentFiles: FileAttachment[], userId: string }) =>
      updateTeam(formData.teamId, formData.teamData, formData.newFilesToUpload, formData.filesToRemovePaths, formData.currentFiles, formData.userId),
    onSuccess: (data) => {
      toast({ title: "Team Aggiornato", description: `Il team "${data.name}" è stato aggiornato con successo.` });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', data.id] });
      router.push("/teams");
    },
    onError: (error: Error) => {
      console.error("TeamForm updateTeamMutation Error:", error);
      toast({ variant: "destructive", title: "Errore Aggiornamento Team", description: error.message });
    },
  });

  async function onSubmit(data: TeamFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Errore", description: "Utente non autenticato."});
      return;
    }

    const teamPayload = {
      name: data.name,
      notes: data.notes || "",
      members: teamMembers,
      tags: selectedTagNames, // Includi i tag selezionati
    };

    if (isEditing && initialData) {
      const filesToRemoveStoragePaths = filesMarkedForRemoval.map(f => f.storagePath).filter(Boolean) as string[];
      const existingFilesToKeep = currentAttachedFiles.filter(
        cf => !filesMarkedForRemoval.some(fr => fr.id === cf.id) && !cf.id.startsWith('new-')
      );
      updateTeamMutation.mutate({
        teamId: initialData.id,
        teamData: teamPayload,
        newFilesToUpload: newlySelectedFiles,
        filesToRemovePaths: filesToRemoveStoragePaths,
        currentFiles: existingFilesToKeep,
        userId: user.id,
      });
    } else {
      createTeamMutation.mutate({
        teamData: teamPayload,
        filesToUpload: newlySelectedFiles,
        userId: user.id,
      });
    }
  }

  const isSubmitting = createTeamMutation.isPending || updateTeamMutation.isPending || createTagMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Card Dettagli Team */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Modifica Team" : "Crea Nuovo Team"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Squadra Manutenzione Nord" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Aggiungi note o dettagli importanti sul team..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informazioni aggiuntive sul team, aree di competenza, ecc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card Membri Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" /> Membri del Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTechnicians ? <p>Caricamento tecnici...</p> : (
            <div className="space-y-4">
              {teamMembers.length > 0 && (
                <ul className="space-y-2">
                  {teamMembers.map(member => (
                    <li key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                      <span>{member.firstName} {member.lastName} ({member.role})</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => e.target.value && handleAddMember(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  disabled={isLoadingTechnicians || !availableTechnicians}
                >
                  <option value="" disabled>Seleziona un membro da aggiungere...</option>
                  {availableTechnicians?.filter(tech => !teamMembers.find(m => m.id === tech.id)).map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName} ({tech.role})
                    </option>
                  ))}
                </select>
                 <Button type="button" variant="outline" size="icon" disabled>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
               <FormDescription>
                Assegna i membri a questo team.
              </FormDescription>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Card Tag Team */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><TagIcon className="mr-2 h-5 w-5"/> Tag Team</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingTags ? <p>Caricamento tags...</p> : (
                <>
                    {availableTags && availableTags.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <FormLabel>Tag Esistenti (Team)</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => (
                                    <Button
                                        key={tag.id}
                                        type="button"
                                        variant={selectedTagNames.includes(tag.name) ? "default" : "outline"}
                                        onClick={() => handleTagToggle(tag.name)}
                                        size="sm"
                                    >
                                        {tag.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Nuovo Tag (es. MANUTENZIONE, SPECIALISTI)"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value.toUpperCase())}
                            className="flex-grow"
                        />
                        <Button type="button" onClick={handleCreateNewTag} disabled={!newTagName.trim() || createTagMutation.isPending}>
                            {createTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crea Tag"}
                        </Button>
                    </div>
                    <FormDescription>
                        I tag devono essere in MAIUSCOLO. Seleziona o crea nuovi tag specifici per i team.
                    </FormDescription>
                </>
                )}
                <FormField
                    control={form.control}
                    name="tags"
                    render={() => (
                        <FormItem className="mt-2">
                           {selectedTagNames.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                Tag selezionati: {selectedTagNames.join(', ')}
                            </div>
                           )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>


        {/* Card File Condivisi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <Paperclip className="mr-2 h-5 w-5" /> File Condivisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormItem>
              <FormLabel htmlFor="team-files">Carica Nuovi File</FormLabel>
              <FormControl>
                <Input id="team-files" type="file" multiple onChange={handleFileChange} />
              </FormControl>
              <FormDescription>
                Carica documenti o immagini da condividere con il team.
              </FormDescription>
            </FormItem>
            {currentAttachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">File Allegati:</h4>
                <ul className="space-y-1">
                  {currentAttachedFiles.map((file) => (
                     <li key={file.id} className={`flex items-center justify-between p-2 border rounded-md text-sm ${filesMarkedForRemoval.find(f => f.id === file.id) ? 'line-through text-muted-foreground opacity-70' : ''}`}>
                       <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-2">
                         <FileText className="h-4 w-4 text-muted-foreground"/>
                         {file.name} ({(file.size / 1024).toFixed(1)} KB)
                       </a>
                       <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={filesMarkedForRemoval.find(f => f.id === file.id) !== undefined}>
                         <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                     </li>
                   ))}
                </ul>
              </div>
            )}
             {filesMarkedForRemoval.length > 0 && (
                <p className="text-xs text-destructive mt-2">{filesMarkedForRemoval.length} file saranno rimossi al salvataggio.</p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : (isEditing ? "Salva Modifiche" : "Crea Team")}
        </Button>
      </form>
    </Form>
  );
}
