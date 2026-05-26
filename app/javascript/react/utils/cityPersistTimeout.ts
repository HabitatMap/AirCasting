// Tracks whether one or more programmatic map settles are pending.
// Used to distinguish "map is animating to a searched city" (don't strip
// city= from URL on next idle) from "user dragged/zoomed the map"
// (strip city= because the URL no longer represents a search context).
//
// Count-based to handle rapid double-search: if the user clicks two
// suggestions before the first settles, both arm; each idle disarms
// one. Strip only fires when count reaches 0 AND a subsequent idle
// arrives without an active arm.
//
// Safety timeout: if `idle` never fires (e.g., panTo to current
// position is a no-op), the count is force-reset after the timeout
// so the flag doesn't stick forever.

let pendingCount = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
const CITY_SETTLE_TIMEOUT_MS = 10000;

const clearTimer = (): void => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

export const isCitySettlePending = (): boolean => pendingCount > 0;

export const armCitySettle = (): void => {
  pendingCount += 1;
  clearTimer();
  timeoutId = setTimeout(() => {
    pendingCount = 0;
    timeoutId = null;
  }, CITY_SETTLE_TIMEOUT_MS);
};

export const disarmCitySettle = (): void => {
  pendingCount = Math.max(0, pendingCount - 1);
  if (pendingCount === 0) {
    clearTimer();
  }
};

export const resetCitySettle = (): void => {
  pendingCount = 0;
  clearTimer();
};
