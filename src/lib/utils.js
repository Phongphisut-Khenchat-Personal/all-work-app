import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getInitials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export const DEFAULT_BOARD_COLUMNS = [
  { name: 'To Do', position: 0 },
  { name: 'Doing', position: 1 },
  { name: 'Done', position: 2 },
]
