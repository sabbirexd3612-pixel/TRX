import React, { useState, useRef, useEffect } from 'react';
import { ChartType, MarketSymbol, Timeframe } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { POPULAR_SYMBOLS } from '../services/marketData';
import {
  CandlestickChart,
  LineChart,
  AreaChart,
  BarChart2,
  Activity,
  Camera,
  Maximize2,
  Minimize2,
  ChevronDown,
  Search,
  Languages,
  Flame,
  Globe,
  Check,
  Zap,
  Sparkles,
  Radio,
} from 'lucide-react';

interface TopBarProps {
  selectedSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onSelectChartType: (ct: ChartType) => void;
  onOpenIndicatorsModal: () => void;
  activeIndicatorsCount: number;
  onTakeScreenshot: () => void;
  language: Language;
  onToggleLanguage: () => void;
  isConnected: boolean;
  overallRating: string;
  chartMode: 'tradingview' | 'terminal';
  onSelectChartMode: (mode: 'tradingview' | 'terminal') => void;
  timezone: string;
  onSelectTimezone: (tz: string) => void;
  onOpenWsModal?: () => void;
  isCustomWsActive?: boolean;
}

const TIMEZONES = [
  { id: 'Etc/UTC', label: 'UTC (00:00)' },
  { id: 'Asia/Dhaka', label: 'Dhaka (GMT+6)' },
  { id: 'America/New_York', label: 'New York (EST)' },
  { id: 'Europe/London', label: 'London (GMT)' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST+9)' },
  { id: 'Asia/Dubai', label: 'Dubai (GST+4)' },
];

export const TopBar: React.FC<TopBarProps> = ({
  selectedSymbol,
  onSelectSymbol,
  timeframe,
  onSelectTimeframe,
  chartType,
  onSelectChartType,
  onOpenIndicatorsModal,
  activeIndicatorsCount,
  onTakeScreenshot,
  language,
  onToggleLanguage,
  isConnected,
  overallRating,
  chartMode,
  onSelectChartMode,
  timezone,
  onSelectTimezone,
  onOpenWsModal,
  isCustomWsActive = false,
}) => {
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const symbolRef = useRef<HTMLDivElement>(null);
  const chartTypeRef = useRef<HTMLDivElement>(null);
  const timezoneRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setSymbolDropdownOpen(false);
      }
      if (chartTypeRef.current && !chartTypeRef.current.contains(e.target as Node)) {
        setChartTypeDropdownOpen(false);
      }
      if (timezoneRef.current && !timezoneRef.current.contains(e.target as Node)) {
        setTimezoneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredSymbols = POPULAR_SYMBOLS.filter(
    (s) =>
      s.id.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.baseAsset.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

  const chartTypes: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'candlestick', label: t.candlestick, icon: <CandlestickChart className="w-4 h-4 text-emerald-400" /> },
    { id: 'heikinAshi', label: t.heikinAshi, icon: <CandlestickChart className="w-4 h-4 text-blue-400" /> },
    { id: 'line', label: t.line, icon: <LineChart className="w-4 h-4 text-amber-400" /> },
    { id: 'area', label: t.area, icon: <AreaChart className="w-4 h-4 text-purple-400" /> },
    { id: 'bar', label: t.bar, icon: <BarChart2 className="w-4 h-4 text-cyan-400" /> },
  ];

  const isPositive = selectedSymbol.change24h >= 0;

  return (
    <header
      id="tradingview-topbar"
      className="bg-[#131722] border-b border-[#2a2e39] flex flex-col shrink-0 select-none z-30"
    >
      {/* Upper Main Toolbar */}
      <div className="h-12 px-3 flex items-center justify-between gap-2 border-b border-[#1e222d]">
        {/* Left: Brand & Symbol Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official TradingView Branding */}
          <div className="flex items-center gap-1.5 pr-2 sm:pr-3 border-r border-[#2a2e39]">
            <div className="w-7 h-7 rounded-md bg-[#2962ff] flex items-center justify-center shadow-md shadow-[#2962ff]/30">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white tracking-tight leading-none">
                  TradingView
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded-xs bg-[#2962ff]/20 text-[#2962ff] font-bold">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-[#787b86] font-mono leading-tight hidden lg:block">
                Advanced Chart
              </span>
            </div>
          </div>

          {/* Symbol Selector Dropdown */}
          <div className="relative" ref={symbolRef}>
            <button
              id="symbol-selector-btn"
              onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#1e222d] hover:bg-[#252a37] border border-[#2a2e39] transition-colors"
            >
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-white font-mono">
                    {selectedSymbol.baseAsset}/{selectedSymbol.quoteAsset}
                  </span>
                  <span className="text-[9px] text-gray-400 uppercase font-sans hidden sm:inline">
                    {selectedSymbol.category}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Symbol Dropdown Menu */}
            {symbolDropdownOpen && (
              <div
                id="symbol-dropdown-menu"
                className="absolute left-0 top-11 w-80 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in"
              >
                <div className="p-2 border-b border-[#2a2e39] bg-[#171b26]">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none" />
                    <input
                      id="symbol-search-input"
                      type="text"
                      placeholder={t.searchSymbol}
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      className="w-full bg-[#131722] border border-[#2a2e39] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-[#2962ff]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto p-1 divide-y divide-[#2a2e39]/50">
                  {filteredSymbols.map((sym) => {
                    const isSel = sym.id === selectedSymbol.id;
                    const symPositive = sym.change24h >= 0;
                    return (
                      <button
                        key={sym.id}
                        id={`symbol-option-${sym.id}`}
                        onClick={() => {
                          onSelectSymbol(sym);
                          setSymbolDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          isSel ? 'bg-[#2962ff]/20 text-white' : 'hover:bg-[#252a37] text-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-white font-mono">
                            {sym.baseAsset}/{sym.quoteAsset}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                            {sym.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs text-gray-200">
                            ${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.precision })}
                          </div>
                          <div
                            className={`text-[10px] font-mono font-medium ${
                              symPositive ? 'text-[#089981]' : 'text-[#f23645]'
                            }`}
                          >
                            {symPositive ? '+' : ''}
                            {sym.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live Price and 24h Change ticker badge */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#2a2e39]">
            <span className="font-mono text-sm sm:text-base font-bold text-white">
              ${selectedSymbol.price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol.precision })}
            </span>
            <span
              className={`font-mono text-xs px-1.5 py-0.5 rounded-sm font-semibold flex items-center gap-0.5 ${
                isPositive ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
              }`}
            >
              {isPositive ? '+' : ''}
              {selectedSymbol.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher (TradingView Real vs Paper Trading Terminal) */}
        <div className="flex items-center bg-[#0d1017] p-1 rounded-lg border border-[#2a2e39] shadow-inner">
          <button
            id="chartmode-tradingview-btn"
            onClick={() => onSelectChartMode('tradingview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              chartMode === 'tradingview'
                ? 'bg-[#2962ff] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.realTradingViewMode}</span>
          </button>
          <button
            id="chartmode-terminal-btn"
            onClick={() => onSelectChartMode('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              chartMode === 'terminal'
                ? 'bg-[#2962ff] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span>{t.paperTradingTerminal}</span>
          </button>
        </div>

        {/* Right: Controls & Language */}
        <div className="flex items-center gap-1.5">
          {/* Timezone Dropdown */}
          <div className="relative hidden xl:block" ref={timezoneRef}>
            <button
              id="timezone-dropdown-btn"
              onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1e222d] hover:bg-[#252a37] text-gray-300 border border-[#2a2e39] text-xs font-mono"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{TIMEZONES.find((t) => t.id === timezone)?.label || timezone}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {timezoneDropdownOpen && (
              <div className="absolute right-0 top-10 w-48 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 z-50">
                {TIMEZONES.map((tz) => (
                  <button
                    key={tz.id}
                    onClick={() => {
                      onSelectTimezone(tz.id);
                      setTimezoneDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-colors ${
                      tz.id === timezone
                        ? 'bg-[#2962ff]/20 text-[#2962ff] font-bold'
                        : 'text-gray-300 hover:bg-[#252a37]'
                    }`}
                  >
                    <span>{tz.label}</span>
                    {tz.id === timezone && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connection status */}
          <div
            id="connection-status-indicator"
            title={isConnected ? t.connected : t.connecting}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#1e222d] rounded-md border border-[#2a2e39] text-[11px] text-gray-300"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#089981] animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden sm:inline font-mono">
              {isConnected ? 'LIVE' : 'SYNC'}
            </span>
          </div>

          {/* WebSocket API Modal Trigger Button */}
          {onOpenWsModal && (
            <button
              id="open-ws-modal-topbar-btn"
              onClick={onOpenWsModal}
              title={language === 'bn' ? 'কাস্টম ওয়েবসকেট API (WebSocket)' : 'Custom WebSocket API'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                isCustomWsActive
                  ? 'bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/40 shadow-xs'
                  : 'bg-[#1e222d] hover:bg-[#252a37] text-gray-300 hover:text-white border border-[#2a2e39]'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isCustomWsActive ? 'text-[#2962ff] animate-pulse' : 'text-gray-400'}`} />
              <span className="font-sans">
                {isCustomWsActive
                  ? language === 'bn' ? 'কাস্টম API: অন' : 'Custom WS: On'
                  : language === 'bn' ? 'ওয়েবসকেট API' : 'WebSocket API'}
              </span>
            </button>
          )}

          {/* Screenshot capture */}
          <button
            id="take-screenshot-btn"
            onClick={onTakeScreenshot}
            title={t.screenshot}
            className="p-1.5 rounded-md bg-[#1e222d] hover:bg-[#252a37] text-gray-400 hover:text-white border border-[#2a2e39] transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            id="toggle-fullscreen-btn"
            onClick={toggleFullscreen}
            title={t.fullscreen}
            className="p-1.5 rounded-md bg-[#1e222d] hover:bg-[#252a37] text-gray-400 hover:text-white border border-[#2a2e39] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Language Switch */}
          <button
            id="toggle-language-btn"
            onClick={onToggleLanguage}
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1e222d] hover:bg-[#252a37] text-xs font-semibold text-gray-200 border border-[#2a2e39] transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Lower Quick Ribbon: Popular Market Tickers & Custom Controls */}
      <div className="h-9 px-3 bg-[#171b26] flex items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar">
        {/* Quick Tickers */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-[#787b86] uppercase tracking-wider hidden sm:inline mr-1">
            {t.quickMarkets}:
          </span>
          {POPULAR_SYMBOLS.slice(0, 7).map((sym) => {
            const isSel = sym.id === selectedSymbol.id;
            const symPos = sym.change24h >= 0;
            return (
              <button
                key={sym.id}
                id={`quick-market-${sym.id}`}
                onClick={() => onSelectSymbol(sym)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono transition-all shrink-0 ${
                  isSel
                    ? 'bg-[#2962ff]/20 border border-[#2962ff]/50 text-white font-bold'
                    : 'bg-[#131722] hover:bg-[#1e222d] border border-[#2a2e39] text-gray-300'
                }`}
              >
                <span>{sym.baseAsset}</span>
                <span className={`text-[10px] ${symPos ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {symPos ? '+' : ''}
                  {sym.change24h.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side of lower ribbon: Timeframe & Indicators shortcuts when in Terminal mode or for quick sync */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Timeframes */}
          <div className="flex items-center bg-[#131722] p-0.5 rounded-md border border-[#2a2e39]">
            {timeframes.map((tf) => {
              const isSel = timeframe === tf;
              return (
                <button
                  key={tf}
                  id={`timeframe-btn-${tf}`}
                  onClick={() => onSelectTimeframe(tf)}
                  className={`px-1.5 py-0.5 rounded-xs text-[11px] font-mono font-medium transition-all ${
                    isSel
                      ? 'bg-[#2962ff] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e222d]'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          {/* Chart Type Dropdown (when in Terminal Mode) */}
          {chartMode === 'terminal' && (
            <div className="relative" ref={chartTypeRef}>
              <button
                id="chart-type-dropdown-btn"
                onClick={() => setChartTypeDropdownOpen(!chartTypeDropdownOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#131722] hover:bg-[#1e222d] border border-[#2a2e39] text-[11px] text-gray-300"
              >
                {chartTypes.find((c) => c.id === chartType)?.icon}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {chartTypeDropdownOpen && (
                <div className="absolute right-0 top-8 w-40 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl p-1 z-50">
                  {chartTypes.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => {
                        onSelectChartType(ct.id);
                        setChartTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${
                        chartType === ct.id ? 'bg-[#2962ff]/20 text-white font-medium' : 'text-gray-300 hover:bg-[#252a37]'
                      }`}
                    >
                      {ct.icon}
                      <span>{ct.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Indicators Modal Button */}
          {chartMode === 'terminal' && (
            <button
              id="open-indicators-modal-btn"
              onClick={onOpenIndicatorsModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#131722] hover:bg-[#1e222d] border border-[#2a2e39] text-[11px] text-gray-300 font-medium"
            >
              <Activity className="w-3.5 h-3.5 text-[#2962ff]" />
              <span>{t.indicators}</span>
              {activeIndicatorsCount > 0 && (
                <span className="bg-[#2962ff] text-white text-[9px] px-1 rounded-full font-bold">
                  {activeIndicatorsCount}
                </span>
              )}
            </button>
          )}

          {/* Technical Gauge Badge */}
          <div
            id="overall-rating-badge"
            title={`${t.technicalSummary}: ${overallRating}`}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              overallRating.includes('Buy')
                ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/30'
                : overallRating.includes('Sell')
                ? 'bg-[#f23645]/20 text-[#f23645] border border-[#f23645]/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{overallRating}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
