// src/app/(app)/notifications/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, CheckCheck, Loader2, AlertTriangle } from "lucide-react";
import { useUser } from "@/contexts/user-provider";
import type { Notification } from "@/types";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getNotifications, 
    deleteNotification as deleteNotificationService, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from "@/services/notifications"; // Assuming these services exist
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications - adjust query key and function if user-specific
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    // Include userId in queryKey if notifications are user-specific
    queryKey: ['notifications', user?.id], 
    // Pass userId to getNotifications if needed
    queryFn: () => user ? getNotifications(user.id) : Promise.resolve([]), 
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Errore", description: `Impossibile segnare come letta: ${err.message}` }),
  });
  
  const markAllAsReadMutation = useMutation({
    mutationFn: () => user ? markAllNotificationsAsRead(user.id) : Promise.reject("User not logged in"),
    onSuccess: () => {
        toast({ title: "Notifiche Lette", description: "Tutte le notifiche sono state segnate come lette." });
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Errore", description: `Impossibile segnare tutte come lette: ${err.message}` }),
  });


  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationService,
    onSuccess: (_, notificationId) => {
      toast({ title: "Notifica Eliminata", description: "La notifica è stata eliminata." });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Errore Eliminazione", description: err.message }),
  });
  
  const unreadCount = notifications?.filter(n => !n.read).length || 0;


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento notifiche...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Errore Caricamento</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossibile caricare le notifiche: {error.message}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Notifiche</h1>
        {unreadCount > 0 && (
            <Button 
                onClick={() => markAllAsReadMutation.mutate()} 
                disabled={markAllAsReadMutation.isPending}
                variant="outline"
            >
                {markAllAsReadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Segna tutte come lette
            </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-6 w-6" />
            Le Tue Notifiche 
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount} Nuove</Badge>}
          </CardTitle>
           <CardDescription>
            Visualizza aggiornamenti importanti, menzioni o scadenze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className={`p-4 border rounded-md flex justify-between items-start gap-4 ${notification.read ? 'bg-muted/50 opacity-70' : 'bg-card'}`}>
                  <div className="flex-grow">
                    <h3 className={`font-semibold ${!notification.read ? 'text-primary' : ''}`}>{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.createdAt), "PPpp", { locale: it })}
                    </p>
                     {notification.link && (
                        <Button variant="link" size="sm" asChild className="p-0 h-auto mt-1">
                           <Link href={notification.link}>Vai all'elemento</Link>
                        </Button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {!notification.read && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending && markAsReadMutation.variables === notification.id}
                            className="text-xs"
                            >
                           {markAsReadMutation.isPending && markAsReadMutation.variables === notification.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCheck className="h-3 w-3"/>} 
                           <span className="ml-1">Letta</span>
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        disabled={deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification.id}
                        >
                        {deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 p-8 border border-dashed rounded-md flex flex-col items-center justify-center h-[300px]">
              <Bell className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Nessuna notifica trovata.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
