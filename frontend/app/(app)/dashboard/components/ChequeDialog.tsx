'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RefreshCw, Loader2, Eye, Edit2, Save, XCircle } from 'lucide-react';

interface Check {
  check_id: string;
  page: number;
  extraction?: any;
  methods_used?: string[];
  engine_results?: Record<string, any>;
  engine_times_ms?: Record<string, number>;
}

interface Job {
  job_id: string;
  pdf_name: string;
  checks: Check[];
}

interface Props {
  job: Job;
  selectedCheckIdx: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
  onExport: (jobId: string, format: string) => void;
  onReExtract: (jobId: string) => void;
  reExtracting: boolean;
}

function extVal(ext: any, field: string): string {
  if (!ext) return '';
  const f = ext[field];
  if (typeof f === 'object' && f !== null) return f.value || '';
  if (typeof f === 'string') return f;
  if (typeof f === 'number') return String(f);
  return '';
}

export default function ChequeDialog({ job, selectedCheckIdx, onClose, onNavigate, onExport, onReExtract, reExtracting }: Props) {
  const [viewMode, setViewMode] = useState<'image' | 'table'>('image');
  const [imageZoom, setImageZoom] = useState(1);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCheck = job.checks[selectedCheckIdx];
  
  const [editedData, setEditedData] = useState({
    checkNumber: extVal(selectedCheck?.extraction, 'checkNumber'),
    checkDate: extVal(selectedCheck?.extraction, 'checkDate'),
    amount: extVal(selectedCheck?.extraction, 'amount'),
    payee: extVal(selectedCheck?.extraction, 'payee'),
    bankName: extVal(selectedCheck?.extraction, 'bankName'),
    memo: extVal(selectedCheck?.extraction, 'memo'),
  });

  const handleSave = async () => {
    if (!selectedCheck) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/checks/${selectedCheck.check_id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // Update local check data
      selectedCheck.extraction = {
        ...selectedCheck.extraction,
        checkNumber: editedData.checkNumber,
        checkDate: editedData.checkDate,
        amount: editedData.amount,
        payee: editedData.payee,
        bankName: editedData.bankName,
        memo: editedData.memo,
      };
      
      setIsEditing(false);
      alert('Check data saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      checkNumber: extVal(selectedCheck?.extraction, 'checkNumber'),
      checkDate: extVal(selectedCheck?.extraction, 'checkDate'),
      amount: extVal(selectedCheck?.extraction, 'amount'),
      payee: extVal(selectedCheck?.extraction, 'payee'),
      bankName: extVal(selectedCheck?.extraction, 'bankName'),
      memo: extVal(selectedCheck?.extraction, 'memo'),
    });
    setIsEditing(false);
  };

  const EXPORT_FORMATS = [
    { id: 'csv', name: 'Generic CSV', desc: 'Excel, Google Sheets' },
    { id: 'iif', name: 'QuickBooks Desktop', desc: 'IIF format' },
    { id: 'qbo', name: 'QuickBooks Online', desc: 'CSV bank import' },
    { id: 'xero', name: 'Xero', desc: 'Bank statement CSV' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[92vw] max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Cheque {selectedCheckIdx + 1} of {job.checks.length}
              </h3>
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{job.pdf_name}</span>
              <span className="text-[11px] text-gray-400">Page {selectedCheck.page}</span>
              {isEditing && (
                <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Edit Mode</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Edit/Save/Cancel buttons */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                </>
              )}
              
              {/* View Mode Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('image')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    viewMode === 'image' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Image View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Table View
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                >
                  <Download size={13} />
                  Export
                </button>
                {exportDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border z-50 py-1">
                    {EXPORT_FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => { onExport(job.job_id, fmt.id); setExportDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition"
                      >
                        <p className="text-[12px] font-medium text-gray-900">{fmt.name}</p>
                        <p className="text-[10px] text-gray-400">{fmt.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Re-extract button */}
              <button
                onClick={() => onReExtract(job.job_id)}
                disabled={reExtracting}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
              >
                {reExtracting ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Re-extract
              </button>
            </div>

            <div className="flex items-center gap-1">
              {viewMode === 'image' && (
                <>
                  <button onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))} className="p-1.5 hover:bg-gray-100 rounded" disabled={imageZoom <= 0.5}>
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[11px] text-gray-500 min-w-[2rem] text-center">{(imageZoom * 100).toFixed(0)}%</span>
                  <button onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))} className="p-1.5 hover:bg-gray-100 rounded" disabled={imageZoom >= 3}>
                    <ZoomIn size={14} />
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                </>
              )}
              <button
                onClick={() => { onNavigate(Math.max(0, selectedCheckIdx - 1)); setImageZoom(1); }}
                disabled={selectedCheckIdx === 0}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[12px] text-gray-500">{selectedCheckIdx + 1}/{job.checks.length}</span>
              <button
                onClick={() => { onNavigate(Math.min(job.checks.length - 1, selectedCheckIdx + 1)); setImageZoom(1); }}
                disabled={selectedCheckIdx === job.checks.length - 1}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded ml-1">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        {viewMode === 'image' ? (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Image */}
            <div className="w-1/2 flex items-center justify-center bg-gray-50 border-r overflow-auto p-4">
              <img
                src={`/api/check-image/${job.job_id}/${selectedCheck.check_id}`}
                alt=""
                className="rounded shadow-lg transition-transform"
                style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center', maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain' }}
              />
            </div>
            {/* Extraction Data */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {isEditing ? 'Edit Extraction Data' : 'Extraction Data'}
              </h4>
              {selectedCheck.extraction && (
                <div className="space-y-3">
                  {[
                    { label: 'Payee', field: 'payee', editField: 'payee' },
                    { label: 'Amount', field: 'amount', editField: 'amount' },
                    { label: 'Date', field: 'checkDate', editField: 'checkDate' },
                    { label: 'Check #', field: 'checkNumber', editField: 'checkNumber' },
                    { label: 'Bank', field: 'bankName', editField: 'bankName' },
                    { label: 'Memo', field: 'memo', editField: 'memo' },
                  ].map(({ label, field, editField }) => (
                    <div key={field} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 w-20 pt-2">{label}:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData[editField as keyof typeof editedData]}
                          onChange={(e) => setEditedData({ ...editedData, [editField]: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                          placeholder={`Enter ${label.toLowerCase()}`}
                        />
                      ) : (
                        <span className="font-medium text-gray-900 pt-2">{extVal(selectedCheck.extraction, field) || '—'}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase">Preview</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase">Payee</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase">Check #</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium text-gray-400 uppercase">Page</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium text-gray-400 uppercase">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {job.checks.map((check, idx) => (
                  <tr key={check.check_id} className={`hover:bg-blue-50/30 transition ${idx === selectedCheckIdx ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-2">
                      <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={`/api/check-image/${job.job_id}/${check.check_id}`}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{extVal(check.extraction, 'payee') || '—'}</td>
                    <td className="px-3 py-2 font-medium text-emerald-700">{extVal(check.extraction, 'amount') || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{extVal(check.extraction, 'checkDate') || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{extVal(check.extraction, 'checkNumber') || '—'}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{check.page}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => { onNavigate(idx); setViewMode('image'); }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
