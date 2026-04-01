import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { Match, PaginatedResponse } from '@/types';

import { API_BASE_URL } from '@/config/api';

const API = API_BASE_URL;

interface UseMatchesOptions {
  status?: string;   // e.g. 'upcoming,live'
  format?: string;
}

interface UseMatchesResult {
  matches: Match[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMatches({ status = 'upcoming,live', format }: UseMatchesOptions = {}): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { status };
      if (format) params.format = format;

      const res = await axios.get<PaginatedResponse<Match>>(`${API}/api/matches`, { params });
      setMatches(res.data.data ?? []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message);
      } else {
        setError('Failed to load matches');
      }
    } finally {
      setLoading(false);
    }
  }, [status, format]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches };
}
