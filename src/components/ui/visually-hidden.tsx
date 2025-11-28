"use client"

import * as React from "react"
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root ref={ref} {...props} />
))

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
VisuallyHidden.displayName = (VisuallyHiddenPrimitive.Root as { displayName?: string }).displayName ?? "VisuallyHidden"

export { VisuallyHidden }