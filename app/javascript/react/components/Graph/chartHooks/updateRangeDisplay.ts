import { formatTimeExtremes } from "../../../utils/measurementsCalc";

export const updateRangeDisplay = (
  rangeDisplayRef: React.RefObject<HTMLDivElement> | undefined,
  min: number,
  max: number,
  useFullDayFormat: boolean = false
) => {
  if (!rangeDisplayRef?.current) return;

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

  // Create a function to update the DOM
  const updateDOM = () => {
    if (rangeDisplayRef.current) {
      // Clear existing content
      while (rangeDisplayRef.current.firstChild) {
        rangeDisplayRef.current.removeChild(rangeDisplayRef.current.firstChild);
      }

      // Create a temporary container
      const temp = document.createElement("div");
      temp.innerHTML = htmlContent;

      // Move nodes from temp to the actual container
      while (temp.firstChild) {
        rangeDisplayRef.current.appendChild(temp.firstChild);
      }
    }
  };

  // Use double RAF to ensure DOM is ready and changes are batched
  requestAnimationFrame(() => {
    requestAnimationFrame(updateDOM);
  });
};
