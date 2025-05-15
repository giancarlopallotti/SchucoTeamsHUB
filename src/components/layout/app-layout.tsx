"use client";

import React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-primary">
        <SidebarNav />
      </aside>
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
