// src/components/ui/tooltip.tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

/**
 * Semplice API sugar per Tooltip di Radix:
 *  - Tooltip
 *  - TooltipTrigger
 *  - TooltipContent
 */
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, side = "top", children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 rounded-md px-2 py-1 text-sm text-white bg-black/75 data-[state=open]:animate-in data-[state=closed]:animate-out",
        {
          "translate-y-1": side === "bottom",
          "-translate-y-1": side === "top",
          "translate-x-1": side === "left",
          "-translate-x-1": side === "right",
        },
        className
      )}
      side={side}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="fill-black/75" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent }
