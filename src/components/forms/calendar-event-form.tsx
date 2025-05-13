// src/components/forms/calendar-event-form.tsx
"use client";

import type { CalendarEvent, Project, Team } from "@/types";
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
import { CalendarIcon, Loader2, CalendarDays, Briefcase, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import { createCalendarEvent, updateCalendarEvent } from "@/services/calendarEvents";
import { getProjects } from "@/services/projects"; // To link events to projects
import { getTeams } from "@/services/teams"; // To link events to teams
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid as isValidDate, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const eventTypeEnum = z.enum(["personal", "team", "project"]);

const calendarEventFormSchema = z.object({
  title: z.string().min(3, { message: "Il titolo deve contenere almeno 3 caratteri." }).max(100),
  start: z.date({ required_error: "La data di inizio è richiesta." }),
  end: z.date({ required_error: "La data di fine è richiesta." }),
  allDay: z.boolean().optional(),
  description: z.string().max(1000, { message: "La descrizione non può superare i 1000 caratteri." }).optional(),
  type: eventTypeEnum,
  projectId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
}).refine(data => data.end >= data.start, {
  message: "La data di fine non può essere precedente alla data di inizio.",
  path: ["end"],
});

type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;

interface CalendarEventFormProps {
  initialData?: CalendarEvent | null;
  isEditing?: boolean;
}

export function CalendarEventForm({ initialData, isEditing = false }: CalendarEventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: availableProjects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['allProjectsForCalendar'],
    queryFn: getProjects,
  });

  const { data: availableTeams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['allTeamsForCalendar'],
    queryFn: getTeams,
  });

  const form = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      start: initialData?.start && isValidDate(new Date(initialData.start)) ? new Date(initialData.start) : new Date(),
      end: initialData?.end && isValidDate(new Date(initialData.end)) ? new Date(initialData.end) : new Date(),
      allDay: initialData?.allDay || false,
      description: initialData?.description || "",
      type: initialData?.type || "personal",
      projectId: initialData?.projectId || null,
      teamId: initialData?.teamId || null,
    },
  });
  
  const eventType = form.watch("type");

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        start: isValidDate(parseISO(initialData.start)) ? parseISO(initialData.start) : new Date(),
        end: isValidDate(parseISO(initialData.end)) ? parseISO(initialData.end) : new Date(),
        allDay: initialData.allDay || false,
        description: initialData.description || "",
        type: initialData.type,
        projectId: initialData.projectId || null,
        teamId: initialData.teamId || null,
      });
    } else {
        form.reset({
            title: "",
            start: new Date(),
            end: new Date(),
            allDay: false,
            description: "",
            type: "personal",
            projectId: null,
            teamId: null,
        })
    }
  }, [initialData, form]);
  
   useEffect(() => {
    if (eventType === "personal") {
      form.setValue("projectId", null);
      form.setValue("teamId", null);
    } else if (eventType === "project") {
      form.setValue("teamId", null);
    } else if (eventType === "team") {
      form.setValue("projectId", null);
    }
  }, [eventType, form]);


  const createEventMutation = useMutation({
    mutationFn: (eventData: Omit<CalendarEvent, "id">) => createCalendarEvent(eventData),
    onSuccess: (data) => {
      toast({ title: "Evento Creato", description: `L'evento "${data.title}" è stato creato.` });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }); // Adjust query key as needed
      router.push("/calendar");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Errore Creazione Evento", description: error.message }),
  });

  const updateEventMutation = useMutation({
    mutationFn: (payload: { eventId: string, eventData: Partial<Omit<CalendarEvent, "id" | "userId">> }) =>
      updateCalendarEvent(payload.eventId, payload.eventData),
    onSuccess: (data) => {
      toast({ title: "Evento Aggiornato", description: `L'evento "${data.title}" è stato aggiornato.` });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvent', data.id] });
      router.push("/calendar");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Errore Aggiornamento Evento", description: error.message }),
  });

  async function onSubmit(data: CalendarEventFormValues) {
    if (!authUser) {
      toast({ variant: "destructive", title: "Errore", description: "Utente non autenticato." });
      return;
    }
    
    const eventPayload = {
        ...data,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        userId: authUser.id,
        projectId: data.type === "project" ? data.projectId : null,
        teamId: data.type === "team" ? data.teamId : null,
    };

    if (isEditing && initialData) {
      // Ensure userId is not part of the update payload if it's not meant to be changed
      const { userId, ...updateData } = eventPayload;
      updateEventMutation.mutate({ eventId: initialData.id, eventData: updateData });
    } else {
      createEventMutation.mutate(eventPayload);
    }
  }

  const isSubmitting = createEventMutation.isPending || updateEventMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
                <CalendarDays className="mr-2 h-6 w-6"/>
                {isEditing ? "Modifica Evento" : "Crea Nuovo Evento"}
            </CardTitle>
            <CardDescription>
              {isEditing ? `Modifica i dettagli per l'evento "${initialData?.title}".` : "Compila i campi per aggiungere un evento al calendario."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Titolo Evento</FormLabel><FormControl><Input placeholder="Riunione Progetto X" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="start" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data e Ora Inizio</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPPp", {locale: it}) : <span>Scegli data e ora</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                    {/* TODO: Add time selection to Calendar or use a DateTimePicker component */}
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/>
                </PopoverContent></Popover><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="end" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data e Ora Fine</FormLabel><Popover><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPPp", {locale: it}) : <span>Scegli data e ora</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                     {/* TODO: Add time selection to Calendar or use a DateTimePicker component */}
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/>
                </PopoverContent></Popover><FormMessage /></FormItem>
                )}/>
            </div>

            <FormField control={form.control} name="allDay" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none"><FormLabel>Tutto il Giorno</FormLabel>
                <FormDescription>Seleziona se questo evento dura tutto il giorno.</FormDescription></div>
              </FormItem>
            )}/>

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Tipo Evento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleziona tipo" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="personal">Personale</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="project">Progetto</SelectItem>
                </SelectContent></Select><FormMessage /></FormItem>
            )}/>

            {eventType === 'project' && (
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem><FormLabel>Progetto Associato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""} disabled={isLoadingProjects}>
                    <FormControl><SelectTrigger>
                        <SelectValue placeholder={isLoadingProjects ? "Caricamento progetti..." : "Seleziona progetto"} />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                        {!isLoadingProjects && availableProjects?.map(proj => <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>)}
                    </SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            )}

            {eventType === 'team' && (
              <FormField control={form.control} name="teamId" render={({ field }) => (
                <FormItem><FormLabel>Team Associato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""} disabled={isLoadingTeams}>
                    <FormControl><SelectTrigger>
                        <SelectValue placeholder={isLoadingTeams ? "Caricamento team..." : "Seleziona team"} />
                    </SelectTrigger></FormControl>
                    <SelectContent>
                        {!isLoadingTeams && availableTeams?.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                    </SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            )}
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrizione (Opzionale)</FormLabel><FormControl>
                <Textarea placeholder="Dettagli aggiuntivi sull'evento..." {...field} />
              </FormControl><FormMessage /></FormItem>
            )}/>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio...</> : (isEditing ? "Salva Modifiche Evento" : "Crea Evento")}
        </Button>
      </form>
    </Form>
  );
}
