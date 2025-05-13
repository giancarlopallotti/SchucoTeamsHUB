// src/app/(app)/tags/[tagId]/edit/page.tsx
"use client";

import { TagForm } from "@/components/forms/tag-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTagById } from "@/services/tags";

export default function EditTagPage() {
  const { user: authUser, isLoading: authUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const tagId = params.tagId as string;

  const { data: tagData, isLoading: tagLoading, error: tagError } = useQuery<Tag | null>({
    queryKey: ['tag', tagId],
    queryFn: () => getTagById(tagId),
    enabled: !!tagId && !!authUser && (authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE"),
  });
  
  React.useEffect(() => {
    if (!authUserLoading && authUser && !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
      router.replace("/tags");
    } else if (!authUserLoading && !authUser) {
        router.replace("/dashboard"); // Or login page
    }
  }, [authUser, authUserLoading, router]);


  if (authUserLoading || tagLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dati tag...</p>
      </div>
    );
  }

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
            <p>Non hai i permessi necessari per modificare questo tag.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tagError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati del tag: {tagError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/tags')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Tag
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!tagData) { 
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Tag Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per il tag con ID: {tagId}.</p>
                 <Button variant="outline" onClick={() => router.push('/tags')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna all'elenco Tag
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
      <TagForm initialData={tagData} isEditing={true} />
    </div>
  );
}
