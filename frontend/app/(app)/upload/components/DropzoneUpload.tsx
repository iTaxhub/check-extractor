'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCheck2, FileX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useSpelling } from '@/hooks/useSpelling';

interface Props {
  onFilesSelected: (files: File[]) => void;
}

/**
 * The drop target.
 *
 * Three states, all driven by hook booleans rather than classNames, because
 * glassifying only the resting state leaves accept and reject looking broken:
 *
 *   resting  — hairline dashed border over the mesh, neutral glass
 *   accept   — brand ring + brand wash, the file is droppable
 *   reject   — error ring + error wash, the file type is not accepted
 *
 * `isDragReject` is checked before `isDragAccept`: during a drag over a
 * mixed selection react-dropzone reports both, and the refusal is the one
 * the reader needs to see.
 */
export default function DropzoneUpload({ onFilesSelected }: Props) {
  const t = useSpelling();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, open, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    // The Browse button opens the picker; the zone itself still opens it on
    // click, Enter or Space (react-dropzone's root is focusable by default).
  });

  const state = isDragReject ? 'reject' : isDragAccept || isDragActive ? 'accept' : 'resting';

  return (
    <div
      {...getRootProps({ 'aria-label': t('Drop cheque files here or press Enter to browse') })}
      data-drag-state={state}
      aria-invalid={state === 'reject' || undefined}
      className={cn(
        'glass-card cursor-pointer rounded-card border border-dashed px-6 py-8 text-center',
        'transition-[border-color,background-color,box-shadow] duration-quick ease-settle',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        state === 'resting' && 'border-ink-strong/20 hover:border-brand/50',
        // NOT `shadow-glass-selected`: that name exists in tailwind.config.js
        // both as a boxShadow and as the `glass.selected` colour, so it
        // compiles to a shadow *colour* and the glow silently never renders.
        state === 'accept' && 'border-brand bg-brand-wash/80 shadow-brand-glow',
        state === 'reject' && 'border-error bg-error-bg/70 shadow-danger-glow'
      )}
    >
      <input {...getInputProps()} />

      {state === 'reject' ? (
        <>
          <FileX2 className="mx-auto mb-3 text-error" size={32} aria-hidden />
          <p className="text-sm font-medium text-error-text">That file type is not supported</p>
          <p className="mt-1 text-xs text-ink-body">PNG, JPG or PDF only.</p>
        </>
      ) : state === 'accept' ? (
        <>
          <FileCheck2 className="mx-auto mb-3 text-brand" size={32} aria-hidden />
          <p className="text-sm font-medium text-brand-dark">Drop the files here</p>
          <p className="mt-1 text-xs text-ink-body">{t('Pages and cheques are detected next.')}</p>
        </>
      ) : (
        <>
          <Upload className="mx-auto mb-3 text-ink-faint" size={32} aria-hidden />
          <p className="text-sm font-medium text-ink-strong">{t('Drag cheque files here')}</p>
          <p className="mt-1 text-xs text-ink-soft">PNG, JPG or PDF, up to 10MB per file</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            Browse files
          </Button>
        </>
      )}
    </div>
  );
}
