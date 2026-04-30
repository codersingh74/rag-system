import React, { useState } from 'react';
import { FileText, Trash2, CheckCircle, AlertCircle, Loader, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import UploadZone from '../components/UploadZone';
import { useDocuments } from '../hooks/useDocuments';

const statusConfig = {
  ready:      { icon: <CheckCircle size={13} className="text-green-500" />, color: 'text-green-600 dark:text-green-400' },
  processing: { icon: <Loader size={13} className="text-blue-500 animate-spin" />, color: 'text-blue-600 dark:text-blue-400' },
  error:      { icon: <AlertCircle size={13} className="text-red-500" />, color: 'text-red-600 dark:text-red-400' },
  uploading:  { icon: <Clock size={13} className="text-yellow-500" />, color: 'text-yellow-600 dark:text-yellow-400' },
};

export default function Documents() {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments();
  const [expandedSummary, setExpandedSummary] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document and all its embeddings?')) return;
    setDeletingId(id);
    try { await deleteDocument(id); }
    catch (e) { alert(e.response?.data?.error || 'Delete failed'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Upload PDFs — they get processed into embeddings for AI-powered Q&A.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          📄 Upload New Document
        </h2>
        <UploadZone onUpload={uploadDocument} />
      </div>

      {/* Document list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Your Documents
          <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {documents.length}
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size={22} className="animate-spin mr-2" /> Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs mt-1">Upload your first PDF above to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const sc = statusConfig[doc.status] || statusConfig.processing;
            return (
              <div key={doc.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="mt-0.5 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{doc.title}</p>

                      {/* Meta pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`flex items-center gap-1 text-xs ${sc.color}`}>
                          {sc.icon} {doc.status}
                        </span>
                        {doc.page_count > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {doc.page_count} pages
                          </span>
                        )}
                        {doc.chunk_count > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {doc.chunk_count} chunks
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {doc.file_size_mb} MB
                        </span>
                      </div>

                      {/* Error message */}
                      {doc.error_message && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{doc.error_message}</p>
                      )}

                      {/* Summary toggle */}
                      {doc.summary && doc.status === 'ready' && (
                        <div className="mt-2">
                          <button
                            onClick={() => setExpandedSummary(expandedSummary === doc.id ? null : doc.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {expandedSummary === doc.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expandedSummary === doc.id ? 'Hide summary' : 'Show AI summary'}
                          </button>
                          {expandedSummary === doc.id && (
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg leading-relaxed border border-gray-200 dark:border-gray-600">
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                      rounded-lg transition-colors flex-shrink-0"
                    title="Delete document"
                  >
                    {deletingId === doc.id
                      ? <Loader size={15} className="animate-spin" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
