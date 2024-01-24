const today = new Date();

const getDayAhead = (ahead: number): Date => {
  const today = new Date();
  const upDate = today.setDate(today.getDate() + ahead);
  return new Date(upDate);
};

const weeklyData = [
  { value: 25, date: today },
  { value: 50, date: getDayAhead(1) },
  { value: 80, date: getDayAhead(2) },
  { value: 2, date: getDayAhead(3) },
  { value: 60, date: getDayAhead(4) },
  { value: 200, date: getDayAhead(5) },
  { value: 30, date: getDayAhead(6) },
];

const colorRanges = {
  bottom: 0,
  lower: 40,
  middle: 60,
  higher: 80,
  top: 100,
};

export { weeklyData, colorRanges };
