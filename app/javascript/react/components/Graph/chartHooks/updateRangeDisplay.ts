import { formatTimeExtremes } from "../../../utils/measurementsCalc";

export const updateRangeDisplay = (
  rangeDisplayRef: React.RefObject<HTMLDivElement> | undefined,
  min: number,
  max: number,
  useFullDayFormat: boolean = false
) => {
  if (!rangeDisplayRef?.current) return;

  const formattedTime = formatTimeExtremes(min, max, useFullDayFormat);
  const htmlContent = `
    <div class="time-container">
      <span class="date">${formattedTime.formattedMinTime.date}</span>
      <span class="time">${formattedTime.formattedMinTime.time}</span>
    </div>
    <span>-</span>
    <div class="time-container">
      <span class="date">${formattedTime.formattedMaxTime.date}</span>
      <span class="time">${formattedTime.formattedMaxTime.time}</span>
    </div>
  `;
  rangeDisplayRef.current.innerHTML = htmlContent;
};
