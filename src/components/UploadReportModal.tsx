'use client';

import { useState, useCallback } from 'react';
import DatePromptModal from './DatePromptModal';

interface UploadReportModalProps {
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Stage = 'idle' | 'uploading' | 'needs_date' | 'saving' | 'error';

export default function UploadReportModal({ profileId, onClose, onSuccess }: UploadReportModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingParsed, setPendingParsed] = useState<any>(null);

  async function uploadFile(file: File, reportDate?: string) {
    setStage(reportDate ? 'saving' : 'uploading');
    setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('profileId', profileId);
    if (reportDate) fd.append('reportDate', reportDate);

    const res = await fetch('/api/reports/upload', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      setStage('error');
      setError(data.error ?? 'Upload failed. Please try again.');
      return;
    }

    if (data.needs_date) {
      setPendingFile(file);
      setPendingParsed(data.parsed);
      setStage('needs_date');
      return;
    }

    onSuccess();
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    uploadFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function handleDateConfirm(date: string) {
    if (!pendingFile) return;
    uploadFile(pendingFile, date);
  }

  const isLoading = stage === 'uploading' || stage === 'saving';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={!isLoading ? onClose : undefined}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Upload Lab Report</h3>
            {!isLoading && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600">
                {stage === 'uploading' ? 'Reading report with AI…' : 'Saving to database…'}
              </p>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => document.getElementById('pdf-upload-input')?.click()}
              >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-600">Drag & drop a PDF, or <span className="text-blue-600 font-medium">click to browse</span></p>
                <p className="text-xs text-gray-400 mt-1">Lab reports, blood tests, health checkups</p>
              </div>
              <input
                id="pdf-upload-input"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {stage === 'needs_date' && (
        <DatePromptModal
          onConfirm={handleDateConfirm}
          onCancel={() => {
            setStage('idle');
            setPendingFile(null);
            setPendingParsed(null);
          }}
        />
      )}
    </>
  );
}
