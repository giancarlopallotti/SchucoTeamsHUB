import "@/styles/globals.css";
import React from "react";
import { QueryProvider } from "@/components/query-provider";
import { UserProvider } from "@/contexts/user-provider";
import { ProtectedAppLayout } from "@/components/layout/app-layout";

export const metadata = {
  title: "SchucoAssistHUB",
  description: "Gestisci e monitora i progetti per i tuoi clienti e team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <UserProvider>
          <QueryProvider>
            <ProtectedAppLayout>{children}</ProtectedAppLayout>
          </QueryProvider>
        </UserProvider>
      </body>
    </html>
  );
}
