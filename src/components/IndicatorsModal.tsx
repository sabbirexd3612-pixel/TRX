import React, { useState } from 'react';
import { IndicatorConfig } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { X, Check, Activity, TrendingUp, BarChart2, Layers } from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  language: Language;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
  language,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overlay' | 'oscillator'>('all');
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const filtered = indicators.filter(ind => {
    const matchesSearch = ind.name.toLowerCase().includes(search.toLowerCase()) ||
      ind.nameBn.includes(search);
    const matchesFilter = filter === 'all' || ind.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        id="indicators-modal-card"
        className="w-full max-w-lg bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2e39]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#2962ff]" />
            <h3 className="font-semibold text-base text-white">
              {t.indicators} & {t.technicalSummary}
            </h3>
          </div>
          <button
            id="close-indicators-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-[#2a2e39] space-y-3 bg-[#171b26]">
          <input
            id="search-indicators-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'bn' ? 'ইন্ডিকেটর সার্চ করুন...' : 'Search indicators...'}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3.5 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-hidden focus:border-[#2962ff]"
          />

          <div className="flex gap-2">
            <button
              id="filter-all-btn"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#2962ff] text-white'
                  : 'bg-[#1e222d] text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'}
            </button>
            <button
              id="filter-overlay-btn"
              onClick={() => setFilter('overlay')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'overlay'
                  ? 'bg-[#2962ff] text-white'
                  : 'bg-[#1e222d] text-gray-400 hover:text-gray-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {language === 'bn' ? 'ওভারলে (চার্টের উপর)' : 'Overlays'}
            </button>
            <button
              id="filter-oscillator-btn"
              onClick={() => setFilter('oscillator')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'oscillator'
                  ? 'bg-[#2962ff] text-white'
                  : 'bg-[#1e222d] text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              {language === 'bn' ? 'অসিলেটর (সাব-পেন)' : 'Oscillators'}
            </button>
          </div>
        </div>

        {/* Indicators List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {language === 'bn' ? 'কোন ইন্ডিকেটর খুঁজে পাওয়া যায়নি' : 'No indicators found'}
            </div>
          ) : (
            filtered.map((ind) => {
              return (
                <div
                  key={ind.id}
                  id={`indicator-item-${ind.id}`}
                  onClick={() => onToggleIndicator(ind.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    ind.enabled
                      ? 'bg-[#2962ff]/10 border-[#2962ff]/40 text-white'
                      : 'bg-[#171b26] border-[#2a2e39] text-gray-300 hover:bg-[#202534]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: ind.color }}
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-100 flex items-center gap-2">
                        {ind.name}
                        {ind.period && (
                          <span className="text-xs text-gray-400 font-mono">
                            ({ind.period})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {language === 'bn' ? ind.nameBn : ind.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        ind.category === 'overlay'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      {ind.category === 'overlay' ? 'Overlay' : 'Oscillator'}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                        ind.enabled
                          ? 'bg-[#2962ff] border-[#2962ff] text-white'
                          : 'border-gray-600 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2e39] flex items-center justify-between bg-[#171b26] text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>
              {indicators.filter(i => i.enabled).length} {language === 'bn' ? 'সক্রিয়' : 'active'}
            </span>
          </div>
          <button
            id="done-indicators-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded-md font-medium transition-colors"
          >
            {language === 'bn' ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
