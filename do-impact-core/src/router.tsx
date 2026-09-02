import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Report pages fire 50-75 reads each. With React Query's default
  // `staleTime: 0` every revisit refetched all of them, so navigating
  // report -> meeting -> report cost three full rounds of the same data.
  // A short freshness window makes revisits free; saves still show up
  // immediately because every mutation invalidates the keys it changed.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
