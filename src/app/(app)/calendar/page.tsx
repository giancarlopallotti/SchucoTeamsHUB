// src/app/(app)/calendar/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, ChevronLeft, ChevronRight, Edit3, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useUser } from "@/contexts/user-provider";
import type { CalendarEvent } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCalendarEvents, deleteCalendarEvent } from "@/services/calendarEvents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from "date-fns";
import { it } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";


export default function CalendarPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month'); // Future enhancement

  const firstDayCurrentMonth = startOfMonth(currentMonth);
  const lastDayCurrentMonth = endOfMonth(currentMonth);

  const { data: events, isLoading: isLoadingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['calendarEvents', user?.id, format(firstDayCurrentMonth, 'yyyy-MM'), format(lastDayCurrentMonth, 'yyyy-MM')],
    queryFn: () => user ? getCalendarEvents(user.id, firstDayCurrentMonth.toISOString(), lastDayCurrentMonth.toISOString()) : Promise.resolve([]),
    enabled: !!user,
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: (_, eventId) => {
      toast({ title: "Evento Eliminato", description: "L'evento è stato rimosso dal calendario." });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Errore Eliminazione", description: error.message });
    },
  });

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(firstDayCurrentMonth, { locale: it });
    const end = endOfWeek(lastDayCurrentMonth, { locale: it });
    return eachDayOfInterval({ start, end });
  }, [firstDayCurrentMonth, lastDayCurrentMonth]);

  const getEventsForDay = (day: Date) => {
    return events?.filter(event => {
      const eventStart = parseISO(event.start);
      // Simplistic check for multi-day events or all-day events.
      // A more robust solution would involve checking if 'day' is within event.start and event.end.
      return format(eventStart, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }) || [];
  };
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const canManageEvent = (event: CalendarEvent) => {
    if (!user) return false;
    return event.userId === user.id || user.role === "SUPERVISOR" || user.role === "AMMINISTRATORE";
  }
  
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch(type){
        case 'personal': return 'Personale';
        case 'team': return 'Team';
        case 'project': return 'Progetto';
        default: return 'Evento';
    }
  }
   const getEventTypeVariant = (type: CalendarEvent['type']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch(type){
        case 'personal': return 'secondary';
        case 'team': return 'default';
        case 'project': return 'outline';
        default: return 'outline';
    }
  }


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Calendario</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-xl font-semibold text-center w-48">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h2>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
         <Button asChild>
            <Link href="/calendar/new-event">
                <PlusCircle className="mr-2 h-4 w-4" /> Nuovo Evento
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-6 w-6" />
            Eventi di {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </CardTitle>
           <CardDescription>
                Visualizza gli eventi personali, di team o legati ai progetti.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
             <div className="flex justify-center items-center h-[500px]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
          ) : (
          <div className="grid grid-cols-7 gap-1 border-t border-l">
            {/* Header dei giorni della settimana */}
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="text-center font-medium p-2 border-b border-r text-sm bg-muted text-muted-foreground">{day}</div>
            ))}
            {/* Griglia dei giorni */}
            {daysInMonth.map((day, dayIdx) => {
              const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day.toString()} className={`min-h-[120px] border-b border-r p-2 flex flex-col ${isCurrentMonth ? 'bg-card' : 'bg-muted/50'}`}>
                  <span className={`font-semibold ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>{format(day, 'd')}</span>
                  <div className="flex-grow mt-1 space-y-1 overflow-y-auto">
                    {dayEvents.map(event => (
                      <div key={event.id} className="text-xs p-1 rounded-md bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                         <Badge variant={getEventTypeVariant(event.type)} className="mb-1 text-[10px]">{getEventTypeLabel(event.type)}</Badge>
                         <p className="font-medium truncate">{event.title}</p>
                         <p className="text-muted-foreground truncate">{event.description}</p>
                         {canManageEvent(event) && (
                            <div className="flex justify-end gap-1 mt-1">
                                <Link href={`/calendar/${event.id}/edit`}>
                                    <Button variant="ghost" size="icon" className="h-5 w-5">
                                        <Edit3 className="h-3 w-3"/>
                                    </Button>
                                </Link>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive">
                                            <Trash2 className="h-3 w-3"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Eliminare evento?</AlertDialogTitle><AlertDialogDescription>Sei sicuro di voler eliminare l'evento "{event.title}"?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteEventMutation.mutate(event.id)} disabled={deleteEventMutation.isPending}>Conferma</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
