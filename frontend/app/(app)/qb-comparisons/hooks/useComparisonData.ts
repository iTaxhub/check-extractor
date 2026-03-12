import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckExtraction, QuickBooksEntry } from '../utils/comparisonUtils';
import { createClient } from '@/lib/supabase/client';
import { useJobsStore } from '@/lib/store/useJobsStore';

export function useComparisonData() {
  const { jobs, loading: jobsLoading, fetchJobs } = useJobsStore();
  const [loading, setLoading] = useState(true);
  const [qbEntries, setQbEntries] = useState<QuickBooksEntry[]>([]);
  const [qbSources, setQbSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Skip if already fetched and not forced
    if (hasFetched.current && !force) {
      console.log('📦 Using cached comparison data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch jobs from global store (uses its own 30s cache)
      await fetchJobs(force);
      
      // Get auth token for QB entries
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
      };
      
      try {
        const qbRes = await fetch('/api/quickbooks/entries', { headers });
        
        if (qbRes.ok) {
          const qbData = await qbRes.json();
          console.log('📊 QB Data received:', qbData);
          console.log('📋 QB Entries count:', qbData.entries?.length || 0);
          
          const entries: QuickBooksEntry[] = (qbData.entries || []).map((entry: any, idx: number) => ({
            id: entry.id || `qb-${idx}`,
            checkNumber: entry.check_number || '',
            date: entry.date || '',
            amount: entry.amount || '',
            payee: entry.payee || '',
            account: entry.account || 'Checking',
            memo: entry.memo || '',
            source: 'quickbooks' as const,
            qbSource: entry.qb_source || 'default',
          }));
          
          console.log('✅ Processed QB entries:', entries.length);
          if (entries.length > 0) {
            console.log('📝 Sample entry:', entries[0]);
          }
          
          setQbEntries(entries);
          
          const sources = Array.from(new Set(entries.map(e => e.qbSource || 'default')));
          setQbSources(sources);
        } else {
          console.warn('⚠️ QB API returned non-OK status:', qbRes.status);
        }
      } catch (qbError) {
        console.error('❌ Error fetching QuickBooks data:', qbError);
        setQbEntries([]);
        setQbSources([]);
      }
      hasFetched.current = true;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);
  
  useEffect(() => {
    fetchData();
  }, []);

  // Compute extractions from jobs - include ALL jobs with checks, regardless of status
  const extractions: CheckExtraction[] = jobs.flatMap((job: any) => {
    if (job.checks?.length > 0) {
      return job.checks.map((check: any) => ({
        ...check,
        job_id: job.job_id,
        pdf_name: job.pdf_name,
      }));
    }
    return [];
  });

  return {
    loading: loading || jobsLoading,
    extractions,
    qbEntries,
    qbSources,
    error,
    refreshData: () => fetchData(true),
  };
}
