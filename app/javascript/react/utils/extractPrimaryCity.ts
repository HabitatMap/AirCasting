export const extractPrimaryCity = (
  label: string | null | undefined
): string => {
  if (!label) return "";
  return label.split(",")[0].trim();
};
