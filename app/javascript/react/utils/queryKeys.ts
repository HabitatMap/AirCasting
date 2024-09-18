import { FixedSessionsTypes } from "../store/sessionFiltersSlice";

export const queryKeys = {
  fixedSessions: {
    all: ["fixedSessions"] as const,
    lists: () => [...queryKeys.fixedSessions.all, "list"] as const,
    list: (type: FixedSessionsTypes, filters: string) =>
      [...queryKeys.fixedSessions.lists(), { type, filters }] as const,
  },
  // Add other query keys here
};
