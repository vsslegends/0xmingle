import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "btn-sheen bg-gradient-to-r from-violet-500 to-cyan-400 text-black font-semibold hover:brightness-110 hover:shadow-xl hover:shadow-violet-900/40 shadow-lg shadow-violet-900/30",
        secondary:
          "border border-white/15 bg-white/5 text-white hover:bg-white/10",
        ghost: "text-slate-300 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
      },
      size: {
        sm: "h-8 px-4 text-sm",
        md: "h-11 px-6 text-[15px]",
        lg: "h-13 px-8 py-3.5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
