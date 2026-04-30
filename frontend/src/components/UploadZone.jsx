import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function UploadZone({ onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setTitle(accepted[0].name.replace(/\.pdf$/i, ''));
      setStatus('idle');
      setMessage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    try {
      await onUpload(file, title, setProgress);
      setStatus('success');
      setMessage('✅ Document processed and ready for queries!');
      setTimeout(() => {
        setFile(null); setTitle(''); setStatus('idle'); setProgress(0); setMessage('');
      }, 3000);
    } catch (e) {
      setStatus('error');
      setMessage(e.response?.data?.error || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="text-blue-500 flex-shrink-0" size={28} />
            <div className="text-left">
              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); setStatus('idle'); }}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragActive ? 'Drop your PDF here!' : 'Drag & drop a PDF, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Only PDF files — max 50MB</p>
          </>
        )}
      </div>

      {/* Title input */}
      {file && (
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Document title (optional)"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {/* Progress bar */}
      {status === 'uploading' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Processing document…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle size={16} /> {message}
        </div>
      )}

      {/* Upload button */}
      {file && status !== 'uploading' && status !== 'success' && (
        <button
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload size={16} />
          Upload & Process Document
        </button>
      )}
    </div>
  );
}
