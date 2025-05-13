// src/app/(app)/users/new/page.tsx
"use client";

import { UserForm } from "@/components/forms/user-form";
import { useUser as useAuthUser } from "@/contexts/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function NewUserPage() {
  const { user: authUser, isLoading: authUserLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!authUserLoading && authUser && !(authUser.role === "SUPERVISOR" || authUser.role === "AMMINISTRATORE")) {
      router.replace("/dashboard"); 
    }
  }, [authUser, authUserLoading, router]);

  if (authUserLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Caricamento...</p>
      </div>
    );
  }

  if (!authUser || (authUser.role !== "SUPERVISOR" && authUser.role !== "AMMINISTRATORE")) {
    return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per creare un nuovo utente. Contatta un amministratore o supervisore.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <UserForm isEditing={false} />
    </div>
  );
}
