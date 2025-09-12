"use client"
const React = {} as any
import { tv } from "tailwind-variants"
import clsx from "clsx"

const styles = tv({
  base: "inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition-all shadow-insetlite",
  variants: {
    variant: {
      primary:"bg-accent text-white hover:opacity-95 active:scale-[.98] shadow-elevate",
      ghost:"bg-transparent text-white/90 hover:bg-white/5 border border-border",
      outline:"bg-transparent border border-accent/40 text-accent hover:bg-accent/10",
      danger:"bg-danger text-white hover:opacity-95"
    },
    size: { sm:"text-sm px-3 py-1.5", md:"text-[15px] px-4 py-2", lg:"text-base px-5 py-2.5" }
  },
  defaultVariants: { variant:"primary", size:"md" }
})

export function Button({className, variant, size, ...props}: any){
  return <button className={clsx(styles({variant,size}), className)} {...props} />
}
