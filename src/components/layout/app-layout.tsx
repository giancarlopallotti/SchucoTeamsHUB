"use client";

import React from "react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";
import { navItems } from "@/config/site";
import { useUser } from "@/contexts/user-provider";

export function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" collapsible="icon" className="h-screen flex">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Icons.Logo className="h-8 w-8 text-white" />
            <span className="text-xl text-white">SchucoAssistHUB</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 bg-blue-900 text-white">
          <SidebarNav items={navItems} />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-blue-800">
          <button onClick={logout} className="w-full text-left text-white">
            Esci
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
