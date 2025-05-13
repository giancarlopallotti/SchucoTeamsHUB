// src/components/forms/tag-form.tsx
"use client";

import type { Tag } from "@/types";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Tag as TagIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTag, updateTag } from "@/services/tags";

// Aggiorna enum per includere TEAM
const tagCategoryEnum = z.enum(["USER", "CLIENT", "PROJECT", "TEAM"]);

const tagFormSchema = z.object({
  name: z.string().min(2, { message: "Il nome del tag deve contenere almeno 2 caratteri." }).max(50)
            .regex(/^[A-Z0-9_-\s]+$/, "Il nome del tag può contenere solo lettere maiuscole, numeri, spazi, trattini e underscore."),
  category: tagCategoryEnum,
});

type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  initialData?: Tag | null;
  isEditing?: boolean;
}

export function TagForm({ initialData, isEditing = false }: TagFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "PROJECT", // Default to PROJECT
    },
  });

 useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        category: initialData.category,
      });
    } else {
        form.reset({
            name: "",
            category: "PROJECT", // Default category when creating
        })
    }
  }, [initialData, form]);

  const createTagMutation = useMutation({
    mutationFn: (tagData: TagFormValues) => createTag(tagData),
    onSuccess: (data) => {
      toast({ title: "Tag Creato", description: `Il tag "${data.name}" è stato creato con successo.` });
      // Invalidate queries for all tags and the specific category
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags', data.category] });
      router.push("/tags");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Creazione Tag", description: error.message });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: (payload: { tagId: string, tagData: TagFormValues }) =>
      updateTag(payload.tagId, payload.tagData),
    onSuccess: (data) => {
      toast({ title: "Tag Aggiornato", description: `Il tag "${data.name}" è stato aggiornato.` });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags', data.category] });
      queryClient.invalidateQueries({queryKey: ['tag', data.id]});
      router.push("/tags");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Aggiornamento Tag", description: error.message });
    },
  });


  async function onSubmit(data: TagFormValues) {
    const submissionData = {
        ...data,
        name: data.name.toUpperCase().trim(), // Ensure uppercase and trim
    };

    if (isEditing && initialData) {
      updateTagMutation.mutate({ tagId: initialData.id, tagData: submissionData });
    } else {
      createTagMutation.mutate(submissionData);
    }
  }

  const isSubmitting = createTagMutation.isPending || updateTagMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
                <TagIcon className="mr-2 h-6 w-6" />
                {isEditing ? "Modifica Tag" : "Crea Nuovo Tag"}
            </CardTitle>
            <CardDescription>
              {isEditing ? `Modifica il tag "${initialData?.name}".` : "I tag aiutano a organizzare e filtrare utenti, team, clienti e progetti."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Tag</FormLabel>
                  <FormControl>
                    <Input
                        placeholder="ESEMPIO_TAG"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Il nome del tag deve essere in MAIUSCOLO. Può contenere lettere, numeri, spazi, trattini e underscore.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Tag</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    // Disabilita cambio categoria se il tag è in uso durante la modifica
                    disabled={isEditing && !!initialData?.usageCount && initialData.usageCount > 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona una categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">Utente</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                      <SelectItem value="CLIENT">Cliente</SelectItem>
                      <SelectItem value="PROJECT">Progetto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Associa il tag a una categoria specifica. La categoria non può essere modificata se il tag è già utilizzato.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : (isEditing ? "Salva Modifiche Tag" : "Crea Tag")}
        </Button>
      </form>
    </Form>
  );
}
