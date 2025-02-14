import moment from "moment";

export const parseDateString = (dateStr: string | null | undefined): number => {
  // Handle null, undefined, empty string, or "Invalid date"
  if (!dateStr || dateStr === "Invalid date") {
    return Date.now(); // Return current timestamp as fallback
  }
  console.log("dateStr", dateStr);
  try {
    // Parse the date string to UTC timestamp to match measurement timestamps
    const timestamp = moment(dateStr).utc().valueOf();

    if (isNaN(timestamp)) {
      console.warn(`Invalid date string: "${dateStr}", using current time`);
      return Date.now();
    }

    return timestamp;
  } catch (error) {
    console.warn(
      `Error parsing date string: "${dateStr}", using current time`,
      error
    );
    return Date.now();
  }
};
