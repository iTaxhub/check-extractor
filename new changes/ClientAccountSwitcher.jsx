/**
 * KYRIQ WEB APP — ClientAccountSwitcher.jsx
 * ──────────────────────────────────────────────────────────────
 * Drop-in top-nav switcher component.
 * Shows: [Active Company ▾]  [Active Account ▾]  [+ Add Client]
 *
 * Switching a company or account never requires signing out.
 * Tokens are managed silently by the server (qb-routes.js).
 *
 * Usage:
 *   import ClientAccountSwitcher from './ClientAccountSwitcher';
 *
 *   // In your layout/navbar:
 *   <ClientAccountSwitcher
 *     onCompanyChange={(company) => console.log('switched to', company.companyName)}
 *     onAccountChange={(account) => console.log('switched to', account.name)}
 *   />
 *
 * Dependencies:
 *   - useQBClients (./useQBClients)
 *   - Tailwind CSS (core utility classes only)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQBClients } from './useQBClients';

// ── Design tokens (match Kyriq brand) ─────────────────────────
const PURPLE = '#6366f1';
const GREEN  = '#10b981';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';


// ══════════════════════════════════════════════════════════════
//  Main component
// ══════════════════════════════════════════════════════════════
export default function ClientAccountSwitcher({ onCompanyChange, onAccountChange }) {
  const {
    companies, activeCompany, activeAccount,
    loading, error,
    switchCompany, switchAccount, connectNew, disconnect, refreshAccounts,
  } = useQBClients();

  const [companyOpen,  setCompanyOpen]  = useState(false);
  const [accountOpen,  setAccountOpen]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(null); // realmId | null

  const companyRef = useRef(null);
  const accountRef = useRef(null);

  // ── Close dropdowns on outside click ────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (companyRef.current && !companyRef.current.contains(e.target)) setCompanyOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Handlers ────────────────────────────────────────────────
  const handleSelectCompany = useCallback((realmId) => {
    switchCompany(realmId);
    setCompanyOpen(false);
    setSearchQuery('');
    const company = companies.find(c => c.realmId === realmId);
    if (company) onCompanyChange?.(company);
  }, [switchCompany, companies, onCompanyChange]);

  const handleSelectAccount = useCallback((accountId) => {
    switchAccount(accountId);
    setAccountOpen(false);
    const account = activeCompany?.accounts.find(a => a.id === accountId);
    if (account) onAccountChange?.(account);
  }, [switchAccount, activeCompany, onAccountChange]);

  const handleDisconnect = useCallback(async (realmId) => {
    setConfirmDisconnect(null);
    await disconnect(realmId);
  }, [disconnect]);

  // ── Filtered company list ────────────────────────────────────
  const filteredCompanies = companies.filter(c =>
    !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Account groups for the active company ───────────────────
  const bankAccounts   = activeCompany?.accounts.filter(a => a.type === 'Bank')        || [];
  const creditAccounts = activeCompany?.accounts.filter(a => a.type === 'Credit Card') || [];

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="h-8 w-40 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-8 w-44 bg-gray-100 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">

      {/* ── Company Switcher ─────────────────────────────── */}
      <div className="relative" ref={companyRef}>
        <button
          onClick={() => { setCompanyOpen(o => !o); setAccountOpen(false); }}
          className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200
                     bg-white hover:bg-gray-50 text-sm font-medium text-gray-800
                     shadow-sm transition-colors focus:outline-none focus:ring-2
                     focus:ring-indigo-400"
        >
          {/* Avatar */}
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white
                       text-xs font-bold flex-shrink-0"
            style={{ background: activeCompany ? PURPLE : '#d1d5db' }}
          >
            {activeCompany ? getInitials(activeCompany.companyName) : '?'}
          </span>

          {/* Company name */}
          <span className="max-w-[140px] truncate">
            {activeCompany?.companyName || 'No company connected'}
          </span>

          {/* Expired warning */}
          {activeCompany?.isExpired && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#fef2f2', color: RED }}>
              ⚠ Expired
            </span>
          )}

          {/* QB status dot */}
          <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: activeCompany && !activeCompany.isExpired ? GREEN : '#d1d5db' }} />

          <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${companyOpen ? 'rotate-180' : ''}`}
               viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Company dropdown */}
        {companyOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl
                          border border-gray-100 z-50 overflow-hidden">

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                placeholder="Search clients…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Company list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredCompanies.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">No clients found</p>
              )}
              {filteredCompanies.map(company => (
                <div key={company.realmId}
                     className="group flex items-center gap-3 px-4 py-2.5 cursor-pointer
                                hover:bg-indigo-50 transition-colors"
                     onClick={() => handleSelectCompany(company.realmId)}>

                  {/* Avatar */}
                  <span className="w-8 h-8 rounded-full flex items-center justify-center
                                   text-white text-xs font-bold flex-shrink-0"
                        style={{ background: stringToColor(company.companyName) }}>
                    {getInitials(company.companyName)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {company.companyName}
                      </span>
                      {company.realmId === activeCompany?.realmId && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0"
                             style={{ color: PURPLE }} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: company.isExpired ? RED : GREEN }} />
                      <span className="text-xs text-gray-400">
                        {company.isExpired ? 'Needs reconnect' : 'Connected'}
                        {' · '}{company.accounts.length} account{company.accounts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Disconnect button (appears on hover) */}
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50
                               transition-all text-gray-300 hover:text-red-400"
                    title="Disconnect"
                    onClick={e => { e.stopPropagation(); setConfirmDisconnect(company.realmId); setCompanyOpen(false); }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer: Add new client */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => { setCompanyOpen(false); connectNew(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                           font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: PURPLE }}>+</span>
                Add New Client
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Account Switcher ─────────────────────────────── */}
      {activeCompany && (
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => { setAccountOpen(o => !o); setCompanyOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200
                       bg-white hover:bg-gray-50 text-sm font-medium text-gray-800
                       shadow-sm transition-colors focus:outline-none focus:ring-2
                       focus:ring-indigo-400"
          >
            {/* Account type icon */}
            <span className="text-base leading-none">
              {activeAccount?.type === 'Credit Card' ? '💳' : '🏦'}
            </span>

            {/* Account name */}
            <span className="max-w-[160px] truncate">
              {activeAccount
                ? formatAccountName(activeAccount)
                : 'Select account'}
            </span>

            {/* Balance */}
            {activeAccount && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full hidden sm:block"
                    style={{ background: '#f0fdf4', color: '#065f46' }}>
                {formatBalance(activeAccount.balance)}
              </span>
            )}

            <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
                 viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
            </svg>
          </button>

          {/* Account dropdown */}
          {accountOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl
                            border border-gray-100 z-50 overflow-hidden">

              {/* Bank Accounts section */}
              {bankAccounts.length > 0 && (
                <AccountGroup
                  label="Bank Accounts"
                  accounts={bankAccounts}
                  activeId={activeAccount?.id}
                  onSelect={id => { handleSelectAccount(id); setAccountOpen(false); }}
                  icon="🏦"
                />
              )}

              {/* Credit Cards section */}
              {creditAccounts.length > 0 && (
                <AccountGroup
                  label="Credit Cards"
                  accounts={creditAccounts}
                  activeId={activeAccount?.id}
                  onSelect={id => { handleSelectAccount(id); setAccountOpen(false); }}
                  icon="💳"
                />
              )}

              {/* No accounts */}
              {bankAccounts.length === 0 && creditAccounts.length === 0 && (
                <p className="px-4 py-4 text-sm text-gray-400 text-center">
                  No accounts found
                </p>
              )}

              {/* Refresh */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => { refreshAccounts(); setAccountOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                             text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                  </svg>
                  Refresh account balances
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Expired token warning ─────────────────────────── */}
      {activeCompany?.isExpired && (
        <button
          onClick={connectNew}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold
                     border transition-colors"
          style={{ background: '#fef2f2', color: RED, borderColor: '#fecaca' }}
        >
          ⚠ Reconnect QB
        </button>
      )}

      {/* ── Error toast ───────────────────────────────────── */}
      {error && (
        <span className="text-xs text-red-500 max-w-[160px] truncate" title={error}>
          {error}
        </span>
      )}

      {/* ── Disconnect confirmation modal ─────────────────── */}
      {confirmDisconnect && (
        <DisconnectModal
          companyName={companies.find(c => c.realmId === confirmDisconnect)?.companyName}
          onConfirm={() => handleDisconnect(confirmDisconnect)}
          onCancel={() => setConfirmDisconnect(null)}
        />
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  Sub-components
// ══════════════════════════════════════════════════════════════

function AccountGroup({ label, accounts, activeId, onSelect, icon }) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </div>
      {accounts.map(acct => (
        <button
          key={acct.id}
          onClick={() => onSelect(acct.id)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50
                     transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-800 truncate">
                {formatAccountName(acct)}
              </span>
              {acct.id === activeId && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: PURPLE }}
                     viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            {acct.subType && (
              <span className="text-xs text-gray-400">{acct.subType}</span>
            )}
          </div>
          <span className="text-sm font-semibold flex-shrink-0"
                style={{ color: acct.balance >= 0 ? '#065f46' : RED }}>
            {formatBalance(acct.balance)}
          </span>
        </button>
      ))}
    </div>
  );
}

function DisconnectModal({ companyName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Disconnect client?</h3>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{companyName}</strong> will be removed from Kyriq.
          You can reconnect at any time — your QB data is not affected.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium
                       text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white
                       transition-colors"
            style={{ background: RED }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  Utility helpers
// ══════════════════════════════════════════════════════════════

function getInitials(name) {
  return String(name)
    .split(/[\s&,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

/** Deterministic color from company name (consistent across renders) */
function stringToColor(str) {
  const palette = [
    '#6366f1','#8b5cf6','#0ea5e9','#10b981','#f59e0b',
    '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function formatAccountName(acct) {
  if (acct.lastFour) return `${acct.name} ···${acct.lastFour}`;
  return acct.name;
}

function formatBalance(balance) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(balance);
}
