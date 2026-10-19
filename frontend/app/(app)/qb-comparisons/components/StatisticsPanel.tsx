import React from 'react';

interface StatisticsPanelProps {
  total: number;
  matched: number;
  mismatched: number;
  missingInQB: number;
  missingInExtraction: number;
  /** Current match-status filter, so the active tab reads as selected. */
  filterStatus: string;
  /** Selecting a tab filters the grid by that status; "all" clears it. */
  onSelectStatus: (status: string) => void;
}

/** Compact status tabs with counts. Each tab is the status filter. */
export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  total,
  matched,
  mismatched,
  missingInQB,
  missingInExtraction,
  filterStatus,
  onSelectStatus,
}) => {
  const tabs = [
    { status: 'all', label: 'All', value: total },
    { status: 'mismatch', label: 'Mismatch', value: mismatched },
    { status: 'missing-in-qb', label: 'Missing in QB', value: missingInQB },
    { status: 'missing-in-extraction', label: 'Missing in cheques', value: missingInExtraction },
    { status: 'matched', label: 'Matched', value: matched },
  ];

  return (
    <div role="tablist" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const active = filterStatus === tab.status;
        return (
          <button
            key={tab.status}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelectStatus(tab.status)}
            className={`press inline-flex items-center gap-1.5 rounded-input px-2.5 py-1 text-xs font-medium transition-colors duration-tap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              active
                ? 'bg-brand/[0.1] text-brand-dark'
                : 'text-ink-body hover:bg-ink-strong/[0.04] hover:text-ink-strong'
            }`}
          >
            {tab.label}
            <span className={`nums ${active ? 'text-brand-dark' : 'text-ink-faint'}`}>{tab.value}</span>
          </button>
        );
      })}
    </div>
  );
};
