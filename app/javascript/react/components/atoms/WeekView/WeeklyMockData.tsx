const today = new Date();

const getDayBefore = (before: number): Date => {
  const today = new Date();
  const upDate = today.setDate(today.getDate() - before);
  return new Date(upDate);
};

const weeklyData = [
  { value: 25, date: today },
  { value: 90, date: getDayBefore(1) },
  { value: 80, date: getDayBefore(2) },
  { value: 2, date: getDayBefore(3) },
  { value: 60, date: getDayBefore(4) },
  { value: 200, date: getDayBefore(5) },
  { value: 30, date: getDayBefore(6) },
];

export { weeklyData };
