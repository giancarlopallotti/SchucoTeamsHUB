// src/app/(app)/clients/new/page.tsx
"use client";

import { ClientForm } from "@/components/forms/client-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function NewClientPage() {
  const { user, isLoading: authUserLoading } = useUser();
  const router = useRouter();

  // In a real app, you might have more specific role checks, e.g., only certain roles can create clients.
  // For now, any authenticated user can access the form page, but the service layer would handle permissions.

  useEffect(() => {
    if (!authUserLoading && !user) {
      // If user is not loaded and not logged in, redirect (e.g., to login or dashboard)
      router.replace("/dashboard"); // Or a login page
    }
  }, [user, authUserLoading, router]);

  if (authUserLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento...</p>
      </div>
    );
  }

  if (!user) { // Fallback if user somehow still null after loading
    return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Devi essere loggato per creare un nuovo cliente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ClientForm isEditing={false} />
    </div>
  );
}
