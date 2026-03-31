/**
 * KYRIQ WEB APP — useQBClients.js
 * ──────────────────────────────────────────────────────────────
 * React hook that manages the list of connected QB companies
 * and the currently-active company + account selection.
 *
 * Usage:
 *   import { useQBClients } from './useQBClients';
 *
 *   function MyComponent() {
 *     const {
 *       companies,          // QBCompany[]  — all connected companies
 *       activeCompany,      // QBCompany | null
 *       activeAccount,      // QBAccount | null  — selected bank/credit account
 *       loading, error,
 *       switchCompany,      // (realmId: string) => void
 *       switchAccount,      // (accountId: string) => void
 *       connectNew,         // () => void  — opens QB OAuth for a new company
 *       disconnect,         // (realmId: string) => void
 *       refreshAccounts,    // (realmId?: string) => void
 *     } = useQBClients();
 *   }
 *
 * Persists active selections in localStorage so they survive a page refresh.
 */

import { useState, useEffect, useCallback } from 'react';

// ── Types (JSDoc — remove if using TypeScript) ─────────────────
/**
 * @typedef {{ id: string, name: string, type: 'Bank'|'Credit Card',
 *             subType: string, balance: number, lastFour: string|null }} QBAccount
 * @typedef {{ realmId: string, companyName: string, isExpired: boolean,
 *             accounts: QBAccount[] }} QBCompany
 */

const LS_ACTIVE_REALM   = 'kyriq_active_realm';
const LS_ACTIVE_ACCOUNT = 'kyriq_active_account';

export function useQBClients() {
  const [companies,     setCompanies]     = useState([]);
  const [activeRealmId, setActiveRealmId] = useState(
    () => localStorage.getItem(LS_ACTIVE_REALM) || null
  );
  const [activeAccountId, setActiveAccountId] = useState(
    () => localStorage.getItem(LS_ACTIVE_ACCOUNT) || null
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch all connected companies from the server ────────────
  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/qb/companies', { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setCompanies(data.companies || []);

      // If the stored active realm no longer exists, reset to the first one
      setActiveRealmId(prev => {
        const exists = data.companies.some(c => c.realmId === prev);
        const next   = exists ? prev : (data.companies[0]?.realmId || null);
        if (next !== prev) localStorage.setItem(LS_ACTIVE_REALM, next || '');
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  // ── Derived: active company object ──────────────────────────
  const activeCompany = companies.find(c => c.realmId === activeRealmId) || null;

  // ── Derived: active account object ──────────────────────────
  const activeAccount = activeCompany?.accounts.find(a => a.id === activeAccountId)
    // If stored account doesn't exist in this company, fall back to first account
    || activeCompany?.accounts[0]
    || null;

  // ── Switch active company ────────────────────────────────────
  const switchCompany = useCallback((realmId) => {
    setActiveRealmId(realmId);
    localStorage.setItem(LS_ACTIVE_REALM, realmId);

    // Reset account selection — let it fall back to the company's first account
    setActiveAccountId(null);
    localStorage.removeItem(LS_ACTIVE_ACCOUNT);
  }, []);

  // ── Switch active account ────────────────────────────────────
  const switchAccount = useCallback((accountId) => {
    setActiveAccountId(accountId);
    localStorage.setItem(LS_ACTIVE_ACCOUNT, accountId);
  }, []);

  // ── Open QB OAuth to add a new company ──────────────────────
  // Navigates to /api/qb/connect; QB redirects back to /api/qb/callback
  // which saves the company and redirects to /dashboard?qb_connected=<realmId>
  const connectNew = useCallback(() => {
    window.location.href = '/api/qb/connect';
  }, []);

  // ── Disconnect a company ─────────────────────────────────────
  const disconnect = useCallback(async (realmId) => {
    try {
      const res = await fetch(`/api/qb/companies/${realmId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to disconnect: ${res.status}`);

      setCompanies(prev => prev.filter(c => c.realmId !== realmId));

      // If we just removed the active company, switch to another
      if (activeRealmId === realmId) {
        const remaining = companies.filter(c => c.realmId !== realmId);
        const next = remaining[0]?.realmId || null;
        setActiveRealmId(next);
        localStorage.setItem(LS_ACTIVE_REALM, next || '');
      }
    } catch (err) {
      setError(err.message);
    }
  }, [activeRealmId, companies]);

  // ── Refresh account balances for a company ───────────────────
  const refreshAccounts = useCallback(async (realmId) => {
    const target = realmId || activeRealmId;
    if (!target) return;
    try {
      const res  = await fetch(`/api/qb/companies/${target}/refresh-accounts`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
      const { accounts } = await res.json();

      setCompanies(prev => prev.map(c =>
        c.realmId === target ? { ...c, accounts } : c
      ));
    } catch (err) {
      setError(err.message);
    }
  }, [activeRealmId]);

  // ── Listen for ?qb_connected=<realmId> in URL after OAuth ───
  // Reload company list when redirected back from QB OAuth callback
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const newRealm = params.get('qb_connected');
    if (newRealm) {
      // Clean up the URL param
      const clean = new URL(window.location.href);
      clean.searchParams.delete('qb_connected');
      window.history.replaceState({}, '', clean.toString());

      // Reload and switch to the newly added company
      loadCompanies().then(() => {
        switchCompany(newRealm);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    companies,
    activeCompany,
    activeAccount,
    activeRealmId,
    activeAccountId,
    loading,
    error,
    switchCompany,
    switchAccount,
    connectNew,
    disconnect,
    refreshAccounts,
    reload: loadCompanies,
  };
}
