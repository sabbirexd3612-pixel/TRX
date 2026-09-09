import React, { useState, useMemo } from 'react';
import { MarketSymbol, Timeframe } from '../types';
import { Loader2 } from 'lucide-react';

interface TradingViewRealChartProps {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  timezone?: string;
  theme?: 'dark' | 'light';
  language?: string;
}

export function getTradingViewSymbol(symbolId: string): string {
  switch (symbolId) {
    case 'BTCUSDT':
      return 'BINANCE:BTCUSDT';
    case 'ETHUSDT':
      return 'BINANCE:ETHUSDT';
    case 'SOLUSDT':
      return 'BINANCE:SOLUSDT';
    case 'BNBUSDT':
      return 'BINANCE:BNBUSDT';
    case 'XRPUSDT':
      return 'BINANCE:XRPUSDT';
    case 'XAUUSD':
      return 'OANDA:XAUUSD';
    case 'EURUSD':
      return 'FX:EURUSD';
    case 'NDX':
      return 'NASDAQ:NDX';
    case 'AAPL':
      return 'NASDAQ:AAPL';
    case 'NVDA':
      return 'NASDAQ:NVDA';
    case 'TSLA':
      return 'NASDAQ:TSLA';
    default:
      if (symbolId.endsWith('USDT')) {
        return `BINANCE:${symbolId}`;
      }
      return symbolId;
  }
}

export function getTradingViewInterval(tf: Timeframe): string {
  switch (tf) {
    case '1s':
      return '1';
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '1h':
      return '60';
    case '4h':
      return '240';
    case '1D':
      return 'D';
    case '1W':
      return 'W';
    default:
      return '15';
  }
}

export const TradingViewRealChart: React.FC<TradingViewRealChartProps> = ({
  symbol,
  timeframe,
  timezone = 'Etc/UTC',
  theme = 'dark',
  language = 'en',
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const tvSymbol = getTradingViewSymbol(symbol.id);
  const tvInterval = getTradingViewInterval(timeframe);

  const iframeUrl = useMemo(() => {
    setIsLoading(true);
    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: timezone,
      theme: theme,
      style: '1',
      locale: language === 'bn' ? 'en' : 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      studies: [],
      watchlist: [
        'BINANCE:BTCUSDT',
        'BINANCE:ETHUSDT',
        'BINANCE:SOLUSDT',
        'BINANCE:BNBUSDT',
        'BINANCE:XRPUSDT',
        'OANDA:XAUUSD',
        'FX:EURUSD',
        'NASDAQ:NDX',
        'NASDAQ:NVDA',
        'NASDAQ:TSLA',
        'NASDAQ:AAPL',
      ],
    };

    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(
      JSON.stringify(config)
    )}`;
  }, [tvSymbol, tvInterval, timezone, theme, language]);

  return (
    <div className="relative w-full h-full bg-[#131722] overflow-hidden flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#131722]/80 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-8 h-8 text-[#2962ff] animate-spin mb-2" />
          <div className="text-xs font-mono text-[#787b86]">
            Loading TradingView Chart ({tvSymbol})...
          </div>
        </div>
      )}

      {/* Official TradingView Advanced Widget iFrame */}
      <iframe
        key={iframeUrl}
        id="tradingview-advanced-iframe"
        title={`TradingView Advanced Chart - ${tvSymbol}`}
        src={iframeUrl}
        className="w-full h-full border-0 flex-1"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="fullscreen"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};
