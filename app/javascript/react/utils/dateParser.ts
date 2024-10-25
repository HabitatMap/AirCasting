export const parseDateString = (dateStr: string): number => {
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    console.error(`Invalid date string: ${dateStr}`);
    return 0;
  }

  // Convert to local time
  const localDate = new Date(
    parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000
  );
  return localDate.getTime();
};
