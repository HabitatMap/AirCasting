import { CalendarCellData } from "./calendar";

interface StreamDailyAverage {
  date: string;
  value: number;
}

interface CalendarMonthlyData {
  monthName: string;
  dayNamesHeader: string[];
  weeks: CalendarCellData[][];
}

export type { CalendarCellData, CalendarMonthlyData, StreamDailyAverage };
