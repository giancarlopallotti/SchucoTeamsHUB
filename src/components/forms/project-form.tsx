// src/components/forms/project-form.tsx
"use client";

import type { Project, FileAttachment, Tag, UserProfile, Client } from "@/types";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip, Trash2, Loader2, Tag as TagIcon, Users, Briefcase, FileText, Building } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import { createProject, updateProject } from "@/services/projects";
import { getTags, createTag as createTagService } from "@/services/tags";
import { getUsers } from "@/services/users"; // To get team members
import { getClients } from "@/services/clients"; // To get clients
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid as isValidDate } from "date-fns";
import { cn } from "@/lib/utils";


const projectStatusEnum = z.enum(["Non Iniziato", "In Corso", "Completato", "In Sospeso", "Annullato"]);
const projectPriorityEnum = z.enum(["Bassa", "Media", "Alta"]);

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Il nome del progetto deve contenere almeno 3 caratteri." }).max(150),
  description: z.string().min(3, { message: "La descrizione deve contenere almeno 3 caratteri." }).max(2000), // Modificato da 10 a 3
  status: projectStatusEnum,
  priority: projectPriorityEnum,
  dueDate: z.date().optional().nullable(),
  clientIds: z.array(z.string()).min(1, { message: "Seleziona almeno un cliente."}),
  teamMemberIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  initialData?: Project | null;
  isEditing?: boolean;
}

export function ProjectForm({ initialData, isEditing = false }: ProjectFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [currentAttachedFiles, setCurrentAttachedFiles] = useState<FileAttachment[]>(initialData?.attachments || []);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [filesMarkedForRemoval, setFilesMarkedForRemoval] = useState<FileAttachment[]>([]);

  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialData?.tags || []);
  const [newTagName, setNewTagName] = useState("");

  const { data: availableClients, isLoading: isLoadingClients } = useQuery<Pick<Client, "id" | "companyName">[]>({
    queryKey: ['allClientsForProject'],
    queryFn: getClients, // Assuming getClients returns an array of Client objects
  });

  const { data: availableTeamMembers, isLoading: isLoadingTeamMembers } = useQuery<Pick<UserProfile, "id" | "firstName" | "lastName">[]>({
    queryKey: ['allUsersForProjectTeam'],
    queryFn: getUsers, // Assuming getUsers returns UserProfile[]
  });

  const { data: availableTags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['projectTags'],
    queryFn: () => getTags("PROJECT"),
  });


  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: initialData?.status || "Non Iniziato",
      priority: initialData?.priority || "Media",
      dueDate: initialData?.dueDate && isValidDate(new Date(initialData.dueDate)) ? new Date(initialData.dueDate) : null,
      clientIds: initialData?.clients?.map(c => c.id) || [],
      teamMemberIds: initialData?.teamMembers?.map(tm => tm.id) || [],
      tags: initialData?.tags || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description,
        status: initialData.status,
        priority: initialData.priority,
        dueDate: initialData.dueDate && isValidDate(new Date(initialData.dueDate)) ? new Date(initialData.dueDate) : null,
        clientIds: initialData.clients?.map(c => c.id) || [],
        teamMemberIds: initialData.teamMembers?.map(tm => tm.id) || [],
        tags: initialData.tags || [],
      });
      setCurrentAttachedFiles(initialData.attachments || []);
      setSelectedTagNames(initialData.tags || []);
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
    } else {
       form.reset({
        name: "", description: "", status: "Non Iniziato", priority: "Media", dueDate: null, clientIds: [], teamMemberIds: [], tags: []
      });
      setCurrentAttachedFiles([]);
      setSelectedTagNames([]);
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
    }
  }, [initialData, form]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      setNewlySelectedFiles(prev => [...prev, ...newFilesArray]);
      const newFileAttachments: FileAttachment[] = newFilesArray.map(file => ({
        id: `new-${file.name}-${Date.now()}`, name: file.name, url: URL.createObjectURL(file),
        type: file.type, size: file.size, uploadedBy: authUser?.id || "unknown",
        uploadedAt: new Date().toISOString(),
        linkedTo: initialData ? [{ type: 'project', id: initialData.id }] : [],
      }));
      setCurrentAttachedFiles(prev => [...prev, ...newFileAttachments]);
      event.target.value = "";
    }
  };

  const removeFile = (fileIdToRemove: string) => {
    const fileToRemove = currentAttachedFiles.find(f => f.id === fileIdToRemove);
    if (!fileToRemove) return;
    if (fileToRemove.id.startsWith('new-')) {
      setNewlySelectedFiles(prev => prev.filter(f => !(f.name === fileToRemove.name && f.size === fileToRemove.size)));
    } else if (fileToRemove.storagePath) {
      setFilesMarkedForRemoval(prev => [...prev, fileToRemove]);
    }
    setCurrentAttachedFiles(prev => prev.filter(file => file.id !== fileIdToRemove));
  };

  const handleTagToggle = (tagName: string) => {
    setSelectedTagNames(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  };

  const createTagMutation = useMutation({
    mutationFn: (newTagData: { name: string; category: "PROJECT" }) => createTagService(newTagData),
    onSuccess: (newTag) => {
      toast({ title: "Tag Creato", description: `Il tag "${newTag.name}" è stato creato.` });
      queryClient.invalidateQueries({ queryKey: ['projectTags'] });
      setSelectedTagNames(prev => [...prev, newTag.name]);
      setNewTagName("");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Errore Creazione Tag", description: error.message })
  });

  const handleCreateNewTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim().toUpperCase(), category: "PROJECT" }); // Assicurati che sia MAIUSCOLO
  };

  const createProjectMutation = useMutation({
    mutationFn: (payload: { projectData: ProjectFormValues, filesToUpload: File[], creatorId: string }) => {
        const clientsPick = payload.projectData.clientIds
            .map(id => availableClients?.find(c => c.id === id))
            .filter(Boolean) as Pick<Client, "id" | "companyName">[]; // Ensure correct type
        const teamMembersPick = (payload.projectData.teamMemberIds || [])
            .map(id => availableTeamMembers?.find(tm => tm.id === id))
            .filter(Boolean) as Pick<UserProfile, "id" | "firstName" | "lastName">[];

        return createProject(
            {
                ...payload.projectData,
                tags: selectedTagNames,
                dueDate: payload.projectData.dueDate ? payload.projectData.dueDate.toISOString() : undefined,
                clients: clientsPick,
                teamMembers: teamMembersPick,
                attachmentsFileObjects: payload.filesToUpload, // Pass File objects directly
            },
            payload.creatorId
        );
    },
    onSuccess: (data) => {
      toast({ title: "Progetto Creato", description: `Il progetto "${data.name}" è stato creato.` });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push("/projects");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Errore Creazione Progetto", description: error.message }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (payload: {
      projectId: string, projectData: ProjectFormValues, newFilesToUpload: File[],
      filesToRemovePaths: string[], currentFiles: FileAttachment[], updaterId: string
    }) => {
        const clientsPick = payload.projectData.clientIds
            .map(id => availableClients?.find(c => c.id === id))
            .filter(Boolean) as Pick<Client, "id" | "companyName">[];
        const teamMembersPick = (payload.projectData.teamMemberIds || [])
            .map(id => availableTeamMembers?.find(tm => tm.id === id))
            .filter(Boolean) as Pick<UserProfile, "id" | "firstName" | "lastName">[];

        return updateProject(
            payload.projectId,
            {
                ...payload.projectData,
                tags: selectedTagNames,
                dueDate: payload.projectData.dueDate ? payload.projectData.dueDate.toISOString() : undefined,
                clients: clientsPick, // Use the mapped Pick objects
                teamMembers: teamMembersPick, // Use the mapped Pick objects
            },
            payload.newFilesToUpload, payload.filesToRemovePaths, payload.currentFiles, payload.updaterId
        );
    },
    onSuccess: (data) => {
      toast({ title: "Progetto Aggiornato", description: `Il progetto "${data.name}" è stato aggiornato.` });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      router.push("/projects");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Errore Aggiornamento Progetto", description: error.message }),
  });

  async function onSubmit(data: ProjectFormValues) {
    if (!authUser) {
      toast({ variant: "destructive", title: "Errore", description: "Utente non autenticato." });
      return;
    }

    const projectPayload = { ...data, tags: selectedTagNames, dueDate: data.dueDate || null };

    if (isEditing && initialData) {
      const filesToRemoveStoragePaths = filesMarkedForRemoval.map(f => f.storagePath).filter(Boolean) as string[];
      const existingFilesToKeep = currentAttachedFiles.filter(cf => cf.storagePath && !filesMarkedForRemoval.some(fr => fr.id === cf.id));
      updateProjectMutation.mutate({
        projectId: initialData.id, projectData: projectPayload, newFilesToUpload: newlySelectedFiles,
        filesToRemovePaths: filesToRemoveStoragePaths, currentFiles: existingFilesToKeep, updaterId: authUser.id,
      });
    } else {
      createProjectMutation.mutate({
        projectData: projectPayload, filesToUpload: newlySelectedFiles, creatorId: authUser.id,
      });
    }
  }

  useEffect(() => {
    form.setValue("tags", selectedTagNames);
  }, [selectedTagNames, form]);

  const isSubmitting = createProjectMutation.isPending || updateProjectMutation.isPending || createTagMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6"/>{isEditing ? "Modifica Progetto" : "Crea Nuovo Progetto"}</CardTitle>
            <CardDescription>
              {isEditing ? `Modifica i dettagli per "${initialData?.name}".` : "Compila i campi per definire un nuovo progetto."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome Progetto</FormLabel><FormControl><Input placeholder="Installazione Finestre Villa Rossi" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrizione</FormLabel><FormControl><Textarea placeholder="Dettagli del lavoro, specifiche, materiali..." {...field} className="min-h-[100px]"/></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Stato</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona stato" /></SelectTrigger></FormControl><SelectContent>
                  {projectStatusEnum.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent></Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priorità</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona priorità" /></SelectTrigger></FormControl><SelectContent>
                  {projectPriorityEnum.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent></Select><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Data Scadenza (Opzionale)</FormLabel><Popover><PopoverTrigger asChild>
                <FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP") : <span>Scegli una data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus/>
              </PopoverContent></Popover><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5"/>Clienti Associati</CardTitle></CardHeader>
          <CardContent>
            {isLoadingClients ? <p>Caricamento clienti...</p> : ( availableClients && availableClients.length > 0 ? (
              <FormField control={form.control} name="clientIds" render={() => (
                <FormItem><FormLabel className="text-base">Clienti Disponibili</FormLabel><FormDescription>Seleziona i clienti per questo progetto.</FormDescription>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                  {availableClients.map((client) => (
                    <FormField key={client.id} control={form.control} name="clientIds" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl>
                        <Checkbox checked={field.value?.includes(client.id)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), client.id]) : field.onChange(field.value?.filter(value => value !== client.id))
                        }}/>
                      </FormControl><FormLabel className="font-normal">{client.companyName}</FormLabel></FormItem>
                    )}/>
                  ))}
                </div><FormMessage /></FormItem>
              )}/>
            ) : <p className="text-muted-foreground">Nessun cliente disponibile. Creane uno prima.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/>Membri del Team Assegnati</CardTitle></CardHeader>
          <CardContent>
            {isLoadingTeamMembers ? <p>Caricamento membri...</p> : ( availableTeamMembers && availableTeamMembers.length > 0 ? (
              <FormField control={form.control} name="teamMemberIds" render={() => (
                <FormItem><FormLabel className="text-base">Utenti Disponibili</FormLabel><FormDescription>Assegna utenti a questo progetto.</FormDescription>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                  {availableTeamMembers.map((member) => (
                    <FormField key={member.id} control={form.control} name="teamMemberIds" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl>
                        <Checkbox checked={field.value?.includes(member.id)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), member.id]) : field.onChange(field.value?.filter(value => value !== member.id))
                        }}/>
                      </FormControl><FormLabel className="font-normal">{member.firstName} {member.lastName}</FormLabel></FormItem>
                    )}/>
                  ))}
                </div><FormMessage /></FormItem>
              )}/>
            ) : <p className="text-muted-foreground">Nessun utente disponibile.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><TagIcon className="mr-2 h-5 w-5"/>Tag Progetto</CardTitle></CardHeader>
          <CardContent>
            {isLoadingTags ? <p>Caricamento tags...</p> : (<>
              {availableTags && availableTags.length > 0 && (
                <div className="space-y-2 mb-4"><FormLabel>Tag Esistenti</FormLabel><div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (<Button key={tag.id} type="button" variant={selectedTagNames.includes(tag.name) ? "default" : "outline"} onClick={() => handleTagToggle(tag.name)} size="sm">{tag.name}</Button>))}
                </div></div>
              )}
              <div className="flex items-center gap-2">
                <Input type="text" placeholder="Nuovo Tag (es. ESTERNO, INTERVENTO URGENTE)" value={newTagName} onChange={(e) => setNewTagName(e.target.value.toUpperCase())} className="flex-grow"/>
                <Button type="button" onClick={handleCreateNewTag} disabled={!newTagName.trim() || createTagMutation.isPending}>{createTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crea Tag"}</Button>
              </div><FormDescription>I tag devono essere in MAIUSCOLO.</FormDescription></>
            )}
            <FormField control={form.control} name="tags" render={() => (
              <FormItem className="mt-2">{selectedTagNames.length > 0 && (<div className="text-sm text-muted-foreground">Tag selezionati: {selectedTagNames.join(', ')}</div>)}<FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Paperclip className="mr-2 h-5 w-5"/>Allegati al Progetto</CardTitle></CardHeader>
          <CardContent>
            <FormItem><FormLabel htmlFor="project-files">Carica Nuovi File</FormLabel><FormControl>
              <Input id="project-files" type="file" multiple onChange={handleFileChange} />
            </FormControl><FormDescription>Documenti, immagini, schemi tecnici relativi al progetto.</FormDescription></FormItem>
            {currentAttachedFiles.length > 0 && (
              <div className="mt-4 space-y-2"><h4 className="font-medium text-sm">File Correnti:</h4><ul className="space-y-1">
                {currentAttachedFiles.map((file) => (<li key={file.id} className={`flex items-center justify-between p-2 border rounded-md text-sm ${filesMarkedForRemoval.find(f => f.id === file.id) ? 'line-through text-muted-foreground op70' : ''}`}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{file.name} ({(file.size / 1024).toFixed(1)} KB)</a>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={filesMarkedForRemoval.find(f => f.id === file.id) !== undefined}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </li>))}
              </ul></div>
            )}
            {filesMarkedForRemoval.length > 0 && (<p className="text-xs text-destructive mt-2">{filesMarkedForRemoval.length} file saranno rimossi al salvataggio.</p>)}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Salvataggio...</> : (isEditing ? "Salva Modifiche Progetto" : "Crea Progetto")}
        </Button>
      </form>
    </Form>
  );
}
