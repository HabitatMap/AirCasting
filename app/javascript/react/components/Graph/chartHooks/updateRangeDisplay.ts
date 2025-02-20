import { formatTimeExtremes } from "../../../utils/measurementsCalc";

export const updateRangeDisplay = (
  rangeDisplayRef: React.RefObject<HTMLDivElement> | undefined,
  min: number,
  max: number,
  useFullDayFormat: boolean = false
) => {
  if (!rangeDisplayRef?.current) return;

  // Clear any existing content first
  rangeDisplayRef.current.innerHTML = "";

  // Format times using measurement timestamps
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

  // Use requestAnimationFrame to prevent multiple DOM updates and ensure clean render
  requestAnimationFrame(() => {
    if (rangeDisplayRef.current) {
      // Double check if any content exists and clear it
      if (rangeDisplayRef.current.children.length > 0) {
        rangeDisplayRef.current.innerHTML = "";
      }
      rangeDisplayRef.current.innerHTML = htmlContent;
    }
  });
};
