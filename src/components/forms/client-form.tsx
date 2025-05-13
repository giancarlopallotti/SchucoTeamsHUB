// src/components/forms/client-form.tsx
"use client";

import type { Client, FileAttachment, Tag, UserProfile } from "@/types";
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
import { Paperclip, Trash2, Loader2, Tag as TagIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/user-provider";
import { createClient, updateClient, getClientById } from "@/services/clients";
import { getTags, createTag as createTagService } from "@/services/tags";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

const clientFormSchema = z.object({
  companyName: z.string().min(2, { message: "Il nome dell'azienda deve contenere almeno 2 caratteri." }).max(100),
  contactPerson: z.string().min(2, { message: "Il nome del referente deve contenere almeno 2 caratteri." }).max(100),
  address: z.string().min(5, { message: "L'indirizzo deve contenere almeno 5 caratteri." }),
  phoneFixed: z.string().optional(),
  phoneMobile: z.string().optional(),
  notes: z.string().max(2000, { message: "Le note non possono superare i 2000 caratteri." }).optional(),
  tags: z.array(z.string()).optional(), // Array of tag names
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client | null;
  isEditing?: boolean;
}

export function ClientForm({ initialData, isEditing = false }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: authUser } = useUser();
  const queryClient = useQueryClient();

  const [currentAttachedFiles, setCurrentAttachedFiles] = useState<FileAttachment[]>(initialData?.attachments || []);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [filesMarkedForRemoval, setFilesMarkedForRemoval] = useState<FileAttachment[]>([]);
  
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialData?.tags || []);
  const [newTagName, setNewTagName] = useState("");


  const { data: availableTags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['clientTags'],
    queryFn: () => getTags("CLIENT"),
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      contactPerson: initialData?.contactPerson || "",
      address: initialData?.address || "",
      phoneFixed: initialData?.phoneFixed || "",
      phoneMobile: initialData?.phoneMobile || "",
      notes: initialData?.notes || "",
      tags: initialData?.tags || [],
    },
  });

 useEffect(() => {
    if (initialData) {
      form.reset({
        companyName: initialData.companyName,
        contactPerson: initialData.contactPerson,
        address: initialData.address,
        phoneFixed: initialData.phoneFixed || "",
        phoneMobile: initialData.phoneMobile || "",
        notes: initialData.notes || "",
        tags: initialData.tags || [],
      });
      setCurrentAttachedFiles(initialData.attachments || []);
      setSelectedTagNames(initialData.tags || []);
      setNewlySelectedFiles([]);
      setFilesMarkedForRemoval([]);
    } else {
      form.reset({
        companyName: "", contactPerson: "", address: "", phoneFixed: "", phoneMobile: "", notes: "", tags: []
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
        id: `new-${file.name}-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for preview
        type: file.type,
        size: file.size,
        uploadedBy: authUser?.id || "unknown-user",
        uploadedAt: new Date().toISOString(),
        linkedTo: initialData ? [{ type: 'client', id: initialData.id }] : [],
      }));
      setCurrentAttachedFiles(prev => [...prev, ...newFileAttachments]);
      event.target.value = ""; // Reset input to allow selecting the same file again if removed
    }
  };

  const removeFile = (fileIdToRemove: string) => {
    const fileToRemove = currentAttachedFiles.find(f => f.id === fileIdToRemove);
    if (!fileToRemove) return;

    if (fileToRemove.id.startsWith('new-')) {
      // It's a newly selected file, not yet uploaded
      setNewlySelectedFiles(prev => prev.filter(f => !(f.name === fileToRemove.name && f.size === fileToRemove.size)));
    } else if (fileToRemove.storagePath) {
      // It's an existing file, mark for removal from storage
      setFilesMarkedForRemoval(prev => [...prev, fileToRemove]);
    }
    setCurrentAttachedFiles(prev => prev.filter(file => file.id !== fileIdToRemove));
  };

  const handleTagToggle = (tagName: string) => {
    setSelectedTagNames(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };
  
  const createTagMutation = useMutation({
    mutationFn: (newTagData: { name: string; category: "CLIENT" }) => createTagService(newTagData),
    onSuccess: (newTag) => {
        toast({ title: "Tag Creato", description: `Il tag "${newTag.name}" è stato creato.` });
        queryClient.invalidateQueries({ queryKey: ['clientTags'] });
        setSelectedTagNames(prev => [...prev, newTag.name]); // Auto-select the new tag
        setNewTagName(""); // Clear input
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Errore Creazione Tag", description: error.message });
    }
  });

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim(), category: "CLIENT" });
  };


  const createClientMutation = useMutation({
    mutationFn: (payload: { clientData: ClientFormValues, filesToUpload: File[], creator: UserProfile }) =>
      createClient(
        { ...payload.clientData, tags: selectedTagNames }, // Pass selectedTagNames here
        payload.creator
      ),
    onSuccess: (data) => {
      toast({ title: "Cliente Creato", description: `Il cliente "${data.companyName}" è stato creato con successo.` });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push("/clients");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Creazione Cliente", description: error.message });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: (payload: {
      clientId: string,
      clientData: ClientFormValues,
      newFilesToUpload: File[],
      filesToRemovePaths: string[],
      currentFiles: FileAttachment[],
      updaterId: string
    }) =>
      updateClient(
        payload.clientId,
        { ...payload.clientData, tags: selectedTagNames }, // Pass selectedTagNames here
        payload.newFilesToUpload,
        payload.filesToRemovePaths,
        payload.currentFiles,
        payload.updaterId
      ),
    onSuccess: (data) => {
      toast({ title: "Cliente Aggiornato", description: `Il cliente "${data.companyName}" è stato aggiornato.` });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data.id] });
      router.push("/clients");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Aggiornamento Cliente", description: error.message });
    },
  });


  async function onSubmit(data: ClientFormValues) {
    if (!authUser) {
      toast({ variant: "destructive", title: "Errore", description: "Utente non autenticato." });
      return;
    }
    
    const clientPayload = { ...data, tags: selectedTagNames };

    if (isEditing && initialData) {
      const filesToRemoveStoragePaths = filesMarkedForRemoval.map(f => f.storagePath).filter(Boolean) as string[];
      const existingFilesToKeep = currentAttachedFiles.filter(
        cf => cf.storagePath && !filesMarkedForRemoval.some(fr => fr.id === cf.id)
      );
      updateClientMutation.mutate({
        clientId: initialData.id,
        clientData: clientPayload,
        newFilesToUpload: newlySelectedFiles,
        filesToRemovePaths: filesToRemoveStoragePaths,
        currentFiles: existingFilesToKeep,
        updaterId: authUser.id,
      });
    } else {
      createClientMutation.mutate({
        clientData: clientPayload,
        // attachmentsFileObjects are handled internally by createClient service if needed, pass newlySelectedFiles
        filesToUpload: newlySelectedFiles, 
        creator: authUser,
      });
    }
  }

  const isSubmitting = createClientMutation.isPending || updateClientMutation.isPending || createTagMutation.isPending;
  
  useEffect(() => {
    form.setValue("tags", selectedTagNames);
  }, [selectedTagNames, form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Modifica Cliente" : "Crea Nuovo Cliente"}</CardTitle>
            <CardDescription>
              {isEditing ? `Modifica i dettagli per ${initialData?.companyName}.` : "Compila i campi per creare un nuovo cliente."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Azienda</FormLabel>
                  <FormControl><Input placeholder="Azienda S.p.A." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referente</FormLabel>
                  <FormControl><Input placeholder="Mario Rossi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl><Input placeholder="Via Roma, 1, 00100 Roma RM" {...field} /></FormControl>
                  <FormDescription>L'indirizzo completo verrà utilizzato per la geolocalizzazione.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phoneFixed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono Fisso</FormLabel>
                    <FormControl><Input type="tel" placeholder="06 1234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono Mobile</FormLabel>
                    <FormControl><Input type="tel" placeholder="333 1234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Eventuali note aggiuntive sul cliente..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><TagIcon className="mr-2 h-5 w-5"/> Tag Cliente</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingTags ? <p>Caricamento tags...</p> : (
                <>
                    {availableTags && availableTags.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <FormLabel>Tag Esistenti</FormLabel>
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
                            placeholder="Nuovo Tag (es. VIP, URGENTE)" 
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value.toUpperCase())}
                            className="flex-grow"
                        />
                        <Button type="button" onClick={handleCreateNewTag} disabled={!newTagName.trim() || createTagMutation.isPending}>
                            {createTagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crea Tag"}
                        </Button>
                    </div>
                    <FormDescription>
                        I tag devono essere in MAIUSCOLO. Seleziona o crea nuovi tag per categorizzare il cliente.
                    </FormDescription>
                </>
                )}
                <FormField
                    control={form.control}
                    name="tags"
                    render={() => ( // Render prop for FormField
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


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Paperclip className="mr-2 h-5 w-5" /> Allegati</CardTitle>
          </CardHeader>
          <CardContent>
            <FormItem>
              <FormLabel htmlFor="client-files">Carica Nuovi File</FormLabel>
              <FormControl>
                <Input id="client-files" type="file" multiple onChange={handleFileChange} />
              </FormControl>
              <FormDescription>
                Carica documenti o immagini relative al cliente (es. contratti, planimetrie).
              </FormDescription>
            </FormItem>
            {currentAttachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">File Correnti:</h4>
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

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : (isEditing ? "Salva Modifiche Cliente" : "Crea Cliente")}
        </Button>
      </form>
    </Form>
  );
}
