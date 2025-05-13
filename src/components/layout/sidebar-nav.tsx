// src/components/layout/sidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cookies } from "next/headers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/site";
import { useUser } from "@/contexts/user-provider";
import type { NavItem } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  // filtro in base al ruolo
  const filteredItems: NavItem[] = navItems.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  // gestisco lo stato saved nel cookie
  const cookieStore = cookies();
  const saved = cookieStore.get("sidebar_state")?.value === "open";
  const defaultOpen = saved ?? true;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* trigger per versioni mobile */}
      <SheetTrigger asChild>
        <button
          className="p-2 md:hidden"
          aria-label="Apri menu"
        >
          <svg className="w-6 h-6" /* icon burger */ />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col h-full">
          {/* logo */}
          <div className="h-16 flex items-center px-4">
            <Link href="/" className="inline-block">
              <img src="/logo-schüco.svg" alt="SchücoAssistHUB" className="h-8" />
            </Link>
          </div>

          {/* nav items */}
          <ScrollArea className="flex-1 px-2 py-4">
            {filteredItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
                    <span>{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <span>{item.title}</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </ScrollArea>

          {/* footer */}
          <div className="px-4 py-3">
            <Link
              href="/login"
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-red-500 hover:text-white"
            >
              <svg className="w-4 h-4" /* icon logout */ />
              <span>Esci</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
