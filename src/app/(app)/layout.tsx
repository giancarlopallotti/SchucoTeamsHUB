// src/app/(app)/layout.tsx
"use client";

import React from "react";
import { ProtectedAppLayout } from "@/components/layout/app-layout";

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Qui non mettiamo provider (sono già a root), ma solo la shell UI
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
