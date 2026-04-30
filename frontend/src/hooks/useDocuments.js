import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../services/documents';

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentService.list();
      setDocuments(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const uploadDocument = useCallback(async (file, title, onProgress) => {
    const doc = await documentService.upload(file, title, onProgress);
    setDocuments(prev => [doc, ...prev]);
    return doc;
  }, []);

  const deleteDocument = useCallback(async (id) => {
    await documentService.delete(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  return { documents, loading, error, uploadDocument, deleteDocument, refetch: fetchDocuments };
}
