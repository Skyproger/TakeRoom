import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

export interface UseFetchOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: UseFetchOptions = {},
): UseFetchState<T> {
  const { enabled = true, keepPreviousData = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      if (!keepPreviousData) setData(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    if (!keepPreviousData) setData(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keepPreviousData, nonce, ...deps]);

  const refetch = useCallback(() => setNonce((v) => v + 1), []);

  return { data, error, loading, refetch };
}
