export const parseDateString = (dateStr: string): number => {
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    console.error(`Invalid date string: ${dateStr}`);
    return 0;
  }
  return parsedDate.getTime();
};
