import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // TODO do we need this?
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default queryClient;
