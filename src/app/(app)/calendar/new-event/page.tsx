// src/app/(app)/calendar/new-event/page.tsx
"use client";

import { CalendarEventForm } from "@/components/forms/calendar-event-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function NewCalendarEventPage() {
  const { user, isLoading: authUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authUserLoading && !user) {
      router.replace("/dashboard"); // Or login page
    }
    // Add any role-specific checks if needed, e.g.,
    // if (!authUserLoading && user && user.role === "SOME_RESTRICTED_ROLE") {
    //   router.replace("/calendar"); 
    // }
  }, [user, authUserLoading, router]);

  if (authUserLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Devi essere loggato per creare un nuovo evento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <CalendarEventForm isEditing={false} />
    </div>
  );
}
