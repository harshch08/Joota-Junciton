import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  queryAssistant,
  AssistantApiError,
  ConversationTurn,
  Product,
} from '../lib/assistantApi';
import { API_URL } from '../config';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_QUERY_LENGTH = 500;
const MAX_TURNS = 5;
const MAX_RESULTS_DISPLAY = 8;

const SUGGESTED_QUERIES = [
  'Show me running shoes under ₹5,000',
  'Find something like Nike Air Max but cheaper',
  'White casual sneakers for men',
  'Best rated Adidas shoes',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const getImageSrc = (img: string) =>
  img?.startsWith('/uploads/products') ? `${API_URL}${img}` : img;

function getErrorMessage(err: unknown): string {
  if (err instanceof AssistantApiError) {
    if (err.status === 429) return 'Too many requests. Please wait a moment before trying again.';
    if (err.status === 502 || err.status === 503) return 'Assistant is temporarily unavailable.';
  }
  return 'Something went wrong. Please try again.';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SuggestedQueriesProps {
  queries: string[];
  onSelect: (query: string) => void;
}

const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({ queries, onSelect }) => (
  <div className="px-4 py-3">
    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Try asking…</p>
    <div className="flex flex-wrap gap-2">
      {queries.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:bg-gray-50 transition-colors duration-150 text-left"
        >
          {q}
        </button>
      ))}
    </div>
  </div>
);

interface ResultCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ product, onClick }) => {
  const imgSrc = product.images?.[0] ? getImageSrc(product.images[0]) : '/placeholder.svg';
  const displayPrice = product.discountedPrice ?? product.price;
  const hasDiscount = !!product.discountedPrice;

  return (
    <button
      onClick={() => onClick(product)}
      className="group flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left w-full"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
            {Math.round(((product.price - product.discountedPrice!) / product.price) * 100)}% OFF
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-0.5">
        <p className="text-xs text-gray-500 truncate">{product.brand}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-bold text-gray-900">{formatPrice(displayPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </button>
  );
};

interface TurnViewProps {
  turn: ConversationTurn;
  onProductClick: (product: Product) => void;
  onSuggestedQuerySelect: (query: string) => void;
}

const TurnView: React.FC<TurnViewProps> = ({ turn, onProductClick, onSuggestedQuerySelect }) => {
  const hasResults = turn.results.length > 0;

  return (
    <div className="space-y-3">
      {/* User query bubble */}
      <div className="flex justify-end px-4">
        <div className="max-w-[80%] bg-gray-900 text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-tr-sm">
          {turn.query}
        </div>
      </div>

      {/* Assistant response */}
      <div className="px-4 space-y-2">
        {/* Intent summary */}
        {turn.intentSummary && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0" />
            {turn.intentSummary}
          </p>
        )}

        {hasResults ? (
          <>
            {/* Product grid */}
            <div className="grid grid-cols-2 gap-2">
              {turn.results.slice(0, MAX_RESULTS_DISPLAY).map((product) => (
                <ResultCard key={product._id} product={product} onClick={onProductClick} />
              ))}
            </div>

            {/* Overflow count */}
            {turn.totalCount > MAX_RESULTS_DISPLAY && (
              <p className="text-xs text-gray-500 text-center pt-1">
                Showing {Math.min(turn.results.length, MAX_RESULTS_DISPLAY)} of {turn.totalCount} results
              </p>
            )}
          </>
        ) : (
          /* Empty results */
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 text-center space-y-3">
            <p className="text-sm text-gray-600">No products found. Try a different query.</p>
            <SuggestedQueries queries={SUGGESTED_QUERIES} onSelect={onSuggestedQuerySelect} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AssistantPanel: React.FC<AssistantPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // State
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new turn is added
  useEffect(() => {
    if (turns.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const showSuggestedQueries = turns.length === 0 && !isLoading;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const validateInput = useCallback((value: string): string | null => {
    if (!value.trim()) return 'Please enter a query.';
    if (value.length > MAX_QUERY_LENGTH)
      return `Query must be ${MAX_QUERY_LENGTH} characters or fewer (currently ${value.length}).`;
    return null;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    // Clear validation error as user types
    if (validationError) setValidationError(null);
  };

  const submitQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      const vErr = validateInput(trimmed);
      if (vErr) {
        setValidationError(vErr);
        return;
      }

      setValidationError(null);
      setError(null);
      setIsLoading(true);

      try {
        const response = await queryAssistant(trimmed);
        const newTurn: ConversationTurn = {
          query: trimmed,
          results: response.results,
          parsedIntent: response.parsedIntent,
          intentSummary: response.intentSummary,
          totalCount: response.totalCount,
        };

        setTurns((prev) => {
          const updated = [...prev, newTurn];
          // Cap at MAX_TURNS — drop oldest
          return updated.length > MAX_TURNS ? updated.slice(updated.length - MAX_TURNS) : updated;
        });
        // Preserve query text in input after results are returned (Req 3.6)
        // inputValue stays as-is
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [validateInput],
  );

  const handleSubmit = () => {
    submitQuery(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedQuerySelect = (query: string) => {
    setInputValue(query);
    submitQuery(query);
  };

  const handleClear = () => {
    setTurns([]);
    setInputValue('');
    setError(null);
    setValidationError(null);
    inputRef.current?.focus();
  };

  const handleProductClick = (product: Product) => {
    onClose();
    navigate(`/product/${product._id}`);
  };

  const handleBackdropClick = () => {
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Centered modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI Shopping Assistant"
          className={`
            pointer-events-auto
            w-full max-w-lg
            bg-white rounded-2xl shadow-2xl
            flex flex-col
            transition-all duration-200 ease-out
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          style={{ maxHeight: 'min(85vh, 680px)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">AI Shopping Assistant</h2>
            </div>
            <div className="flex items-center gap-1">
              {turns.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto py-4 space-y-5 min-h-0"
          >
            {/* Welcome / empty state */}
            {turns.length === 0 && !isLoading && (
              <div className="px-5 flex flex-col items-center text-center gap-2 pt-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">What are you looking for?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Describe the shoes you want in plain language.</p>
                </div>
              </div>
            )}

            {/* Suggested queries */}
            {showSuggestedQueries && (
              <SuggestedQueries queries={SUGGESTED_QUERIES} onSelect={handleSuggestedQuerySelect} />
            )}

            {/* Loading — first query */}
            {isLoading && turns.length === 0 && (
              <div className="flex justify-center pt-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}

            {/* Conversation turns */}
            {turns.map((turn, idx) => (
              <TurnView
                key={idx}
                turn={turn}
                onProductClick={handleProductClick}
                onSuggestedQuerySelect={handleSuggestedQuerySelect}
              />
            ))}

            {/* Loading — subsequent queries */}
            {isLoading && turns.length > 0 && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input area ── */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-3 space-y-2">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} aria-label="Dismiss error">
                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                </button>
              </div>
            )}

            {validationError && (
              <p className="text-xs text-red-500 px-1">{validationError}</p>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you're looking for…"
                maxLength={MAX_QUERY_LENGTH + 100}
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 transition-colors leading-relaxed"
                style={{ minHeight: '40px', maxHeight: '100px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                aria-label="Send query"
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {inputValue.length > MAX_QUERY_LENGTH - 50 && (
              <p className={`text-xs text-right pr-1 ${inputValue.length > MAX_QUERY_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {inputValue.length}/{MAX_QUERY_LENGTH}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AssistantPanel;
