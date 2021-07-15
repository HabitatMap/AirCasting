export const keysToLowerCase = (object) => {
  const reducer = (acc, key) => ({ ...acc, [key.toLowerCase()]: object[key] });

  return Object.keys(object).reduce(reducer, {});
};
