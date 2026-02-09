import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * This ensures that conflicting classes (e.g., 'p-4 p-2') are resolved correctly.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
