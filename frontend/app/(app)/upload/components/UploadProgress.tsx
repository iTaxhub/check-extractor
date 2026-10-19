'use client';

import { useEffect, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui';
import { cn } from '@/lib/utils';

interface UploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  checkId?: string;
  error?: string;
}

interface Props {
  files: File[];
  onComplete?: (checkIds: string[]) => void;
}

export default function UploadProgress({ files, onComplete }: Props) {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Initialize upload statuses
    setUploads(files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    })));
  }, [files]);

  useEffect(() => {
    if (uploads.length > 0 && !isUploading) {
      startUploads();
    }
  }, [uploads.length]);

  const startUploads = async () => {
    setIsUploading(true);
    const completedIds: string[] = [];

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];

      try {
        // Update to uploading
        updateUploadStatus(i, { status: 'uploading', progress: 0 });

        // Upload file
        const formData = new FormData();
        formData.append('file', upload.file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const { checkId } = await uploadResponse.json();

        updateUploadStatus(i, {
          status: 'processing',
          progress: 50,
          checkId
        });

        // Trigger processing
        const processResponse = await fetch(`/api/process/${checkId}`, {
          method: 'POST',
        });

        if (!processResponse.ok) {
          throw new Error('Processing failed to start');
        }

        updateUploadStatus(i, {
          status: 'complete',
          progress: 100
        });

        completedIds.push(checkId);

      } catch (error: any) {
        updateUploadStatus(i, {
          status: 'error',
          error: error.message
        });
      }
    }

    setIsUploading(false);

    if (onComplete && completedIds.length > 0) {
      onComplete(completedIds);
    }
  };

  const updateUploadStatus = (index: number, updates: Partial<UploadStatus>) => {
    setUploads(prev => prev.map((upload, i) =>
      i === index ? { ...upload, ...updates } : upload
    ));
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'complete':
        return <Check className="text-success" size={20} />;
      case 'error':
        return <X className="text-error" size={20} />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="text-brand animate-spin" size={20} />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-glass-hairline" />;
    }
  };

  const getStatusText = (upload: UploadStatus) => {
    switch (upload.status) {
      case 'pending':
        return 'Waiting';
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Starting extraction';
      case 'complete':
        return 'Sent for extraction';
      case 'error':
        return upload.error || 'Failed';
    }
  };

  /* Tint only — the surface itself stays glass (rule 10). */
  const getStatusTint = (status: UploadStatus['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-success-bg/45 border-success-border';
      case 'error':
        return 'bg-error-bg/45 border-error-border';
      case 'uploading':
      case 'processing':
        return 'bg-info-bg/45 border-info-border';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      {uploads.map((upload, index) => (
        <GlassPanel
          key={index}
          className={cn(
            'transition-[background-color,border-color] duration-quick ease-settle',
            getStatusTint(upload.status)
          )}
        >
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(upload.status)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-strong">
                {upload.file.name}
              </p>
              <p className={cn('text-xs', upload.status === 'error' ? 'text-error-text' : 'text-ink-soft')}>
                {getStatusText(upload)}
              </p>
            </div>

          </div>
          {/* No bar: `progress` is a placeholder step (0/50/100), not a
              measured upload, so a determinate bar here would invent it. */}
        </GlassPanel>
      ))}
    </div>
  );
}
