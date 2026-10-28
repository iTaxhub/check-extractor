import React from 'react';
import { Button, Dialog, GlassPanel } from '@/components/ui';
import { VisibleColumns } from '../hooks/useComparisonState';
import { useSpelling } from '@/hooks/useSpelling';

interface ColumnSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: VisibleColumns;
  setVisibleColumns: (columns: VisibleColumns) => void;
}

const COLUMNS: { key: keyof VisibleColumns; label: string }[] = [
  { key: 'checkNumber', label: 'Cheque number' },
  { key: 'payee', label: 'Payee' },
  { key: 'amount', label: 'Amounts and difference' },
  { key: 'matchStatus', label: 'Status' },
  { key: 'actions', label: 'Review action' },
  { key: 'date', label: 'Date' },
  { key: 'bankAccount', label: 'Bank / account' },
  { key: 'memo', label: 'Memo' },
  { key: 'issues', label: 'Issues' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'qbSource', label: 'QB source' },
  { key: 'qbType', label: 'QB transaction type' },
  { key: 'currency', label: 'Currency' },
  { key: 'pdfName', label: 'Document name' },
  { key: 'source', label: 'Found in' },
];

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  setVisibleColumns,
}) => {
  const t = useSpelling();
  return (
  <Dialog
    open={isOpen}
    onClose={onClose}
    size="sm"
    title="Columns"
    footer={
      <>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setVisibleColumns(
              Object.keys(visibleColumns).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {} as VisibleColumns
              )
            )
          }
        >
          Show all
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </>
    }
  >
    <GlassPanel padding="none" radius="input" className="scroll-region max-h-[55vh] p-1.5">
      {COLUMNS.map((col) => (
        <label
          key={col.key}
          className="flex cursor-pointer items-center gap-3 rounded-input px-3 py-2 transition-colors duration-tap hover:bg-brand/[0.06]"
        >
          <input
            type="checkbox"
            checked={visibleColumns[col.key]}
            onChange={(e) =>
              setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })
            }
            className="h-4 w-4 rounded border-glass-hairline"
          />
          <span className="text-sm font-medium text-ink-body">{t(col.label)}</span>
        </label>
      ))}
    </GlassPanel>
  </Dialog>
  );
};
