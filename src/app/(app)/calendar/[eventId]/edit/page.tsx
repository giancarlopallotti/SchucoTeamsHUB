// src/app/(app)/calendar/[eventId]/edit/page.tsx
"use client";

import { CalendarEventForm } from "@/components/forms/calendar-event-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import type { CalendarEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCalendarEventById } from "@/services/calendarEvents";

export default function EditCalendarEventPage() {
  const { user: authUser, isLoading: authUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const { data: eventData, isLoading: eventLoading, error: eventError } = useQuery<CalendarEvent | null>({
    queryKey: ['calendarEvent', eventId],
    queryFn: () => getCalendarEventById(eventId),
    enabled: !!eventId && !!authUser, 
  });
  
  React.useEffect(() => {
    if (!authUserLoading && !authUser) {
        router.replace("/dashboard"); // Or login
    }
    // Add role-specific checks if the event owner is not the current user
    // e.g. if (eventData && authUser && eventData.userId !== authUser.id && !(authUser.role === 'SUPERVISOR' || authUser.role === 'AMMINISTRATORE')) router.replace("/calendar");
  }, [authUser, authUserLoading, router, eventData]);


  if (authUserLoading || eventLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento dati evento...</p>
      </div>
    );
  }
  
  // Check if the current authUser is the owner of the event or an admin/supervisor
  const canEdit = authUser && eventData && (eventData.userId === authUser.id || authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE");

  if (!authUser || !canEdit) {
     return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per modificare questo evento.</p>
             <Button variant="outline" onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossibile caricare i dati dell'evento: {eventError.message}.</p>
            <Button variant="outline" onClick={() => router.push('/calendar')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna al Calendario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!eventData) { 
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Evento Non Trovato</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile trovare i dati per l'evento con ID: {eventId}.</p>
                 <Button variant="outline" onClick={() => router.push('/calendar')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna al Calendario
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
      <CalendarEventForm initialData={eventData} isEditing={true} />
    </div>
  );
}
