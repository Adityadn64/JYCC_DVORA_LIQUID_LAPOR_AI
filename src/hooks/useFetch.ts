import { useState, useEffect } from 'react';
import apiClient, { decodeErrorResponse } from '../services/api';

export function useFetch(url: string, options: any = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.post(url, options);
        setData(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(decodeErrorResponse(err));
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}
