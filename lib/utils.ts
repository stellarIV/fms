import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradeFromPaymentCode(code: string): string {
  if (!code || code.length < 4) return "Other";
  const prefix = code.substring(0, code.length - 3).toUpperCase();
  if (prefix.startsWith("K")) return `KG ${prefix.substring(1)}`;
  if (prefix.startsWith("G")) return `Grade ${prefix.substring(1)}`;
  return prefix;
}
