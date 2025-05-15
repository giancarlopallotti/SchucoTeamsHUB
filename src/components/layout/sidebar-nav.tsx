"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navItems } from "@/config/site";
import { useUser } from "@/contexts/user-provider";
import type { NavItem } from "@/types";

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const filteredItems: NavItem[] = navItems.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  return (
    <ScrollArea className="h-full py-4">
      <div className="flex flex-col px-4 text-sm">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center rounded-md px-3 py-2 font-medium hover:bg-accent hover:text-accent-foreground ${
              pathname === item.href ? "bg-accent" : "text-muted-foreground"
            }`}
          >
            {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
            {item.title}
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}
