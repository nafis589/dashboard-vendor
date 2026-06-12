'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, MapPin } from 'lucide-react';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

interface MapSearchBarProps {
  onSelect: (lat: number, lon: number, shortName: string) => void;
}

function getShortName(result: NominatimResult): string {
  const addr = result.address;
  return (
    addr?.city ||
    addr?.town ||
    addr?.village ||
    result.display_name.split(',')[0]?.trim() ||
    result.display_name
  );
}

function formatResultLine(result: NominatimResult): string {
  return result.display_name.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedMatch({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    const q = query.trim();
    if (!q) return [{ text, match: false }];

    const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    return text
      .split(regex)
      .filter((p) => p.length > 0)
      .map((part) => ({
        text: part,
        match: part.toLowerCase() === q.toLowerCase(),
      }));
  }, [text, query]);

  return (
    <span className="text-[13px] sm:text-[14px] leading-snug break-words">
      {parts.map((part, i) =>
        part.match ? (
          <span key={i} className="font-semibold text-[#1A1A1A]">
            {part.text}
          </span>
        ) : (
          <span key={i} className="text-[#5f6368] font-normal">
            {part.text}
          </span>
        ),
      )}
    </span>
  );
}

export default function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setIsOpen(true);

    try {
      const params = new URLSearchParams({
        q: trimmed,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'tg',
        'accept-language': 'fr',
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'marketplace-vendor-register/1.0' },
        },
      );

      if (!res.ok) throw new Error('Nominatim error');

      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResults([]);
        setHasSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void search(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const shortName = getShortName(result);
    setQuery(shortName);
    setIsOpen(false);
    setResults([]);
    setHasSearched(false);
    onSelect(parseFloat(result.lat), parseFloat(result.lon), shortName);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsOpen(false);
    abortRef.current?.abort();
    inputRef.current?.focus();
  };

  const showPanel = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div
        className={[
          'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] overflow-hidden',
          showPanel ? 'rounded-2xl' : 'rounded-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder="Rechercher un lieu au Togo..."
            className="flex-1 min-w-0 text-[14px] sm:text-[15px] text-[#1A1A1A] placeholder:text-[#9aa0a6] focus:outline-none bg-transparent"
          />

          <Search
            size={20}
            strokeWidth={2.25}
            className="shrink-0 text-[#00796b] pointer-events-none"
            aria-hidden
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 w-8 h-8 flex items-center justify-center text-[#5f6368] hover:text-[#1A1A1A] hover:bg-[#f1f3f4] rounded-full transition-colors"
              aria-label="Effacer la recherche"
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {showPanel && (
          <>
            <hr className="border-0 border-t border-[#e8eaed] mx-3 sm:mx-4" />

            <div className="max-h-[min(280px,40vh)] overflow-y-auto overscroll-contain py-1">
              {isLoading && (
                <p className="px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] text-[#5f6368]">
                  Recherche en cours…
                </p>
              )}

              {!isLoading && results.length === 0 && hasSearched && (
                <p className="px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] text-[#5f6368]">
                  Aucun lieu trouvé au Togo
                </p>
              )}

              {!isLoading &&
                results.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full text-left flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-[#f1f3f4] active:bg-[#e8eaed] transition-colors"
                  >
                    <MapPin
                      size={18}
                      strokeWidth={1.75}
                      className="shrink-0 mt-0.5 text-[#9aa0a6]"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <HighlightedMatch
                        text={formatResultLine(result)}
                        query={query}
                      />
                    </span>
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
