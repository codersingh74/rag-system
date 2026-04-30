import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Plus, Trash2, MessageSquare, Loader, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import { chatService } from '../services/chat';

const EXAMPLE_QUERIES = [
  'What are the key terms of this contract?',
  'Summarize the financial highlights',
  'What are the penalty clauses?',
  'List all obligations of each party',
];

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingMsg, setStreamingMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingMsg, scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    chatService.listConversations()
      .then(data => { setConversations(data); })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    chatService.getConversation(activeConv.id)
      .then(conv => setMessages(conv.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [activeConv?.id]);

  const createConversation = async () => {
    try {
      const conv = await chatService.createConversation();
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      console.error('Failed to create conversation', e);
    }
  };

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setStreamingMsg('');
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    // Auto-create conversation if none
    let conv = activeConv;
    if (!conv) {
      try {
        conv = await chatService.createConversation();
        setConversations(prev => [conv, ...prev]);
        setActiveConv(conv);
      } catch (e) {
        alert('Could not start conversation. Is the backend running?');
        return;
      }
    }

    const query = input.trim();
    const userMsg = { role: 'user', content: query, created_at: new Date().toISOString(), sources: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setStreamingMsg('');

    try {
      let fullText = '';
      let sources = [];

      await chatService.sendMessageStream(
        conv.id,
        query,
        (token) => {
          fullText += token;
          setStreamingMsg(fullText);
        },
        (done) => {
          sources = done.sources || [];
        }
      );

      const assistantMsg = {
        role: 'assistant',
        content: fullText,
        sources,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingMsg('');

      // Update sidebar title
      if (conv.title === 'New Chat') {
        const updated = { ...conv, title: query.slice(0, 45) + (query.length > 45 ? '…' : '') };
        setActiveConv(updated);
        setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      }
    } catch (e) {
      const errMsg = e.message?.includes('No documents')
        ? 'No documents uploaded. Please go to Documents and upload a PDF first.'
        : 'Something went wrong. Please check if the backend is running.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errMsg,
        sources: [],
        created_at: new Date().toISOString()
      }]);
      setStreamingMsg('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden
        flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>

        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700
              text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingConvs ? (
            <div className="flex justify-center py-6">
              <Loader size={18} className="animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 px-3">
              No conversations yet.<br/>Click "New Chat" to start.
            </p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                  ${activeConv?.id === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate text-xs">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 flex-shrink-0 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/documents')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FileText size={14} /> Manage Documents
          </button>
        </div>
      </aside>

      {/* ── Main Chat Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800
          border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          <h2 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
            {activeConv?.title || 'Select or start a conversation'}
          </h2>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loadingMsgs ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader size={22} className="animate-spin mr-2" /> Loading messages…
            </div>
          ) : messages.length === 0 && !streamingMsg ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4">
              <span className="text-6xl mb-4">🔍</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Ask anything about your documents
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Upload PDFs in the Documents section, then ask questions here.
                Answers come <strong>only</strong> from your uploaded files — no hallucination.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {EXAMPLE_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="p-3 text-left text-xs bg-white dark:bg-gray-800 border border-gray-200
                      dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50
                      dark:hover:bg-blue-900/20 dark:hover:border-blue-700 transition-colors
                      text-gray-700 dark:text-gray-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} isStreaming={false} />
              ))}
              {streamingMsg && (
                <ChatMessage
                  message={{ role: 'assistant', content: streamingMsg, sources: [] }}
                  isStreaming={true}
                />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents… (Enter to send, Shift+Enter for new line)"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none px-4 py-3 text-sm border border-gray-300 dark:border-gray-600
                rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2
                focus:ring-blue-500 disabled:opacity-60 max-h-32 overflow-auto"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {sending
                ? <Loader size={16} className="animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            🔒 Answers are based strictly on your uploaded documents
          </p>
        </div>
      </div>
    </div>
  );
}
