import { useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Wraps any `() => Promise<T>` API call with loading/error state, so every
    page gets real loading + empty/error handling instead of assuming data
    is always instantly present. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);
const refresh = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await fetcher();
    setData(result);
  } catch (err) {
    setError(err as Error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  refresh();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, deps);

  return { data, loading, error, refresh };
}
