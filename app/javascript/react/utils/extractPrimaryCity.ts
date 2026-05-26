// Extracts the primary part of a geocoder label.
// "Berlin, Germany"   -> "Berlin"
// "Berlin"            -> "Berlin"
// "  Berlin  "        -> "Berlin"
// ""                  -> ""
// null/undefined      -> ""

export const extractPrimaryCity = (
  label: string | null | undefined
): string => {
  if (!label) return "";
  return label.split(",")[0].trim();
};
