interface StreamDailyAverage {
  date: string;
  value: number;
}

interface CalendarCellData {
  date: string;
  dayNumber: string;
  value: number | null;
}

interface CalendarMonthlyData {
  monthName: string;
  dayNamesHeader: string[];
  weeks: CalendarCellData[][];
}

export type { StreamDailyAverage, CalendarCellData, CalendarMonthlyData };
