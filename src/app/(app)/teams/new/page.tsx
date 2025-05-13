"use client";

import { TeamForm } from "@/components/forms/team-form";
import { useUser } from "@/contexts/user-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function NewTeamPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !(user.role === "SUPERVISOR" || user.role === "AMMINISTRATORE")) {
      router.replace("/dashboard"); // Redirect if not authorized
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <p>Caricamento...</p>;
  }

  if (!user || (user.role !== "SUPERVISOR" && user.role !== "AMMINISTRATORE")) {
    return (
       <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Non hai i permessi necessari per creare un nuovo team. Contatta un amministratore.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <TeamForm isEditing={false} />
    </div>
  );
}
