'use client';

import { useRef, useState } from 'react';
import { Upload as UploadIcon, AlertCircle } from 'lucide-react';

interface UploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function Upload({ onFileSelected, isLoading }: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return 'Please upload a PNG or JPG image';
    }
    if (file.size > 8 * 1024 * 1024) {
      return 'File size must be under 8MB';
    }
    return null;
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const error = validateFile(file);
    if (error) {
      setErrorMsg(error);
      return;
    }
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all backdrop-blur-sm ${
          isDragActive
            ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/20'
            : 'border-slate-600 hover:border-slate-400 bg-slate-800/40 hover:bg-slate-800/60'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        <UploadIcon className="w-16 h-16 mx-auto mb-4 text-cyan-400 opacity-80" />

        <h3 className="text-2xl font-bold mb-2 text-white">Upload Image for Analysis</h3>
        <p className="text-slate-400 mb-8 text-lg">
          Drag and drop your image or click to select
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/60"
        >
          {isLoading ? 'Analyzing...' : 'Select Image'}
        </button>

        <p className="text-xs text-slate-500 mt-6 uppercase tracking-wider">
          PNG or JPG • Max 8MB
        </p>
      </div>

      {errorMsg && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{errorMsg}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-block">
            <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-cyan-400 rounded-full"></div>
          </div>
          <p className="text-slate-400 mt-3">Analyzing image with forensic tools...</p>
        </div>
      )}
    </div>
  );
}
