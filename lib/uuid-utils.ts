import { v4 as uuidv4, validate as validateUuid } from 'uuid';

/**
 * Generates a new UUID v4
 * @returns A new UUID v4 string
 */
export function generateUuid(): string {
  return uuidv4();
}

/**
 * Validates if a string is a valid UUID
 * @param uuid The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUuid(uuid: string): boolean {
  return validateUuid(uuid);
}

/**
 * Formats a UUID for display (with or without dashes)
 * @param uuid The UUID to format
 * @param includeDashes Whether to include dashes in the formatted UUID
 * @returns The formatted UUID string
 */
export function formatUuid(uuid: string, includeDashes: boolean = true): string {
  if (!isValidUuid(uuid)) {
    throw new Error('Invalid UUID format');
  }
  
  if (includeDashes) {
    return uuid;
  }
  
  // Remove dashes for a more compact representation
  return uuid.replace(/-/g, '');
}

/**
 * Creates a short UUID (first 8 characters) for display purposes
 * @param uuid The full UUID
 * @returns A shortened UUID (first 8 characters)
 */
export function shortenUuid(uuid: string): string {
  if (!isValidUuid(uuid)) {
    throw new Error('Invalid UUID format');
  }
  
  return uuid.split('-')[0];
}
