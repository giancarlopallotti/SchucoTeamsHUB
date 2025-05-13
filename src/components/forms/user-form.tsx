// src/components/forms/user-form.tsx
"use client";

import type { UserProfile, FileAttachment, UserRole, Team, Tag } from "@/types"; // Aggiunto Tag
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
import { Paperclip, Trash2, UserPlus, Users, Loader2, Image as ImageIcon, FileText, Tag as TagIcon } from "lucide-react"; // Aggiunto TagIcon
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import { createUser, updateUser } from "@/services/users";
import { getTeams } from "@/services/teams";
import { getTags, createTag as createTagService } from "@/services/tags"; // Importa funzioni per i tag
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

const userRoleEnum = z.enum(["TECNICO", "AMMINISTRATORE", "SUPERVISOR"]);

const userFormSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }).max(50),
  lastName: z.string().min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }).max(50),
  email: z.string().email({ message: "Inserisci un indirizzo email valido." }),
  phone: z.string().optional(),
  role: userRoleEnum,
  notes: z.string().max(1000, { message: "Le note non possono superare i 1000 caratteri." }).optional(),
  teamIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(), // Aggiunto campo per i nomi dei tag
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: UserProfile | null;
  isEditing?: boolean;
}

export function UserForm({ initialData, isEditing = false }: UserFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [currentAttachedFiles, setCurrentAttachedFiles] = useState<FileAttachment[]>(initialData?.files || []);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [filesMarkedForRemoval, setFilesMarkedForRemoval] = useState<FileAttachment[]>([]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar || null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

  // State per i tag
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialData?.tags || []);
  const [newTagName, setNewTagName] = useState("");


  const { data: availableTeams, isLoading: isLoadingTeams } = useQuery<Pick<Team, "id" | "name">[]>({
    queryKey: ['allTeamsForAssignment'],
    queryFn: getTeams,
  });

  // Query per ottenere i tag di categoria USER
  const { data: availableTags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['userTags'],
    queryFn: () => getTags("USER"),
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "TECNICO",
      notes: initialData?.notes || "",
      teamIds: initialData?.teamIds || [],
      tags: initialData?.tags || [], // Default per i tag
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        phone: initialData.phone || "",
        role: initialData.role,
        notes: initialData.notes || "",
        teamIds: initialData.teamIds || [],
        tags: initialData.tags || [],
      });
      setCurrentAttachedFiles(initialData.files || []);
      setAvatarPreview(initialData.avatar || null);
      setSelectedTagNames(initialData.tags || []); // Inizializza tag selezionati
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
      setNewAvatarFile(null);
    } else {
      form.reset({
        firstName: "", lastName: "", email: "", phone: "", role: "TECNICO", notes: "", teamIds: [], tags: []
      });
      setCurrentAttachedFiles([]);
      setAvatarPreview(null);
      setSelectedTagNames([]); // Reset tag selezionati
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
      setNewAvatarFile(null);
    }
  }, [initialData, form]);

  // Aggiorna i valori del form quando i tag selezionati cambiano
  useEffect(() => {
    form.setValue("tags", selectedTagNames);
  }, [selectedTagNames, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);
      setNewlySelectedFiles(prev => [...prev, ...newFilesArray]);
      const newFileAttachments: FileAttachment[] = newFilesArray.map(file => ({
        id: `new-${file.name}-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedBy: authUser?.id || "unknown-user",
        uploadedAt: new Date().toISOString(),
        linkedTo: { type: 'user', id: initialData?.id || 'new-user' },
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

  // Gestione Tag
  const handleTagToggle = (tagName: string) => {
    setSelectedTagNames(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const createTagMutation = useMutation({
    mutationFn: (newTagData: { name: string; category: "USER" }) => createTagService(newTagData),
    onSuccess: (newTag) => {
        toast({ title: "Tag Creato", description: `Il tag "${newTag.name}" è stato creato.` });
        queryClient.invalidateQueries({ queryKey: ['userTags'] });
        setSelectedTagNames(prev => [...prev, newTag.name]); // Auto-select the new tag
        setNewTagName(""); // Clear input
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Errore Creazione Tag", description: error.message });
    }
  });

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim().toUpperCase(), category: "USER" });
  };

  // Mutations per Create/Update User
  const createUserMutation = useMutation({
    mutationFn: (payload: { userData: UserFormValues, filesToUpload: File[], creatorId: string, avatarToUpload?: File | null }) =>
      createUser(
        { ...payload.userData, tags: selectedTagNames, phone: payload.userData.phone || undefined, notes: payload.userData.notes || undefined }, // Includi tags
        payload.filesToUpload,
        payload.creatorId
        // TODO: Integra upload avatar
      ),
    onSuccess: (data) => {
      toast({ title: "Utente Creato", description: `L'utente "${data.firstName} ${data.lastName}" è stato creato con successo.` });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push("/users");
    },
    onError: (error: Error) => {
      console.error("UserForm createUserMutation Error:", error);
      toast({ variant: "destructive", title: "Errore Creazione Utente", description: error.message });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: {
      userId: string,
      userData: UserFormValues,
      newFilesToUpload: File[],
      filesToRemovePaths: string[],
      currentFiles: FileAttachment[],
      updaterId: string,
      newAvatarFile?: File | null
    }) =>
      updateUser(
        payload.userId,
        { ...payload.userData, tags: selectedTagNames, phone: payload.userData.phone || undefined, notes: payload.userData.notes || undefined }, // Includi tags
        payload.newFilesToUpload,
        payload.filesToRemovePaths,
        payload.currentFiles,
        payload.updaterId
        // TODO: Integra update avatar
      ),
    onSuccess: (data) => {
      toast({ title: "Utente Aggiornato", description: `L'utente "${data.firstName} ${data.lastName}" è stato aggiornato.` });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      router.push("/users");
    },
    onError: (error: Error) => {
      console.error("UserForm updateUserMutation Error:", error);
      toast({ variant: "destructive", title: "Errore Aggiornamento Utente", description: error.message });
    },
  });


  async function onSubmit(data: UserFormValues) {
    console.log("[UserForm onSubmit] Initiated. isEditing:", isEditing);
    if (!authUser) {
      toast({ variant: "destructive", title: "Errore", description: "Utente non autenticato." });
      console.error("[UserForm onSubmit] Authentication error: User not logged in.");
      return;
    }
    console.log("[UserForm onSubmit] Form data validated:", data);

    const filesToRemoveStoragePaths = filesMarkedForRemoval.map(f => f.storagePath).filter(Boolean) as string[];
    const existingFilesToKeep = currentAttachedFiles.filter(
      cf => !filesMarkedForRemoval.some(fr => fr.id === cf.id) && !cf.id.startsWith('new-')
    );
    console.log("[UserForm onSubmit] Files to keep (passed to service):", existingFilesToKeep);

    const userDataPayload = { ...data, tags: selectedTagNames }; // Assicura che i tag selezionati siano inclusi


    if (isEditing && initialData) {
       console.log("[UserForm onSubmit] Calling updateUserMutation...");
      updateUserMutation.mutate({
        userId: initialData.id,
        userData: userDataPayload, // Passa il payload con i tag
        newFilesToUpload: newlySelectedFiles,
        filesToRemovePaths: filesToRemoveStoragePaths,
        currentFiles: existingFilesToKeep,
        updaterId: authUser.id,
        newAvatarFile: newAvatarFile,
      });
    } else {
        console.log("[UserForm onSubmit] Calling createUserMutation...");
      createUserMutation.mutate({
        userData: userDataPayload, // Passa il payload con i tag
        filesToUpload: newlySelectedFiles,
        creatorId: authUser.id,
        avatarToUpload: newAvatarFile,
      });
    }
     console.log("[UserForm onSubmit] Mutation called. Waiting for resolution...");
  }

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending || createTagMutation.isPending;
  console.log("[UserForm Render] isSubmitting:", isSubmitting);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Card Dettagli Utente */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Modifica Utente" : "Crea Nuovo Utente"}</CardTitle>
            <CardDescription>
              {isEditing ? `Modifica i dettagli per ${initialData?.firstName || ""} ${initialData?.lastName || ""}.` : "Compila i campi per creare un nuovo utente."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
                {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar Preview" width={100} height={100} className="rounded-full object-cover" data-ai-hint="user avatar"/>
                ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                 <FormItem>
                    <FormLabel htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary hover:underline">
                        {isEditing ? "Cambia Avatar" : "Carica Avatar"}
                    </FormLabel>
                    <FormControl>
                        <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </div>

            {/* User Details Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Mario" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Cognome</FormLabel><FormControl><Input placeholder="Rossi" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="mario.rossi@example.com" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Telefono</FormLabel><FormControl><Input type="tel" placeholder="+39 123 4567890" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Ruolo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona un ruolo" /></SelectTrigger></FormControl><SelectContent>
                <SelectItem value="TECNICO">Tecnico</SelectItem><SelectItem value="AMMINISTRATORE">Amministratore</SelectItem><SelectItem value="SUPERVISOR">Supervisore</SelectItem>
              </SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea placeholder="Eventuali note aggiuntive sull'utente..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </CardContent>
        </Card>

        {/* Card Assegnazione Team */}
        <Card>
          <CardHeader><CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Assegnazione Team</CardTitle></CardHeader>
          <CardContent>
            {isLoadingTeams ? <p>Caricamento team...</p> : (
              availableTeams && availableTeams.length > 0 ? (
                <FormField control={form.control} name="teamIds" render={() => (
                  <FormItem><div className="mb-4"><FormLabel className="text-base">Team Disponibili</FormLabel><FormDescription>Seleziona i team a cui questo utente apparterrà.</FormDescription></div>
                  <div className="space-y-2">
                    {availableTeams.map((team) => (<FormField key={team.id} control={form.control} name="teamIds" render={({ field }) => (
                      <FormItem key={team.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                        <Checkbox checked={field.value?.includes(team.id)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), team.id]) : field.onChange(field.value?.filter((value) => value !== team.id))
                        }}/>
                      </FormControl><FormLabel className="font-normal">{team.name}</FormLabel></FormItem>
                    )}/>))}
                  </div><FormMessage /></FormItem>
                )}/>
              ) : <p className="text-muted-foreground">Nessun team disponibile. Crea prima dei team.</p>
            )}
          </CardContent>
        </Card>

        {/* Card Tag Utente */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><TagIcon className="mr-2 h-5 w-5"/> Tag Utente</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingTags ? <p>Caricamento tags...</p> : (
                <>
                    {availableTags && availableTags.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <FormLabel>Tag Esistenti (Utente)</FormLabel>
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
                            placeholder="Nuovo Tag (es. ESPERTO_CALDAIE, JUNIOR)"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value.toUpperCase())}
                            className="flex-grow"
                        />
                        <Button type="button" onClick={handleCreateNewTag} disabled={!newTagName.trim() || createTagMutation.isPending}>
                            {createTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crea Tag"}
                        </Button>
                    </div>
                    <FormDescription>
                        I tag devono essere in MAIUSCOLO. Seleziona o crea nuovi tag specifici per gli utenti.
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


        {/* Card File Allegati */}
        <Card>
          <CardHeader><CardTitle className="flex items-center"><Paperclip className="mr-2 h-5 w-5" /> File Allegati</CardTitle></CardHeader>
          <CardContent>
            <FormItem><FormLabel htmlFor="user-files">Carica Nuovi File</FormLabel><FormControl>
              <Input id="user-files" type="file" multiple onChange={handleFileChange} />
            </FormControl><FormDescription>Carica documenti o immagini relative all'utente.</FormDescription></FormItem>
            {currentAttachedFiles.length > 0 && (
              <div className="mt-4 space-y-2"><h4 className="font-medium text-sm">File Correnti:</h4><ul className="space-y-1">
                {currentAttachedFiles.map((file) => (<li key={file.id} className={`flex items-center justify-between p-2 border rounded-md text-sm ${filesMarkedForRemoval.find(f => f.id === file.id) ? 'line-through text-muted-foreground opacity-70' : ''}`}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{file.name} ({(file.size / 1024).toFixed(1)} KB)</a>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={filesMarkedForRemoval.find(f => f.id === file.id) !== undefined}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </li>))}
              </ul></div>
            )}
            {filesMarkedForRemoval.length > 0 && (<p className="text-xs text-destructive mt-2">{filesMarkedForRemoval.length} file saranno rimossi al salvataggio.</p>)}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : (isEditing ? "Salva Modifiche Utente" : "Crea Utente")}
        </Button>
      </form>
    </Form>
  );
}
