// src/app/(app)/projects/new/page.tsx
"use client";

import { ProjectForm } from "@/components/forms/project-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function NewProjectPage() {
  const { user, isLoading: authUserLoading } = useUser();
  const router = useRouter();

  // Add role-based access control if needed
  useEffect(() => {
    if (!authUserLoading && !user) {
      router.replace("/dashboard"); // Or a login page
    }
    // Example: Only SUPERVISOR or AMMINISTRATORE can create projects
    // if (!authUserLoading && user && !(user.role === "SUPERVISOR" || user.role === "AMMINISTRATORE")) {
    //   router.replace("/projects"); // Or dashboard, or a "permission denied" page
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

  if (!user) { // Fallback
    return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Devi essere loggato per creare un nuovo progetto.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Add specific role check here if implemented above
  // if (!(user.role === "SUPERVISOR" || user.role === "AMMINISTRATORE")) { /* ... render access denied ... */ }


  return (
    <div className="container mx-auto py-8">
      <ProjectForm isEditing={false} />
    </div>
  );
}
