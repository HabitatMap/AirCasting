const lastItemFromArray = <T>(array: T[]): T | undefined => {
  return array.length ? array[array.length - 1] : undefined;
};

export { lastItemFromArray };
