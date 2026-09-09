import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Candle,
  ChartType,
  DrawingItem,
  DrawingToolType,
  IndicatorConfig,
  MarketSymbol,
  OrderBookEntry,
  TechnicalAnalysisSummary,
  Timeframe,
} from './types';
import {
  POPULAR_SYMBOLS,
  generateInitialCandles,
  generateOrderBook,
  timeframeToBinanceInterval,
  timeframeToSeconds,
} from './services/marketData';
import { computeTechnicalSummary } from './utils/indicators';
import { Language } from './utils/translations';
import { TopBar } from './components/TopBar';
import { DrawingToolbar } from './components/DrawingToolbar';
import { ChartContainer } from './components/ChartContainer';
import { RightSidebar } from './components/RightSidebar';
import { BottomBar } from './components/BottomBar';
import { IndicatorsModal } from './components/IndicatorsModal';
import { TradingViewRealChart } from './components/TradingViewRealChart';
import { WebSocketConfigModal } from './components/WebSocketConfigModal';

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  {
    id: 'sma20',
    name: 'SMA 20',
    nameBn: 'সিম্পল মুভিং এভারেজ ২০',
    enabled: false,
    color: '#3b82f6',
    period: 20,
    category: 'overlay',
  },
  {
    id: 'ema50',
    name: 'EMA 50',
    nameBn: 'এক্সপোনেনশিয়াল মুভিং এভারেজ ৫০',
    enabled: false,
    color: '#f59e0b',
    period: 50,
    category: 'overlay',
  },
  {
    id: 'ema200',
    name: 'EMA 200',
    nameBn: 'দীর্ঘমেয়াদী ট্রেন্ড EMA ২০০',
    enabled: false,
    color: '#ec4899',
    period: 200,
    category: 'overlay',
  },
  {
    id: 'bb',
    name: 'Bollinger Bands (20, 2)',
    nameBn: 'বলিঙ্গার ব্যান্ডস (২০, ২)',
    enabled: false,
    color: '#06b6d4',
    period: 20,
    stdDev: 2,
    category: 'overlay',
  },
  {
    id: 'vwap',
    name: 'VWAP',
    nameBn: 'ভলিউম ওয়েটেড এভারেজ প্রাইস',
    enabled: false,
    color: '#8b5cf6',
    category: 'overlay',
  },
  {
    id: 'rsi',
    name: 'RSI (14)',
    nameBn: 'রিলেটিভ স্ট্রেংথ ইনডেক্স ১৪',
    enabled: false,
    color: '#a855f7',
    period: 14,
    category: 'oscillator',
  },
  {
    id: 'macd',
    name: 'MACD (12, 26, 9)',
    nameBn: 'মুভিং এভারেজ কনভার্জেন্স ডাইভার্জেন্স',
    enabled: false,
    color: '#2962ff',
    period: 12,
    period2: 26,
    signalPeriod: 9,
    category: 'oscillator',
  },
];

export default function App() {
  // Application State
  const [chartMode, setChartMode] = useState<'tradingview' | 'terminal'>('tradingview');
  const [timezone, setTimezone] = useState<string>('Etc/UTC');
  const [showSidebarInTvMode, setShowSidebarInTvMode] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol>(POPULAR_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [language, setLanguage] = useState<Language>('bn');
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    try {
      const saved = localStorage.getItem('trading_indicators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_INDICATORS;
  });
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);

  // Custom WebSocket API State (Persisted in localStorage)
  const [customWsUrl, setCustomWsUrl] = useState<string>(() => {
    return localStorage.getItem('custom_ws_url') || '';
  });
  const [isCustomWsActive, setIsCustomWsActive] = useState<boolean>(() => {
    return localStorage.getItem('custom_ws_enabled') === 'true';
  });
  const [isWsModalOpen, setIsWsModalOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [wsMessagesCount, setWsMessagesCount] = useState(0);
  const [lastWsMessage, setLastWsMessage] = useState<any>(null);

  const handleSaveAndConnectWs = useCallback((url: string) => {
    setCustomWsUrl(url);
    setIsCustomWsActive(true);
    localStorage.setItem('custom_ws_url', url);
    localStorage.setItem('custom_ws_enabled', 'true');
  }, []);

  const handleResetWsToDefault = useCallback(() => {
    setIsCustomWsActive(false);
    localStorage.removeItem('custom_ws_enabled');
    setWsStatus('disconnected');
  }, []);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);

  // Market & Candle Data State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({
    bids: [],
    asks: [],
  });
  const [technicalSummary, setTechnicalSummary] = useState<TechnicalAnalysisSummary>({
    oscillators: {
      rsi: { value: 50, action: 'neutral' },
      macd: { value: 0, action: 'neutral' },
      stochastic: { value: 50, action: 'neutral' },
    },
    movingAverages: {
      sma20: { value: 0, action: 'neutral' },
      ema50: { value: 0, action: 'neutral' },
      ema200: { value: 0, action: 'neutral' },
    },
    overallAction: 'Neutral',
    buyCount: 3,
    sellCount: 3,
    neutralCount: 6,
  });

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initialize Candles when Symbol or Timeframe changes
  useEffect(() => {
    const initial = generateInitialCandles(selectedSymbol.price, 220, timeframe);
    setCandles(initial);
    setOrderBook(generateOrderBook(selectedSymbol.price, selectedSymbol.precision));
    setTechnicalSummary(computeTechnicalSummary(initial));
  }, [selectedSymbol.id, timeframe]);

  // 2. Real-time Live Feed Connection (Custom User WebSocket API or Default Binance Feed)
  useEffect(() => {
    let fallbackInterval: any = null;
    let reconnectTimeout: any = null;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const isUsingCustomWs = isCustomWsActive && customWsUrl.trim().length > 0;
    const binanceInterval = timeframeToBinanceInterval(timeframe);
    const targetWsUrl = isUsingCustomWs
      ? customWsUrl.trim()
      : selectedSymbol.binanceSymbol
      ? `wss://stream.binance.com:9443/ws/${selectedSymbol.binanceSymbol}@kline_${binanceInterval}`
      : null;

    if (targetWsUrl) {
      if (isUsingCustomWs) {
        setWsStatus('connecting');
      }

      try {
        const ws = new WebSocket(targetWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          if (isUsingCustomWs) {
            setWsStatus('connected');
          }
        };

        ws.onmessage = (event) => {
          try {
            let data: any = null;
            try {
              data = JSON.parse(event.data);
            } catch {
              // Might be raw text or number
              const num = parseFloat(event.data);
              if (!isNaN(num)) {
                data = { price: num };
              }
            }

            if (!data) return;

            if (isUsingCustomWs) {
              setLastWsMessage(data);
              setWsMessagesCount((c) => c + 1);
            }

            // A. Binance Kline format: { k: { t, o, h, l, c, v } }
            if (data && data.k) {
              const k = data.k;
              const candleTime = Math.floor(k.t / 1000);
              const open = parseFloat(k.o);
              const high = parseFloat(k.h);
              const low = parseFloat(k.l);
              const close = parseFloat(k.c);
              const volume = parseFloat(k.v);

              setCandles((prev) => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];

                let nextCandles: Candle[];
                if (last.time === candleTime) {
                  nextCandles = [
                    ...prev.slice(0, -1),
                    {
                      time: candleTime,
                      open,
                      high: Math.max(last.high, high),
                      low: Math.min(last.low, low),
                      close,
                      volume: last.volume + volume * 0.1,
                    },
                  ];
                } else if (candleTime > last.time) {
                  nextCandles = [
                    ...prev.slice(-250),
                    {
                      time: candleTime,
                      open,
                      high,
                      low,
                      close,
                      volume,
                    },
                  ];
                } else {
                  return prev;
                }

                setTechnicalSummary(computeTechnicalSummary(nextCandles));
                return nextCandles;
              });

              setSelectedSymbol((prev) => ({ ...prev, price: close }));
              setOrderBook(generateOrderBook(close, selectedSymbol.precision));
              return;
            }

            // B. Generic Candle Object: { time, open, high, low, close, volume }
            const cObj = data.candle || data.data || data;
            if (
              cObj &&
              (cObj.open !== undefined || cObj.o !== undefined) &&
              (cObj.close !== undefined || cObj.c !== undefined)
            ) {
              const rawTime = cObj.time ?? cObj.t ?? cObj.timestamp ?? Math.floor(Date.now() / 1000);
              const candleTime = rawTime > 10000000000 ? Math.floor(rawTime / 1000) : Number(rawTime);
              const open = parseFloat(cObj.open ?? cObj.o);
              const high = parseFloat(cObj.high ?? cObj.h ?? open);
              const low = parseFloat(cObj.low ?? cObj.l ?? open);
              const close = parseFloat(cObj.close ?? cObj.c ?? open);
              const volume = parseFloat(cObj.volume ?? cObj.v ?? 1);

              if (!isNaN(close)) {
                setCandles((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  let nextCandles: Candle[];
                  if (last.time === candleTime) {
                    nextCandles = [
                      ...prev.slice(0, -1),
                      {
                        time: candleTime,
                        open,
                        high: Math.max(last.high, high),
                        low: Math.min(last.low, low),
                        close,
                        volume: (last.volume || 0) + volume,
                      },
                    ];
                  } else if (candleTime > last.time) {
                    nextCandles = [
                      ...prev.slice(-250),
                      {
                        time: candleTime,
                        open,
                        high,
                        low,
                        close,
                        volume,
                      },
                    ];
                  } else {
                    return prev;
                  }
                  setTechnicalSummary(computeTechnicalSummary(nextCandles));
                  return nextCandles;
                });
                setSelectedSymbol((prev) => ({ ...prev, price: close }));
                setOrderBook(generateOrderBook(close, selectedSymbol.precision));
                return;
              }
            }

            // C. Single Price Tick (Trade/MiniTicker): { price }, { p }, { close }, { last }, { c }
            const singlePrice = parseFloat(
              data.price ?? data.p ?? data.last ?? data.c ?? (data.data && (data.data.price ?? data.data.p))
            );
            if (!isNaN(singlePrice) && singlePrice > 0) {
              setCandles((prev) => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const tfSec = timeframeToSeconds(timeframe);
                const nowSec = Math.floor(Date.now() / 1000);

                let updated: Candle[];
                if (nowSec - last.time >= tfSec) {
                  updated = [
                    ...prev.slice(-250),
                    {
                      time: nowSec,
                      open: last.close,
                      high: Math.max(last.close, singlePrice),
                      low: Math.min(last.close, singlePrice),
                      close: singlePrice,
                      volume: 1,
                    },
                  ];
                } else {
                  updated = [
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      high: Math.max(last.high, singlePrice),
                      low: Math.min(last.low, singlePrice),
                      close: singlePrice,
                      volume: (last.volume || 0) + 0.1,
                    },
                  ];
                }
                setTechnicalSummary(computeTechnicalSummary(updated));
                return updated;
              });
              setSelectedSymbol((prev) => ({ ...prev, price: singlePrice }));
              setOrderBook(generateOrderBook(singlePrice, selectedSymbol.precision));
            }
          } catch (err) {
            console.error('Error parsing live websocket message:', err);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          if (isUsingCustomWs) {
            setWsStatus('disconnected');
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (isUsingCustomWs) {
            setWsStatus('disconnected');
          }
        };
      } catch {
        setIsConnected(false);
        if (isUsingCustomWs) {
          setWsStatus('disconnected');
        }
      }
    }

    // High-frequency continuous tick generator (active when no live socket or for simulated non-crypto pairs)
    if (!isUsingCustomWs && !selectedSymbol.binanceSymbol) {
      fallbackInterval = setInterval(() => {
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const tfSec = timeframeToSeconds(timeframe);
          const nowSec = Math.floor(Date.now() / 1000);

          const delta = (Math.random() - 0.49) * (last.close * 0.0008);
          const newClose = Number((last.close + delta).toFixed(selectedSymbol.precision));
          const newHigh = Math.max(last.high, newClose);
          const newLow = Math.min(last.low, newClose);
          const newVol = Number((last.volume + Math.random() * 0.5).toFixed(2));

          let updated: Candle[];
          if (nowSec - last.time >= tfSec) {
            updated = [
              ...prev.slice(-250),
              {
                time: nowSec,
                open: last.close,
                high: Math.max(last.close, newClose),
                low: Math.min(last.close, newClose),
                close: newClose,
                volume: Math.floor(Math.random() * 5 + 1),
              },
            ];
          } else {
            updated = [
              ...prev.slice(0, -1),
              {
                ...last,
                high: newHigh,
                low: newLow,
                close: newClose,
                volume: newVol,
              },
            ];
          }

          setSelectedSymbol((s) => ({
            ...s,
            price: newClose,
          }));
          setOrderBook(generateOrderBook(newClose, selectedSymbol.precision));
          setTechnicalSummary(computeTechnicalSummary(updated));
          setIsConnected(true);

          return updated;
        });
      }, 1200);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [selectedSymbol.id, selectedSymbol.binanceSymbol, selectedSymbol.precision, timeframe, isCustomWsActive, customWsUrl]);

  // Drawing Handlers
  const handleAddDrawing = useCallback((drawing: DrawingItem) => {
    setDrawings((prev) => [...prev, drawing]);
    // Reset to cursor after completing drawing tool
    if (activeTool !== 'cursor') {
      setActiveTool('cursor');
    }
  }, [activeTool]);

  const handleRemoveDrawing = useCallback((id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleClearDrawings = useCallback(() => {
    setDrawings([]);
  }, []);

  // Indicators Toggle Handler (Persisted in localStorage)
  const handleToggleIndicator = useCallback((id: string) => {
    setIndicators((prev) => {
      const updated = prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
      try {
        localStorage.setItem('trading_indicators', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Screenshot Snapshot
  const handleTakeScreenshot = () => {
    const chartCanvas = document.querySelector('canvas');
    if (chartCanvas) {
      try {
        const link = document.createElement('a');
        link.download = `tradingview-${selectedSymbol.id}-${timeframe}.png`;
        link.href = chartCanvas.toDataURL('image/png');
        link.click();
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#131722] text-[#d1d4dc] overflow-hidden select-none font-sans">
      {/* 1. TOP NAVBAR */}
      <TopBar
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        chartType={chartType}
        onSelectChartType={setChartType}
        onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
        activeIndicatorsCount={indicators.filter((i) => i.enabled).length}
        onTakeScreenshot={handleTakeScreenshot}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
        isConnected={isConnected}
        overallRating={technicalSummary.overallAction}
        chartMode={chartMode}
        onSelectChartMode={setChartMode}
        timezone={timezone}
        onSelectTimezone={setTimezone}
        onOpenWsModal={() => setIsWsModalOpen(true)}
        isCustomWsActive={isCustomWsActive}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        {chartMode === 'tradingview' ? (
          /* --- 100% REAL TRADINGVIEW ADVANCED CHART MODE --- */
          <div className="flex-1 flex w-full h-full relative overflow-hidden">
            {/* Real TradingView Chart Engine */}
            <div className="flex-1 h-full w-full relative">
              <TradingViewRealChart
                symbol={selectedSymbol}
                timeframe={timeframe}
                timezone={timezone}
                language={language}
              />
            </div>

            {/* Optional Floating Paper Trading / Order Book Side Panel in TradingView Mode */}
            {showSidebarInTvMode && (
              <div className="w-80 h-full border-l border-[#2a2e39] bg-[#171b26] z-20 shrink-0 animate-in slide-in-from-right duration-200">
                <RightSidebar
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  orderBook={orderBook}
                  technicalSummary={technicalSummary}
                  language={language}
                />
              </div>
            )}

            {/* Quick Button to toggle Paper Trading Drawer while viewing Real TradingView */}
            <button
              id="toggle-tv-paper-panel-btn"
              onClick={() => setShowSidebarInTvMode(!showSidebarInTvMode)}
              className="absolute right-4 top-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e222d]/95 hover:bg-[#2962ff] text-white text-xs font-semibold shadow-2xl border border-[#2a2e39] backdrop-blur-md transition-all"
            >
              <span>
                {showSidebarInTvMode
                  ? language === 'bn'
                    ? '✕ প্যানেল বন্ধ করুন'
                    : '✕ Close Panel'
                  : language === 'bn'
                  ? '⚡️ পেপার ট্রেডিং ও বুক'
                  : '⚡️ Paper Trading & Book'}
              </span>
            </button>
          </div>
        ) : (
          /* --- CUSTOM TERMINAL & SIMULATOR MODE --- */
          <>
            {/* Left Vertical Drawing Toolbar */}
            <DrawingToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onClearDrawings={handleClearDrawings}
              drawingsCount={drawings.length}
              language={language}
            />

            {/* Central Chart & Sub-Pane Container */}
            <ChartContainer
              candles={candles}
              chartType={chartType}
              indicators={indicators}
              activeTool={activeTool}
              drawings={drawings}
              onAddDrawing={handleAddDrawing}
              onRemoveDrawing={handleRemoveDrawing}
              language={language}
              precision={selectedSymbol.precision}
              timeframe={timeframe}
            />

            {/* Right Collapsible Sidebar (Watchlist, Orderbook, Technical Summary Gauge, Paper Trading) */}
            <RightSidebar
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              orderBook={orderBook}
              technicalSummary={technicalSummary}
              language={language}
            />
          </>
        )}
      </div>

      {/* 3. BOTTOM TICKER & STATUS BAR */}
      <BottomBar language={language} />

      {/* Indicators Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
        language={language}
      />

      {/* Custom WebSocket API Modal */}
      <WebSocketConfigModal
        isOpen={isWsModalOpen}
        onClose={() => setIsWsModalOpen(false)}
        customWsUrl={customWsUrl}
        isCustomWsActive={isCustomWsActive}
        wsStatus={wsStatus}
        wsMessagesCount={wsMessagesCount}
        lastWsMessage={lastWsMessage}
        onSaveAndConnect={handleSaveAndConnectWs}
        onResetToDefault={handleResetWsToDefault}
        language={language}
      />
    </div>
  );
}
