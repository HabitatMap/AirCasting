// Count-based (not boolean) so rapid back-to-back searches each get their
// own arm/disarm pair. Safety timeout force-resets the count in case `idle`
// never fires (e.g. panTo to current position is a no-op).

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
