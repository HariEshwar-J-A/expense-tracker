import { format } from "date-fns";

/**
 * Returns today's date in YYYY-MM-DD format based on the user's Local Timezone.
 * avoids the UTC shift issue of toISOString().
 */
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) to 'MMM dd, yyyy'
 * treating the input strictly as a calendar date to prevent timezone shifting.
 *
 * Uses the "Epoch vs Timezone Offset" technique to compensate for browser local conversion.
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";

  // If it's a simple YYYY-MM-DD string, append T00:00:00 to treat it as local start of day
  // This allows us to use standard Date methods without them being interpreted as UTC Midnight (which shifts back a day in Western fields)
  const cleanDateStr = dateString.includes("T")
    ? dateString
    : `${dateString}T00:00:00`;

  const date = new Date(cleanDateStr);

  // Fallback if invalid
  if (isNaN(date.getTime())) return dateString;

  return format(date, "MMM dd, yyyy");
};
