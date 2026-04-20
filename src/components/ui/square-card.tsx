import * as React from "react"
import { cn } from "@/lib/utils"

export type SquareCardProps = React.HTMLAttributes<HTMLDivElement>

export const SquareCard = React.forwardRef<
  HTMLDivElement,
  SquareCardProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border border-border bg-card shadow-sm", // same as shadcn Card
        className
      )}
      {...props}
    />
  )
})

SquareCard.displayName = "SquareCard"
