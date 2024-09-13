interface DateValuePair {
  date: string;
  value: number;
}

const lastItemFromArray = (
  array: DateValuePair[]
): DateValuePair | undefined => {
  if (array.length === 0) return undefined;

  const sortedArray = [...array].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sortedArray[sortedArray.length - 1];
};

export { lastItemFromArray };
