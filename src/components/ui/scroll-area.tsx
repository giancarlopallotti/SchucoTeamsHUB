// src/components/ui/scroll-area.tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

/**
 * Wrapper attorno al Radix ScrollArea che mette insieme
 * Viewport + Scrollbar verticali e orizzontali + Corner
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="w-full h-full">
      {children}
    </ScrollAreaPrimitive.Viewport>

    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      className="flex touch-none select-none p-2"
    >
      <ScrollAreaPrimitive.Thumb className="flex-1 bg-gray-300 rounded-full before:absolute before:inset-0 before:m-auto before:min-h-[44px] before:min-w-[44px]" />
    </ScrollAreaPrimitive.Scrollbar>

    <ScrollAreaPrimitive.Scrollbar
      orientation="horizontal"
      className="flex touch-none select-none p-2"
    >
      <ScrollAreaPrimitive.Thumb className="flex-1 bg-gray-300 rounded-full before:absolute before:inset-0 before:m-auto before:min-h-[44px] before:min-w-[44px]" />
    </ScrollAreaPrimitive.Scrollbar>

    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

export { ScrollArea }
