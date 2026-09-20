import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
