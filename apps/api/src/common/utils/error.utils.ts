import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Supabase/Postgres error codes that indicate client errors (BadRequest)
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const CLIENT_ERROR_CODES = new Set([
  "23505", // unique_violation
  "23503", // foreign_key_violation
  "23502", // not_null_violation
  "23514", // check_violation
  "22001", // string_data_right_truncation
  "22003", // numeric_value_out_of_range
  "22007", // invalid_datetime_format
  "22008", // datetime_field_overflow
  "22012", // division_by_zero
  "22P02", // invalid_text_representation
  "42703", // undefined_column (invalid field name in query)
]);

/**
 * Human-readable messages for common Postgres error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  "23505": "A record with this value already exists",
  "23503": "Cannot complete operation: related record not found or in use",
  "23502": "Required field is missing",
  "23514": "Value does not meet requirements",
  "22001": "Value is too long",
  "22003": "Number is out of valid range",
  "22P02": "Invalid value format",
};

export interface SupabaseErrorContext {
  /** The operation being performed (for logging) */
  operation: string;
  /** The resource type (for error messages) */
  resource?: string;
}

/**
 * Handles Supabase/Postgres errors and throws appropriate NestJS exceptions.
 *
 * @param error - The PostgrestError from Supabase
 * @param context - Context about the operation for better error messages
 * @throws BadRequestException for client errors (validation, constraints)
 * @throws InternalServerErrorException for server/database errors
 *
 * @example
 * ```typescript
 * const { data, error } = await client.from("items").insert(item);
 * if (error) {
 *   handleSupabaseError(error, { operation: "create item", resource: "Item" });
 * }
 * ```
 */
export function handleSupabaseError(
  error: PostgrestError,
  context: SupabaseErrorContext,
): never {
  const { operation, resource } = context;
  const errorCode = error.code;

  // Client errors - these are expected and should be 400 BadRequest
  if (errorCode && CLIENT_ERROR_CODES.has(errorCode)) {
    const message =
      ERROR_MESSAGES[errorCode] ||
      `Invalid request: ${error.message || "validation failed"}`;
    throw new BadRequestException(message);
  }

  // Not found pattern - typically from .single() when no row matches
  if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
    throw new NotFoundException(
      resource ? `${resource} not found` : "Resource not found",
    );
  }

  // All other errors are internal/unexpected - should be 500
  // Log the actual error for debugging but don't expose internals to client
  console.error(`[${operation}] Database error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  throw new InternalServerErrorException(
    `Failed to ${operation}. Please try again later.`,
  );
}

/**
 * Type guard to check if an error is a PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
