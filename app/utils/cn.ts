import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to merge and manage CSS class names with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge to resolve conflicting styles
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
