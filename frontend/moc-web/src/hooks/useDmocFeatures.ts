import { useQuery } from '@tanstack/react-query';
import { dmocApi } from '../api/dmocApi';

const DMOC_FEATURES_QUERY_KEY = ['dmoc', 'features'] as const;

/**
 * Fetches DMOC feature flag from the API.
 * When EnableDmoc is false, DMOC nav and routes should be hidden or show "not available".
 */
export function useDmocFeatures() {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: DMOC_FEATURES_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await dmocApi.getFeatures();
        return res.data;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return { enableDmoc: false };
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    enableDmoc: data?.enableDmoc ?? false,
    isLoading,
    isError,
    error,
  };
}
