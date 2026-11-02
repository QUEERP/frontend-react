import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { ALL_CURRENCIES, CurrencyItem } from '@/lib/constants/currencies';

interface SearchableCurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export function SearchableCurrencySelect({
  value,
  onChange,
  label = "Currency",
  required = false,
  placeholder = "Select Currency..."
}: SearchableCurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCurrency = useMemo(() => {
    if (!value) return null;
    const vUpper = value.trim().toUpperCase();
    return ALL_CURRENCIES.find(c => c.code === vUpper) || {
      code: vUpper,
      name: vUpper,
      symbol: vUpper === 'INR' ? '₹' : (vUpper === 'EUR' ? '€' : (vUpper === 'GBP' ? '£' : (vUpper === 'AED' ? 'د.إ' : '$')))
    };
  }, [value]);

  const filteredCurrencies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
    );
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`flex flex-col gap-1.5 relative ${isOpen ? 'z-40' : ''}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap min-h-[1.25rem]">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold inline-block leading-none">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-left flex items-center justify-between transition-all outline-none cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800 ${
            isOpen ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900 bg-white dark:bg-gray-900' : ''
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCurrency ? (
              <>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">
                  {selectedCurrency.code} ({selectedCurrency.symbol})
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium truncate text-xs">
                  {selectedCurrency.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full sm:w-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search code, name, or symbol (e.g. INR, $, Rupee)..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div
              data-lenis-prevent="true"
              className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-gray-50 dark:divide-gray-800/40 p-1 scrollbar-thin"
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredCurrencies.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-medium">
                  No currencies match "{searchTerm}"
                </div>
              ) : (
                filteredCurrencies.map((c) => {
                  const isSelected = selectedCurrency?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelect(c.code)}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[11px] text-gray-800 dark:text-gray-200">
                          {c.code}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm w-6 text-center">
                          {c.symbol}
                        </span>
                        <span className="truncate text-gray-600 dark:text-gray-400">
                          {c.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom info */}
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex justify-between items-center">
              <span>{filteredCurrencies.length} currencies</span>
              {selectedCurrency && (
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  Selected: {selectedCurrency.code} ({selectedCurrency.symbol})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

