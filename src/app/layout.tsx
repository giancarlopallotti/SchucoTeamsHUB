import "@/styles/globals.css";
import React from "react";
import { QueryProvider } from "@/components/query-provider";
import { UserProvider } from "@/contexts/user-provider";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata = {
  title: "Schuco Teams HUB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <UserProvider>
          <QueryProvider>
            <AppLayout>{children}</AppLayout>
          </QueryProvider>
        </UserProvider>
      </body>
    </html>
  );
}
