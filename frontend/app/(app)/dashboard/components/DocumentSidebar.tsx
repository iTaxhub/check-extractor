'use client';

import { FileText, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface Job {
  job_id: string;
  status: string;
  pdf_name: string;
  total_pages: number;
  total_checks: number;
  created_at: string;
}

interface Props {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  statusFilters: Set<string>;
  onToggleStatusFilter: (status: string) => void;
}

function statusIcon(status: string) {
  const map: Record<string, any> = {
    complete: <CheckCircle size={12} className="text-emerald-600" />,
    analyzed: <CheckCircle size={12} className="text-sky-600" />,
    pending: <Clock size={12} className="text-amber-600" />,
    extracting: <Loader2 size={12} className="text-blue-600 animate-spin" />,
    ocr_running: <Loader2 size={12} className="text-blue-600 animate-spin" />,
    error: <AlertCircle size={12} className="text-red-600" />,
  };
  return map[status] || map.pending;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    complete: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    analyzed: 'bg-sky-50 border-sky-200 text-sky-700',
    pending: 'bg-amber-50 border-amber-200 text-amber-700',
    extracting: 'bg-blue-50 border-blue-200 text-blue-700',
    ocr_running: 'bg-blue-50 border-blue-200 text-blue-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };
  return map[status] || map.pending;
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function DocumentSidebar({
  jobs,
  selectedJobId,
  onSelectJob,
  statusFilters,
  onToggleStatusFilter,
}: Props) {
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredJobs = jobs.filter((job) =>
    statusFilters.size === 0 || statusFilters.has(job.status)
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 rounded-l-xl">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents ({jobs.length})</h3>
      </div>

      {/* All Documents Option */}
      <div className="px-2 py-1 border-b border-gray-100">
        <button
          onClick={() => onSelectJob(null)}
          className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition ${
            selectedJobId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Documents
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            No documents
          </div>
        ) : (
          filteredJobs.map((job, idx) => (
            <button
              key={job.job_id}
              onClick={() => onSelectJob(job.job_id)}
              className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition ${
                selectedJobId === job.job_id
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-semibold text-gray-400 w-4">{idx + 1}</span>
              <FileText size={12} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {job.pdf_name}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <span>{job.total_pages}pg</span>
                  <span>{job.total_checks}chk</span>
                  {statusIcon(job.status)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Status Filters */}
      <div className="px-2 py-2 border-t border-gray-200">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Filters
        </div>
        <div className="space-y-0.5">
          {[
            { status: 'complete', label: 'Complete' },
            { status: 'pending', label: 'Pending' },
            { status: 'extracting', label: 'Extracting' },
            { status: 'ocr_running', label: 'Processing' },
            { status: 'error', label: 'Error' },
          ].map(({ status, label }) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            
            return (
              <label
                key={status}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={statusFilters.has(status)}
                  onChange={() => onToggleStatusFilter(status)}
                  className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1 text-xs text-gray-700">{label}</span>
                <span className="text-[10px] text-gray-400 font-medium">{count}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
